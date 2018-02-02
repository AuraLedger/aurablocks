var tedious = require('tedious'),
	 fs = require('fs'),
	 Web3 = require("web3"),
	 web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

// edit sql_server_config.js with your connection settings 
var sql_config = require('sql_server_config').node;
var conn = new tedious.Connection(sql_config);

// Attempt to connect and start server if connection goes through
conn.on('connect', function(err) {
	 if (err) {
		  console.log(err)
	 }
	 else {
		  console.log('connected to ' + sql_config.server + ' (' + sql_config.options.database + ') as ' + sql_config.userName );
		  getMaxBlock();
		  console.log('node_watch running');
	 }
});

var checkInterval = 1000; // 1 sec 

//get current top block from database
var currentBlock;

function getMaxBlock() {
	 var sql = "select max(number) n from blocks";
	 var sql_request = new tedious.Request(sql, simpleErrorHandler);
	 sql_request.on('row', function(row){
		  currentBlock = row['n'].value;
		  mainLoop();
	 })
	 conn.execSql(sql_request);
}

var chainTip = web3.eth.blockNumber;

//keep a list of mempool transactions so we can add new ones
var mempool = {};

function mainLoop() {

	 if(currentBlock < chainTip)
	 {
		  currentBlock = currentBlock + 1;
		  insertBlock(web3.eth.getBlock(currentBlock, true));
	 }
	 else {
		  restart();
	 }

	 //TODO: check for mempool transactions
}

function restart() {
	 setTimeout(function() {
		  chainTip = web3.eth.blockNumber;
		  mainLoop();
	 }, checkInterval);
}

var txIdx; //transaction index
function insertBlock(block) {
	 console.log("inserting block " + block.number);
	 sql_request = new tedious.Request('insertBlock', simpleErrorHandler);
	 sql_request.addParameter('number', tedious.TYPES.BigInt, block.number);
	 sql_request.addParameter('hash', tedious.TYPES.VarChar, block.hash);
	 sql_request.addParameter('parentHash', tedious.TYPES.VarChar, block.parentHash);
	 sql_request.addParameter('miner', tedious.TYPES.VarChar, block.miner);
	 sql_request.addParameter('difficulty', tedious.TYPES.BigInt, block.difficulty);
	 sql_request.addParameter('size', tedious.TYPES.Int, block.size);
	 sql_request.addParameter('gasUsed', tedious.TYPES.Int, block.gasUsed);
	 sql_request.addParameter('tranCount', tedious.TYPES.Int, block.transactions.length);
	 sql_request.addParameter('timestamp', tedious.TYPES.BigInt, block.timestamp);

	 sql_request.on('doneProc', function(rowCount, more, returnStatus) {
		  console.log('done inserting block, returnStatus: ' + returnStatus);
		  txIdx = 0;
		  insertTransaction(block);
	 });

	 conn.callProc(sql_request);
}

function insertTransaction(block) {
	 if(txIdx >= block.transactions.length)
		  mainLoop();
	 else
	 {
		  var tx = block.transactions[txIdx];
		  sql_request = new tedious.Request('insertTran', simpleErrorHandler);
		  sql_request.addParameter('hash', tedious.TYPES.VarChar, tx.hash);
		  sql_request.addParameter('blockHash', tedious.TYPES.VarChar, block.hash);
		  sql_request.addParameter('from', tedious.TYPES.VarChar, tx.from);
		  sql_request.addParameter('to', tedious.TYPES.VarChar, tx.to);
		  sql_request.addParameter('value', tedious.TYPES.BigInt, tx.value);
		  sql_request.addParameter('gasPrice', tedious.TYPES.BigInt, tx.gasPrice);
		  sql_request.addParameter('gas', tedious.TYPES.Int, tx.gas);
		  sql_request.addParameter('status', tedious.TYPES.Int, tx.status);

		  sql_request.on('doneProc', function(rowCount, more, returnStatus) {
				txIdx = txIdx + 1;
				insertTransaction(block);
		  });

		  conn.callProc(sql_request);
	 }
}

function simpleErrorHandler(err) {
	 if(err) {
		  console.error(err);
		  restart();
	 }
}

// Attempt to connect and start server if connection goes through
conn.on('connect', function(err) {
	 if (err) {
		  console.log(err)
	 }
	 else {
		  console.log('connected to ' + sql_config.server + ' (' + sql_config.options.database + ') as ' + sql_config.userName );
		  app.listen(port);
		  console.log('RESTful API server listening on: ' + port);
	 }
});


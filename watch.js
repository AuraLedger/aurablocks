var mongoClient = require('mongodb').MongoClient,
  fs = require('fs'),
  Web3 = require('web3'),
  config = require('./config.js'),
  web3 = new Web3(new Web3.providers.HttpProvider(config.aura_rpc_url));

var blocks;
var chainHeight;
var dbHeight;

web3.eth.getBlockNumber().then( r => {
  chainHeight = r;
  start();
});

// Attempt to connect and start server if connection goes through
function start() {
  mongoClient.connect(config.mongo_conn_str, function (err, db) {
    if (err) {
      console.log(err)
    }
    else {
      blocks = db.db('aura').collection('blocks');
      console.log('connected to mongo aura db');
      getMaxBlock();
      console.log('watcher running');
    }
  });
}

var checkInterval = 5000; // 5 sec 

//get current top block from database
var dbHeight;

function getMaxBlock() {
  //get max block number
  blocks.find().sort({number:-1}).limit(1).next(function(err, result) { 
    if(err)
    {
      console.log(err);
      console.log('unable to get current db block, check your blocks collection');
      console.log('exiting');
    } else {
      if(result)
        dbHeight = result.number + 1;
      else
        dbHeight = 0;
      mainLoop();
    }
  });
}


//keep a list of mempool transactions so we can add new ones
var mempool = {};

function mainLoop() {

  if(dbHeight < chainHeight)
  {
    web3.eth.getBlock(dbHeight, true).then( b => {
      insertBlock(b);
    }, err => {
      console.log(err);
      restart();
    });
  }
  else {
    restart();
  }

  //TODO: check for mempool transactions
}

function restart() {
  setTimeout(function() {
    web3.eth.getBlockNumber().then( n => {
      chainHeight = n;
      mainLoop();
    }, err => {
      console.log(err);
      restart();
    });
  }, checkInterval);
}

function insertBlock(block) {
  makeLower(block);
  blocks.insert(block, function(err, result) {
    if(err) {
      console.log(err);
      restart();
    } else{
      dbHeight = dbHeight + 1;
      mainLoop();
    }
  });
}

//make hash/address fields lowercase
function makeLower(block) {
  if(block.hash) block.hash = block.hash.toLowerCase();
  if(block.miner) block.miner = block.miner.toLowerCase();
  for(var i = 0; i < block.transactions.length; i++)
    makeTxLower(block.transactions[i]);
}

function makeTxLower(tx) {
  if(tx.hash) tx.hash = tx.hash.toLowerCase();
  if(tx.from) tx.from = tx.from.toLowerCase();
  if(tx.to) tx.to = tx.to.toLowerCase();
}

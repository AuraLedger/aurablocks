var express = require('express'),
	 app = express(),
	 port = process.env.PORT || 3000,
	 tedious = require('tedious');

// edit sql_server_config.js with your connection settings 
var sql_config = require('sql_server_config').api;
sql_config.options.rowCollectionOnRequestCompletion = true; //required for this implementation
var conn = new tedious.Connection(sql_config);

//define routes
app.route('/blocks').get( function(req, res) {
	 callProc('getrecentblocks', res);
});

app.route('/blocks/:hash').get(function(req, res) {
	 sql_request = new tedious.Request('getrecentblocks', function(err, rowCount, rows) { handleResult(err, rows, res); });
	 sql_request.addParameter('lastHashStr', tedious.TYPES.VarChar, req.params.hash);
	 conn.callProc(sql_request);
});

app.route('/trans').get( function(req, res) {
	 callProc('getRecentTransactions', res);
});

app.route('/trans/:hash').get(function(req, res) {
	 sql_request = new tedious.Request('getRecentTransactions', function(err, rowCount, rows) { handleResult(err, rows, res); });
	 sql_request.addParameter('lastHashStr', tedious.TYPES.VarChar, req.params.hash);
	 conn.callProc(sql_request);
});


//helpers
function callProc(proc, res) {
	 sql_request = new tedious.Request(proc, function(err, rowCount, rows) { handleResult(err, rows, res); });
	 conn.callProc(sql_request);
}

function handleResult(err, rows, res) {
	 if(err) {
		  console.log(err);
		  res.send(err);
	 }
	 else {
		  res.json(rows);
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


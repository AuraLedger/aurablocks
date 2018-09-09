var express = require('express'),
  app = express(),
  port = process.env.PORT || 3005,
  mongoClient = require('mongodb').MongoClient,
  config = require('./config.js');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", config.cors);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//get db collection
var blocks;
var addresses;
mongoClient.connect(config.mongo_conn_str, function (err, db) {
  if (err) {
    console.log(err)
  }
  else {
    blocks = db.db('aura').collection('blocks');
    addresses = db.db('aura').collection('addresses');
    console.log('connected to mongo aura db');
    app.listen(port);
    console.log('restful api server listening on: ' + port);
  }
});

var minerfilter = {hash: 1, number: 1, timestamp: 1};
var bulkblockfilter = {difficulty: 1, hash: 1, number: 1, timestamp: 1, 'transactions.from': 1, 'transactions.to': 1, 'transactions.hash': 1, 'transactions.value': 1};
var bulktransfilter = {timestamp: 1, 'transactions.from': 1, 'transactions.to': 1, 'transactions.hash': 1, 'transactions.value': 1};

//define routes
app.route('/blocks').get( function(req, res) {
  blocks.find({}).project(bulkblockfilter).sort({number:-1}).limit(10).toArray(function(err, r) {
    handleResult(err, r, res);
  });
});

app.route('/blocks/:num').get( function(req, res) {
  blocks.find({number: {$gt: Number(req.params.num)}}).project(bulkblockfilter).sort({number:-1}).limit(10).toArray(function(err, r) {
    handleResult(err, r, res);
  });
});

app.route('/blocks/:beg/:end').get( function(req, res) {
  blocks.find({number: {$gte: Number(req.params.beg), $lte: Number(req.params.end)}}).project(bulkblockfilter).sort({number:-1}).limit(10).toArray(function(err, r) {
    handleResult(err, r, res);
  });
});

app.route('/blockn/:num').get(function(req, res) {
  blocks.find({number: Number(req.params.num)}).next( function(err, r) { handleResult (err, r, res); });
});

app.route('/block/:hash').get(function(req, res) {
  var h = req.params.hash.toLowerCase();
  if(!h.startswith('0x'))
    h = '0x' + h; 
  blocks.find({hash: h}).next( function(err, r) { handleResult (err, r, res); });
});

app.route('/recent/:addr').get(function(req, res) {
  var a = req.params.addr.toLowerCase();
  var q = {$or: [{'transactions.from': a}, {'transactions.to': a}]};
  var addrm = [{$match: q}, { $unwind: '$transactions' }, {$match: q}];
  var agg = blocks.aggregate(addrm.concat([{$sort: {number:-1}}, {$limit: 50}, {$project: bulktransfilter}]));
  agg.toArray(function(err, r) { handleResult (err, r, res); });
});

app.route('/trans/:addr/:skip').get(function(req, res) {
  var a = req.params.addr.toLowerCase();
  var s = Number(req.params.skip);
  var q = {$or: [{'transactions.from': a}, {'transactions.to': a}]};
  blocks.aggregate([{$match: q}, { $unwind: '$transactions' }, {$match: q}, {$sort: {number: -1}}, {$skip: s}, {$limit: 50}, {$project: bulktransfilter}]).toArray(function(err, r) { handleResult (err, r, res); });
});

app.route('/tocount/:addr').get(function(req, res) {
  var a = req.params.addr.toLowerCase();
  var q = {'transactions.to': a};
  blocks.aggregate([{$match: q}, { $unwind: '$transactions' }, {$match: q}, {$group: {_id: 'transactions.to', count: {$sum: 1}}}]).next(function(err, r) { handleResult (err, r, res); });
});

app.route('/fromcount/:addr').get(function(req, res) {
  var a = req.params.addr.toLowerCase();
  var q = {'transactions.from': a};
  blocks.aggregate([{$match: q}, { $unwind: '$transactions' }, {$match: q}, {$group: {_id: 'transactions.from', count: {$sum: 1}}}]).next(function(err, r) { handleResult (err, r, res); });
});

app.route('/miner/:addr').get(function(req, res) {
  var a = req.params.addr.toLowerCase();
  blocks.find({miner: a}).project(minerfilter).sort({number:-1}).limit(50).toArray( function(err, r) { handleResult (err, r, res); });
});

app.route('/miners/:addr/:skip').get(function(req, res) {
  var a = req.params.addr.toLowerCase();
  var s = Number(req.params.skip);
  blocks.find({miner: a}).project(minerFilter).sort({number:-1}).skip(s).limit(50).toArray( function(err, r) { handleResult (err, r, res); });
});

app.route('/richlist/:limit').get(function(req, res) {
  var s = Number(req.params.limit);
  if(s > 500) s = 500;
  if(s < 1) s = 1;
  s = Math.floor(s);
  addresses.find().sort({balance: -1}).limit(s).toArray( function(err, r) { handleResult (err, r, res); });
});

function handleResult(err, rows, res) {
  if(err) {
    console.log(err);
    res.send(err);
  }
  else {
    res.json(rows);
  }
}

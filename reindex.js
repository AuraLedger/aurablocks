var mongoClient = require('mongodb').MongoClient,
  config = require('./config.js');

mongoClient.connect(config.mongo_conn_str, function (err, db) {
  if (err) {
    console.log(err)
  }
  else {
    console.log('connected to mongodb');
    var blocks = db.db('aura').collection('blocks');
    console.log('dropping indexes');
    blocks.dropIndex('*');
    console.log('creating indexes');
    blocks.createIndex({number: -1});
    blocks.createIndex({miner: -1}); 
    blocks.createIndex({hash: -1});
    blocks.createIndex({'transactions.from': -1});
    blocks.createIndex({'transactions.to': -1});
    db.close();
    console.log('done creating indexes');
  }
});


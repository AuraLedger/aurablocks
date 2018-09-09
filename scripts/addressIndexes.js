var mongoClient = require('mongodb').MongoClient,
  config = require('../config.js');

mongoClient.connect(config.mongo_conn_str, function (err, db) {
  if (err) {
    console.log(err)
  }
  else {
    console.log('connected to mongodb');
    var addresses = db.db('aura').collection('addresses');
    console.log('creating indexes');
    addresses.dropIndex('*');
    addresses.createIndex({balance: -1});
    db.close();
    console.log('done creating indexes');
  }
});


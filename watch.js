var mongoClient = require('mongodb').MongoClient,
  fs = require('fs'),
  Web3 = require('web3'),
  config = require('./config.js'),
  web3 = new Web3(new Web3.providers.HttpProvider(config.aura_rpc_url));

var blocks;
var addresses;
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
      addresses = db.db('aura').collection('addresses');
      console.log('connected to mongo aura db');
      getMaxBlock();
      console.log('watcher running');

      initRich();
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
  preprocessBlock(block);
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
//update changed addresses
function preprocessBlock(block) {
  if(block.hash) block.hash = block.hash.toLowerCase();
  if(block.miner) block.miner = block.miner.toLowerCase();
  for(var i = 0; i < block.transactions.length; i++) {
    makeTxLower(block.transactions[i]);
    updateAddressBalance(block.transactions[i]);
  }
}

function makeTxLower(tx) {
  if(tx.hash) tx.hash = tx.hash.toLowerCase();
  if(tx.from) tx.from = tx.from.toLowerCase();
  if(tx.to) tx.to = tx.to.toLowerCase();
}

function updateAddressBal(b, adr) {
    var bal = web3.utils.fromWei(b, 'ether');
    
    if(bal.hasOwnProperty('toNumber'))
        bal = bal.toNumber();
    else
        bal = Number(bal);

    addresses.replaceOne({_id: adr}, {_id: adr, balance: bal}, {upsert: true}, function(err, result) {
        if(err) {
            console.log('error in replaceOne for address balance update');
            console.log(err);
        }     
    });
}

function updateAddressB(adr) {
    try {
        web3.eth.getBalance(adr).then( b => {
            updateAddressBal(b, adr);
        }, err => {
            console.error('web3 error, failed to update address balance for transaction');
            console.error(err);
        });
    } catch(err) {
        console.error('uncaught error, failed to update address balance for transaction');
        console.error(err);
    }
}

function updateAddressBalance(tx) {
    updateAddressB(tx.from);
    updateAddressB(tx.to);
}

function initRich() {
    var currentRich = [

"0x47Ead7D1AA40674634de5b2AF86b93C48AdfF55b",
"0x602D0BD3091B46496D18015F9B92da6f753184Fe",
"0x39816E62F758CBaF56cfc02c6BC13B2b7c8F4acf",
"0xb8Cb6a9bC5a52B9cFcE26869E627b2af0Ff5ed4A",
"0x1D0543EE12F83149a02Cb006c4d81151b88045c4",
"0xd2B27bEC33771Fb8E2Fd22E18B5E1BAA208cBF09",
"0x0dEF192C784487B78F5Cb27683DbA3f7FF336aE6",
"0xeB273188Aa92686fCE6e2ef76902B642aF8e3a66",
"0x6104209de0791F2e273Df822a82f2DB9d6C48c3B",
"0x17d86d6273B42394592DebFdF24F77E071c00Af5",
"0x5ED67282bEb12aD54943DEDB133aE2eB9CD75e83",
"0xC737066e2F74DF85aE83495bF05F0c849c40F547",
"0x66d434D922516177aD0B2F4623F5D876cA1b5A0b",
"0xd430b8A25b253Da99939eFfA34c9396F47D7cfeF",
"0xe639Db97706030Cc9be0E2eDee1f96c947660673",
"0x0074d9dCa64a1198D8e2Da8B8D46A9FfE3E55818",
"0xc96f0200d29eAeAc9febFd5FC0ecae26a4a12e5A",
"0xc907E4b56ea6496E524e583e781804D877CE3a78",
"0xc0bFd925Bfe6D93D04063b79bB42DB42a4Fa6256",
"0x182F17397Ba3a993ae7708a0EfAbF908FEb23856",
"0x19BE2077d1D47702a40f1FC25Bfa8D241d894a31",
"0x36E5A73453441e4dAC4cB80F10597A68F6b44793",
"0x2868602e9cc3d42B46Df00d0380468AC50125968",
"0xDe5684531381955B1B7E8192943e471523fFa173",
"0xc17Ff944Eea508BaBfeC7e3D407C477c1276d33C",
"0x9021d7AfE734A9Cbba3012612498ef96Fe13b059",
"0x121806d6D9f92002ff4C78f2EeA6944F13d310A2",
"0x020bC2bb2C6FE098d87B8f03876586B536E98A5a",
"0xb05a5e16eA99Fdf4Db502F6A6aD843342fD08940",
"0x16a3BE0F43F72F45FF49F148427Eb8E97391B6d9",
"0xff0B5895b351A58E324aA4B204D9E6097ae285E8",
"0x2C54Ada35895e2cf7008890eAbd6C8a72BB34ae3",
"0xd5f415aAF28078d5A5f25992464BACe576CD680E",
"0x3081299244B003F01740307041BeA44932C2ACda",
"0x7eAa35562A7fba93c5e011373A0117346C2e331c",
"0x82d130f82Dc1d40F0Ad69bbb3156352220CcD2bB",
"0xF8C82c1F5CB49561FFe6658BB924d9F25173a767",
"0x601f85Aac8406af950Cae5e00E3C5929D1311196",
"0xA327EA46191E823ce72c5E82412E8A8BDAF22EC3",
"0x5AeD8128047263D8fBad87E23Ea3eF9bD2D6BD83",
"0x9F700b7506E62Fd4AfA847f550e167859Cfdc154",
"0x65Bb3c1dB29BB0f65EaD7fd4b8415b3730B3898D",
"0xfE23E978B3D6E13F29421dd7ee157F64E509b15F",
"0x3C79884dE12d4d599B7eCcECbf6914491e9E8cB1",
"0x76213747f7D057912789e6b64b91bFB1AB5090c4",
"0x24E9aa5F3EDdEE44A97ed41aa16c9af50824F3A1",
"0xa5724624269B837575920cf26D6E6E509A293F8f",
"0x795C330AF277F8BFCF4dE5B4e4081D7F3566FdCE",
"0x5408D296B90875D8A143a495Dd5c1a9FF386f3a9",
"0xBeB467aA1E1A9Ff6fe91D2D72e4C8A48EB4eCe22",
"0x9e5F86e7FdB5b63534dEf0BAd8C273468F5CaD91",
"0xf4387aB33B5A6c69AFc74aAa530089E13FFB0e9E",
"0xe7827cfc80a768b1AED53FC2b2F0FAbf97D7d78b",
"0xBECe37A303269F39CcaEe723208aE57a6FBbEc01",
"0x105d8ED0E43c4E7B2e838925186237C6215D52aa",
"0x1B0Cd5295B91AF9f9004fD5C2cf82e6531E0DCE9",
"0xab2fB7E0A57B6C37C83a314E380e3C310a69478C",
"0x8FcaFecADda196d75544E18F3C3406a571F78CeA",
"0x0d36131a4f1Eb92fdd1bb935cd2FEf366031b05D",
"0x75923A28771E8fBBEfDdC26ADA4aed8081638878",
"0x4Da0b33da9D0F8568a52Ab0e14FBB19301c6c6D3",
"0x04ebdbd16cb22ac42b04308fDE9a44Eb39a4D3A7",
"0xA099A0079827206dB03cFb91F9A0865217B0CA9B",
"0xF9cB083DA2B070F8Ae13eF0a7793CdEc3671231c",
"0x1423eec1CD4e5EE53d5241D53B3653e8907c11D7",
"0x9c5338F1bc348f4383Ebab916f14C813d79D760b",
"0xB62caaDff1a2D61483E82c41c81915b6cB0798B6",
"0x6E0db7e948dA2ED68F64F6FA8e3eE7D5EFed5E94",
"0x9e3EF298b0217CB49154171964c207Fc372d8Fc7",
"0x230E4997047F73dAE5e31F94E62B5ba1d30c344d",
"0x53c60ABdeD8e61cAFd2005949432bB5D37f57e7b",
"0x8E8d8eC6d61A24C7BE9a4ddC4C5eE630Da75824b",
"0x6372E08c3d92874a44CC00C2a40278F04205aaBf",
"0x5c83CB3967DbaB0b09bf50a459782528e7d04F62",
"0x0274dC03E973c03D381c908288b56178a0D9b13B",
"0x00bb918625AD28B1c8D6642D9C84CFa9f32a8d66",
"0xE884658215b25aFa4beBDD189Fc3575AAf79503A",
"0x99CF3bBf62726a453A1988651bDd32a3864e2BF1",
"0x026b4f302c815003c5CC3909E0a5648BC4c04df7",
"0xcc4d0ecE0c6E7a25fEE521B9B50C11dCF5EC056f",
"0xF6b2785eEc6Ef7050cE252275c5ee72aE90EF830",
"0x166ebC0ABA0051b820178D44c17Fa85f92EEb9f8",
"0x8237318A4480b659b88F28DBb97E91dccc91fF02",
"0xFA193312655f79C7b0ee7D7EF904486836180026",
"0x5e41ac8fF0E48eAb1314bF393EF78710522531db",
"0x6437d489866B4bab17c97C32ec2cea9e5BfC9a1C",
"0x54CF6AC878C2dB6c8F071087f3C0a3d7a73Cce38",
"0x919e5F6014fA6B9E1eA64B2c4DE72E2Cae0Ac147",
"0x4b90A29D6c545C44d9dd8272Fa84a4def475d781",
"0x76783a4abF6c82ff70Fd8f5D2Ee87276881c5F31",
"0xdaCA9b2A9d2345d92f220e685FB4471c26efdaEd",
"0x6bAe4A7C1E4E8aDd2601fe316f3896e1373Dd70f",
"0xeBEc9511cCba7624F2D94B5728049fbeE838386c",
"0xec42Db1ebd70fDC5083Da516d917FC18514a75b1",
"0x66D5C085eAf4fBF58Bc065F1c8d7e664977A6783",
"0x8A93D869E688Dae613872A0917346cf36A30120F",
"0xfD1B2eaC3910d6eA5f9d51e7c22cc2950BaEF738",
"0xf73D26238794E0A9a6300f476Aa82885a22C30af",
"0xA9360fe8d3DF79A2568Ae731e534f3672216b2B5",
"0x945e71eAAc772fC5C311Bb528A21AA8841F2491e"

    ];

    for(var i = 0; i < currentRich.length; i++)
        updateAddressB(currentRich[i].toLowerCase());
}

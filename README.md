# aurablocks
This project does two things:
* Imports Aura/ethereum blocks into a mongo db
* Exposes a rest api into the db

# Getting started

```
git clone https://github.com/AuraLedger/aurablocks
cd aurablocks
npm install
```

# Configure db, rpc, cors
Adjust `config.sample.js` to your liking and save as `config.js`

# Start importing blocks
`npm run watch`

This kicks off a nodejs process that continuously imports blocks from a geth node via rpc

# Create db indexes
`npm run reindex`

Create or recreate indexes on block number/hash/miner and transaction from/to

# Start the rest api
`npm start`

This starts an Express app at http://localhost:3005.
See server.js for available api methods.

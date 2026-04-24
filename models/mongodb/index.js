'use strict'
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const db = {}
const config = require('config')
const logger = require('../../helpers/logger')

// Prefer an env-var connection string (supports credentials & replica sets)
// so the deployer never has to commit a MongoDB username/password to config
// files. Falls back to config('db.uri') for backwards compatibility.
const mongoUri = process.env.MONGO_URI || process.env.DB_URI || config.get('db.uri')

// Emit only the host portion of the URI so credentials embedded in the URI
// never hit stdout.
function maskedUri (uri) {
    try { return String(uri).replace(/\/\/([^@]+)@/, '//***@') } catch (e) { return 'mongodb://***' }
}
logger.info('Connecting to MongoDB at %s', maskedUri(mongoUri))

mongoose.Promise = global.Promise
mongoose.set('useCreateIndex', true)
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
},
(err) => {
    if (err) {
        logger.error('MongoDB connection error: %s', err.message || err)
        process.exit(1)
    }
})

// import all file in this dir, except index.js
fs.readdirSync(__dirname)
    .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js')
    })
    .forEach(function (file) {
        var model = require(path.join(__dirname, file))
        db[model.modelName] = model
    })

db.mongoose = mongoose
module.exports = db

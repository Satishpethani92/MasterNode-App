'use strict'
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const db = {}
const config = require('config')

console.log((config.get('db.uri')))

mongoose.Promise = global.Promise
mongoose.set('useCreateIndex', true)
mongoose.connect(config.get('db.uri'), {
    useNewUrlParser: true
},
(err) => {
    if (err) {
        console.error('Mongodb Connection error!!!')
        process.exit()
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

// One-time compatibility migration for TruliooSession indexes.
// Older deployments used a unique walletAddress index, which blocks separate
// individual/company records for the same wallet.
mongoose.connection.once('open', async () => {
    try {
        const TruliooSession = db.TruliooSession
        if (!TruliooSession) return

        const indexes = await TruliooSession.collection.indexes()
        const hasLegacyWalletIndex = indexes.some((idx) => idx.name === 'walletAddress_1')

        if (hasLegacyWalletIndex) {
            await TruliooSession.collection.dropIndex('walletAddress_1')
            console.log('[TruliooSession] Dropped legacy index walletAddress_1')
        }

        await TruliooSession.collection.createIndex(
            { walletAddress: 1, kycType: 1 },
            { unique: true, name: 'walletAddress_1_kycType_1' }
        )
        console.log('[TruliooSession] Ensured index walletAddress_1_kycType_1')
    } catch (e) {
        console.error('[TruliooSession] Index migration warning:', e.message)
    }
})

db.mongoose = mongoose
module.exports = db

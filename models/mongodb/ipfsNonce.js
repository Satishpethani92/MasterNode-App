'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

/**
 * Single-use nonces for /api/ipfs/addKYC. Each nonce is bound to one xdc
 * account, issued by /api/ipfs/requestKYCNonce, and consumed on successful
 * upload. The TTL index causes MongoDB to evict documents automatically
 * 5 minutes after creation, giving us a hard replay-window upper bound that
 * survives process restarts.
 */
const IpfsNonce = new Schema({
    nonce: { type: String, unique: true, index: true },
    account: { type: String, required: true, index: true },
    consumed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 300 }
}, {
    versionKey: false
})

module.exports = mongoose.model('IpfsNonce', IpfsNonce)

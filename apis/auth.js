'use strict'
const express = require('express')
const config = require('config')
const router = express.Router()
const utils = require('ethereumjs-util')
const db = require('../models/mongodb')
const logger = require('../helpers/logger')

const uuidv4 = require('uuid/v4')
const urljoin = require('url-join')
const { check, validationResult, query } = require('express-validator/check')

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
// Login signatures older than this are rejected at verify time to curb QR-phishing
// replay windows.
const LOGIN_SIGNATURE_TTL_MS = 5 * 60 * 1000

function isValidUuid (id) {
    return typeof id === 'string' && UUID_V4_REGEX.test(id)
}

router.get('/generateLoginQR', async (req, res, next) => {
    try {
        // Embed the id inside the signed message so an attacker cannot swap the
        // signed message produced for a victim's id onto another attacker-generated
        // id (QR-code relay attack).
        const id = uuidv4()
        const issuedAtIso = new Date().toISOString()
        const message = `[XDCmaster ${issuedAtIso}] Login id=${id}`
        res.send({
            message,
            url: urljoin(config.get('baseUrl'), `api/auth/verifyLogin?id=${id}`),
            id
        })
    } catch (e) {
        next(e)
    }
})

router.post('/verifyLogin', [
    query('id').isUUID(4).withMessage('id must be a UUID v4'),
    check('message').isLength({ min: 1, max: 2048 }).exists().withMessage('message is required'),
    check('signature').isLength({ min: 1, max: 256 }).exists().withMessage('signature is required'),
    check('signer').isLength({ min: 1, max: 128 }).exists().withMessage('signer is required')
], async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const message = String(req.body.message)
        const signature = String(req.body.signature)
        const id = req.query.id
        if (!isValidUuid(id)) {
            throw Error('wrong id format')
        }
        const signer = String(req.body.signer).toLowerCase()

        // Bind the signed message to this login id to prevent cross-id replay.
        if (message.indexOf(`id=${id}`) === -1) {
            throw Error('message does not reference this login id')
        }

        // Reject messages whose embedded timestamp is outside the TTL window.
        const tsMatch = message.match(/\[XDCmaster ([^\]]+)\]/)
        if (tsMatch) {
            const signedAt = Date.parse(tsMatch[1])
            if (!isNaN(signedAt) && Math.abs(Date.now() - signedAt) > LOGIN_SIGNATURE_TTL_MS) {
                throw Error('login signature expired')
            }
        }

        const signedAddress = (ecRecover(message, signature) || '').toLowerCase()

        if (signer !== signedAddress) {
            throw Error('The Signature Message Verification Failed')
        }

        // Store id, address, msg, signature
        let sign = await db.Signature.findOne({ signedAddress: signedAddress })
        if (sign && id === sign.signedId) {
            throw Error('Cannot use a QR code twice')
        } else {
            const data = {}
            data.signedId = id
            data.message = message
            data.signature = signature

            await db.Signature.findOneAndUpdate({ signedAddress: signedAddress }, data, { upsert: true, new: true })
        }
        return res.send('Done')
    } catch (e) {
        logger.warn('verifyLogin failed: %s', e.message || e)
        return next(e)
    }
})

router.get('/getLoginResult', [
    query('id').isUUID(4).withMessage('id must be a UUID v4')
], async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const messId = req.query.id
        if (!isValidUuid(messId)) {
            return next(new Error('wrong id format'))
        }

        const signature = await db.Signature.findOne({ signedId: messId })

        if (signature) {
            return res.json({
                user: signature.signedAddress
            })
        } else {
            return res.send({
                error: {
                    message: 'No data'
                }
            })
        }
    } catch (e) {
        next(e)
    }
})
// Get signed address
function ecRecover (message, signature) {
    const signatureBuffer = utils.toBuffer(signature)
    const signatureParams = utils.fromRpcSig(signatureBuffer)

    const buffer = Buffer.from(message)
    const msgBuffer = '0x' + buffer.toString('hex')
    const m = utils.toBuffer(msgBuffer)
    const msgHash = utils.hashPersonalMessage(m)

    const publicKey = utils.ecrecover(
        msgHash,
        signatureParams.v,
        signatureParams.r,
        signatureParams.s
    )
    const addressBuffer = utils.publicToAddress(publicKey)
    return utils.bufferToHex(addressBuffer)
}

module.exports = router

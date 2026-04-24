'use strict'
const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const IpfsClient = require('ipfs-http-client')
const uuidv4 = require('uuid/v4')
const { check, validationResult } = require('express-validator/check')
const web3 = require('../models/blockchain/web3rpc').Web3RpcInternal()
const db = require('../models/mongodb')
const logger = require('../helpers/logger')

const xinFinClient = new IpfsClient({
    host: 'ipfs.xinfin.network',
    port: 443,
    protocol: 'https'
})

const MAX_FILE_BYTES = 10 * 1024 * 1024
const NONCE_TTL_MS = 5 * 60 * 1000
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function toHexAddress (address) {
    if (!address || typeof address !== 'string') return ''
    const lower = address.toLowerCase()
    if (lower.startsWith('xdc')) return '0x' + lower.substring(3)
    return lower
}

function normalizeValue (value) {
    if (value === undefined || value === null) return ''
    return String(value).trim().replace(/^["']|["']$/g, '')
}

// Matches the IS_PRODUCTION heuristic in index.js / middlewares/error.js.
const IS_DEV_ENV = ['development', 'dev', 'test', 'local'].includes(String(process.env.NODE_ENV || '').toLowerCase())

function unauthorized (res, reason) {
    const payload = { message: 'Unauthorized' }
    if (IS_DEV_ENV) {
        payload.reason = reason
    }
    return res.status(401).json(payload)
}

function badRequest (res, reason) {
    const payload = { message: 'Bad Request' }
    if (IS_DEV_ENV) {
        payload.reason = reason
    }
    return res.status(400).json(payload)
}

if (!fs.existsSync(path.join(__dirname, '../tmp/'))) {
    fs.mkdirSync(path.join(__dirname, '../tmp/'), { recursive: true })
}

function sha256Hex (buf) {
    return '0x' + crypto.createHash('sha256').update(buf).digest('hex')
}

async function readUploadBuffer (file) {
    if (file.data && file.data.length > 0) {
        return file.data
    }
    if (file.tempFilePath) {
        return fs.promises.readFile(file.tempFilePath)
    }
    throw new Error('empty upload')
}

/**
 * Step 1 of the KYC upload flow.
 *
 * The client requests a per-upload nonce bound to their account. The client
 * then signs "[XDCmaster KYC <nonce>] Upload <fileHash> for <account>" and
 * submits that signature together with the file to /addKYC. This replaces
 * the old timestamp-only scheme that allowed any valid signed message to be
 * paired with any file within a 5-minute window (audit finding M-9).
 */
router.post('/requestKYCNonce', [
    check('account').isString().isLength({ min: 1, max: 128 })
        .exists().withMessage('account is required')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const account = normalizeValue(req.body.account).toLowerCase()
        if (!toHexAddress(account)) {
            return badRequest(res, 'invalid_account')
        }
        const nonce = uuidv4()
        await db.IpfsNonce.create({
            nonce,
            account,
            consumed: false,
            createdAt: new Date()
        })
        // The client must compute sha256(file) locally, substitute it into the
        // template, sign the resulting string with the account's private key,
        // and submit the signature alongside the file to /addKYC. The server
        // then re-derives the same string from the uploaded bytes and rejects
        // any mismatch (binds signature → file contents).
        const messageTemplate = `[XDCmaster KYC ${nonce}] Upload {fileHash} for ${account}`
        return res.json({
            nonce,
            messageTemplate,
            fileHashAlgorithm: 'sha256',
            fileHashEncoding: 'hex-with-0x-prefix',
            expiresInSeconds: NONCE_TTL_MS / 1000
        })
    } catch (e) {
        logger.warn('requestKYCNonce failed: %s', e.message || e)
        return next(e)
    }
})

/**
 * Step 2: actual upload.
 *
 * Required fields (body, headers or query): account, signedMessage, nonce,
 * and a single `filename` multipart field. The server rebuilds the expected
 * message using the file hash it just received, verifies the signature, and
 * consumes the nonce atomically so replay is impossible.
 */
router.post('/addKYC', async function (req, res, next) {
    try {
        const account = normalizeValue(req.body.account || req.headers['x-kyc-account'] || req.query.account).toLowerCase()
        const signedMessage = normalizeValue(req.body.signedMessage || req.headers['x-kyc-signature'] || req.query.signedMessage)
        const nonce = normalizeValue(req.body.nonce || req.headers['x-kyc-nonce'] || req.query.nonce)

        if (!account || !signedMessage || !nonce) {
            return unauthorized(res, 'missing_auth_fields')
        }
        if (!UUID_V4_REGEX.test(nonce)) {
            return unauthorized(res, 'invalid_nonce_format')
        }
        if (!req.files || !req.files.filename) {
            return badRequest(res, 'no_file_uploaded')
        }

        const uploaded = req.files.filename
        if (uploaded.truncated) {
            return badRequest(res, 'file_too_large')
        }
        if (typeof uploaded.size === 'number' && uploaded.size > MAX_FILE_BYTES) {
            return badRequest(res, 'file_too_large')
        }

        // 1) Atomically claim the nonce for this account. findOneAndUpdate with
        //    consumed:false is the MongoDB equivalent of a compare-and-swap.
        const nonceDoc = await db.IpfsNonce.findOneAndUpdate(
            { nonce, account, consumed: false },
            { $set: { consumed: true } },
            { new: false }
        )
        if (!nonceDoc) {
            return unauthorized(res, 'nonce_invalid_or_used')
        }
        if (Date.now() - new Date(nonceDoc.createdAt).getTime() > NONCE_TTL_MS) {
            return unauthorized(res, 'nonce_expired')
        }

        // 2) Hash the received file and recompute the expected message. The
        //    client MUST have signed exactly this message for this nonce +
        //    account + file; anything else is a replay or tampering attempt.
        const fileBuffer = await readUploadBuffer(uploaded)
        const fileHash = sha256Hex(fileBuffer)
        const expectedMessage = `[XDCmaster KYC ${nonce}] Upload ${fileHash} for ${account}`

        // 3) Recover the signer from the signature using both encodings web3
        //    historically accepted, so existing client code that prepends the
        //    Ethereum Signed Message prefix (personal_sign) still works.
        let recovered = ''
        const candidateMessages = [expectedMessage]
        try { candidateMessages.push(web3.utils.utf8ToHex(expectedMessage)) } catch (e) {}
        for (const candidateMessage of candidateMessages) {
            try {
                recovered = (await web3.eth.accounts.recover(candidateMessage, signedMessage) || '').toLowerCase()
                if (recovered) break
            } catch (e) {}
        }

        if (!recovered) {
            return unauthorized(res, 'signature_recover_failed')
        }
        const recoveredHex = toHexAddress(recovered)
        const accountHex = toHexAddress(account)
        if (!recoveredHex || !accountHex || recoveredHex !== accountHex) {
            return unauthorized(res, 'signer_mismatch')
        }

        // 4) Pin the file on IPFS.
        xinFinClient.add(fileBuffer, async (err, ipfsHash) => {
            if (err != null) {
                logger.warn('IPFS add failed: %s', err.message || err)
                return res.status(500).json({ message: 'IPFS upload failed' })
            }
            try {
                if (uploaded.tempFilePath) {
                    fs.unlink(uploaded.tempFilePath, () => {})
                }
            } catch (e) {}

            const hash = ipfsHash[0].hash
            return res.status(200).json({ hash, fileHash })
        })
    } catch (e) {
        logger.warn('addKYC failed: %s', e.message || e)
        return next(e)
    }
})

module.exports = router

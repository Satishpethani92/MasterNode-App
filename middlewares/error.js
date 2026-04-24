'use strict'
const logger = require('../helpers/logger')

// Matches the fail-secure check used in index.js: treat every non-dev env as
// production so error messages stay sanitized under NODE_ENV=mainnet/testnet
// as well as the unset case.
const IS_PRODUCTION = !['development', 'dev', 'test', 'local'].includes(String(process.env.NODE_ENV || '').toLowerCase())

function safeExtractValidatorMessage (err) {
    // Handle express-validator error arrays: [{param, msg, ...}, ...]
    if (Array.isArray(err) && err.length > 0 && err[0] && typeof err[0].msg === 'string') {
        return err[0].msg
    }
    return null
}

module.exports = function (err, req, res, next) {
    if (!err) return next()
    if (err === true) err = {}

    const status = parseInt(err.status, 10) || 406
    let message = (typeof err.message === 'string' && err.message)
        ? err.message
        : safeExtractValidatorMessage(err) || 'Not Acceptable'

    // Log at full fidelity, but never send raw stack/paths back to the client.
    if (status !== 401 && status !== 403) {
        logger.warn('request %s %s failed: %s', req.method, req.originalUrl, message)
    }

    return res.status(status).json({
        status,
        error: {
            message: IS_PRODUCTION ? sanitizeForClient(message) : message
        }
    })
}

// Strip filesystem paths and stack frames from client-facing error messages.
function sanitizeForClient (msg) {
    if (typeof msg !== 'string') return 'Error'
    return msg
        .replace(/\/[^\s'"`]+\.(js|ts|vue)(:\d+:\d+)?/g, '')
        .replace(/\s+at\s+[^\s]+\s+\([^)]*\)/g, '')
        .trim() || 'Error'
}

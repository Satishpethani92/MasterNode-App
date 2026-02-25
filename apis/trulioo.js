'use strict'
const express = require('express')
const axios = require('axios')
const router = express.Router()
const TruliooSession = require('../models/mongodb/truliooSession')
const { fetchTruliooStatus } = require('../helpers/fetchTruliooStatus')

const TRULIOO_FLOW_ID = process.env.TRULIOO_FLOW_ID
const TRULIOO_COMPANY_FLOW_ID = process.env.TRULIOO_COMPANY_FLOW_ID

// Optional: helper to normalize wallet address
function normalizeWalletAddress (addr = '') {
    if (!addr) return ''
    let a = addr.trim().toLowerCase()
    // your app sometimes uses xdc..., sometimes 0x...
    if (a.startsWith('0x')) return a
    if (a.startsWith('xdc')) return '0x' + a.slice(3)
    return a
}

async function generateTruliooId (req, res, options = {}) {
    const { flowId, kycType = 'individual' } = options

    try {
        const { walletAddress } = req.body
        if (!walletAddress) return res.status(400).json({ error: 'walletAddress is required' })
        if (!flowId) return res.status(500).json({ error: 'Trulioo flow id is not configured' })

        const normalizedAddress = normalizeWalletAddress(walletAddress)

        // 1️⃣ Find existing session (Sort by created date descending to get the latest)
        const existingFilter = {
            walletAddress: normalizedAddress,
            ...(kycType === 'individual'
                ? { $or: [{ kycType: 'individual' }, { kycType: { $exists: false } }] }
                : { kycType })
        }

        let existing = await TruliooSession.findOne(existingFilter)
            .sort({ createdAt: -1 })

        // 2️⃣ If exists, REFRESH STATUS immediately
        if (existing) {
            try {
                const statusData = await fetchTruliooStatus(existing.sessionId)
                if (statusData) {
                    if (!existing.kycType && kycType === 'individual') {
                        existing.kycType = 'individual'
                    }
                    existing.status = statusData.status
                    existing.rawStatus = statusData.raw
                    await existing.save()
                }

                // Always return existing session/status.
                // This avoids duplicate-key conflicts and preserves admin-updated
                // statuses like 'declined' for frontend visibility.
                return res.json({
                    sessionId: existing.sessionId,
                    flowId: existing.flowId,
                    status: existing.status,
                    existing: true
                })
            } catch (e) {
                console.log('Error refreshing Trulioo status:', e.message)
                // If error, safer to return existing so user doesn't lose progress if it was just a network blip
                return res.json({
                    sessionId: existing.sessionId,
                    flowId: existing.flowId,
                    status: existing.status,
                    existing: true
                })
            }
        }

        // 3️⃣ Create NEW Session (Runs only when no session exists for this wallet+kycType)
        const url = `https://api.trulioo.com/wfs/interpreter-v2/test/flow/${flowId}`
        const resp = await axios.get(url)
        const sessionId = resp.headers['x-hf-session']

        if (!sessionId) throw new Error('x-hf-session header not found')

        const record = await TruliooSession.create({
            walletAddress: normalizedAddress,
            kycType,
            sessionId,
            flowId,
            status: 'pending' // New sessions always start as pending
        })

        return res.json({
            sessionId: record.sessionId,
            flowId: record.flowId,
            status: record.status,
            existing: false // Frontend will see this is new and open the window
        })
    } catch (err) {
        console.error('Trulioo error:', err.response?.data || err.message)
        if (err && err.code === 11000) {
            return res.status(409).json({
                error: 'Duplicate session key. Please restart server to apply Trulioo index migration (walletAddress + kycType).'
            })
        }
        return res.status(500).json({ error: 'Unable to generate session Id' })
    }
}

router.post('/generateSessionID', async (req, res) => {
    return generateTruliooId(req, res, { flowId: TRULIOO_FLOW_ID, kycType: 'individual' })
})

router.post('/generateCompanyID', async (req, res) => {
    return generateTruliooId(req, res, { flowId: TRULIOO_COMPANY_FLOW_ID, kycType: 'company' })
})

module.exports = router

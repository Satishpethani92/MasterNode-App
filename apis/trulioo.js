'use strict'
const express = require('express')
const axios = require('axios')
const router = express.Router()
const TruliooSession = require('../models/mongodb/truliooSession')
const { fetchTruliooStatus } = require('../helpers/fetchTruliooStatus')

const TRULIOO_FLOW_ID = process.env.TRULIOO_FLOW_ID

// Optional: helper to normalize wallet address
function normalizeWalletAddress (addr = '') {
    if (!addr) return ''
    let a = addr.trim().toLowerCase()
    // your app sometimes uses xdc..., sometimes 0x...
    if (a.startsWith('0x')) return a
    if (a.startsWith('xdc')) return '0x' + a.slice(3)
    return a
}

router.post('/generateSessionID', async (req, res) => {
    try {
        const { walletAddress } = req.body
        if (!walletAddress) return res.status(400).json({ error: 'walletAddress is required' })

        const normalizedAddress = normalizeWalletAddress(walletAddress)

        // 1️⃣ Find existing session (Sort by created date descending to get the latest)
        let existing = await TruliooSession.findOne({ walletAddress: normalizedAddress })
            .sort({ createdAt: -1 })

        // 2️⃣ If exists, REFRESH STATUS immediately
        if (existing) {
            try {
                const statusData = await fetchTruliooStatus(existing.sessionId)

                if (statusData) {
                    // Update DB with latest status
                    existing.status = statusData.status || existing.status
                    existing.rawStatus = statusData.raw
                    await existing.save()
                }

                // CHECK LOGIC:
                // If Completed -> Return it (User is done)
                // If Pending   -> Return it (User resumes flow)
                // If Declined  -> IGNORE it and let code fall through to create NEW session
                if (existing.status !== 'declined' && existing.status !== 'rejected' && existing.status !== 'failed') {
                    return res.json({
                        sessionId: existing.sessionId,
                        flowId: existing.flowId,
                        status: existing.status,
                        existing: true
                    })
                }

                // If we are here, status is 'declined'.
                // We log it and proceed to generate a NEW session below.
                console.log(`User ${normalizedAddress} has declined session. Generating new one...`)
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

        // 3️⃣ Create NEW Session (Runs if no session exists OR if previous session was declined)
        const url = `https://api.trulioo.com/wfs/interpreter-v2/test/flow/${TRULIOO_FLOW_ID}`
        const resp = await axios.get(url)
        const sessionId = resp.headers['x-hf-session']

        if (!sessionId) throw new Error('x-hf-session header not found')

        const record = await TruliooSession.create({
            walletAddress: normalizedAddress,
            sessionId,
            flowId: TRULIOO_FLOW_ID,
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
        return res.status(500).json({ error: 'Unable to generate session Id' })
    }
})

module.exports = router

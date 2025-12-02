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

        if (!walletAddress) {
            return res.status(400).json({ error: 'walletAddress is required' })
        }

        const normalizedAddress = normalizeWalletAddress(walletAddress)

        // 1️⃣ Check if this wallet already has a session
        let existing = await TruliooSession.findOne({ walletAddress: normalizedAddress })
        console.log('existing', existing)
        if (existing) {
            // (Optional) refresh status from Trulioo
            try {
                const statusData = await fetchTruliooStatus(existing.sessionId)
                console.log('statusData', statusData)
                if (statusData) {
                    existing.status = statusData.status || existing.status
                    existing.rawStatus = statusData
                    await existing.save()
                }
            } catch (e) {
                console.log('Error fetching Trulioo status:', e.message)
            }

            return res.json({
                sessionId: existing.sessionId,
                flowId: existing.flowId,
                status: existing.status,
                existing: true
            })
        }

        // 2️⃣ No existing session ⇒ create a new one via Trulioo flow
        const url = `https://api.trulioo.com/wfs/interpreter-v2/test/flow/${TRULIOO_FLOW_ID}`

        const resp = await axios.get(url)
        console.log('flow resp status:', resp.status)
        console.log('flow resp headers:', resp.headers)

        const sessionId = resp.headers['x-hf-session']

        if (!sessionId) {
            throw new Error('x-hf-session header not found in Trulioo flow response')
        }

        console.log('x-hf-session:', sessionId)

        // Save in DB
        const record = await TruliooSession.create({
            walletAddress: normalizedAddress,
            sessionId,
            flowId: TRULIOO_FLOW_ID,
            status: 'pending'
        })

        return res.json({
            sessionId: record.sessionId,
            flowId: record.flowId,
            status: record.status,
            existing: false
        })
    } catch (err) {
        console.error(
            'Trulioo session Id generate error:',
      err.response?.data || err.message
        )
        return res
            .status(500)
            .json({ error: 'Unable to generate session Id' })
    }
})

module.exports = router

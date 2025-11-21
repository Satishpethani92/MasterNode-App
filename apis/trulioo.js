'use strict'
const express = require('express')
const axios = require('axios')
const router = express.Router()

const TRULIOO_CLIENT_ID = process.env.TRULIOO_CLIENT_ID
const TRULIOO_CLIENT_SECRET = process.env.TRULIOO_CLIENT_SECRET
const TRULIOO_FLOW_ID = process.env.TRULIOO_FLOW_ID

async function getTruliooToken () {
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: TRULIOO_CLIENT_ID,
        client_secret: TRULIOO_CLIENT_SECRET
    })

    const resp = await axios.post(
        'https://auth-api.trulioo.com/connect/token',
        body,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    return resp.data.access_token
}

// 2) generate signed URL
router.post('/generateID', async (req, res) => {
    try {
        const token = await getTruliooToken()
        const resp = await axios.post(
            `https://api.trulioo.com/wfs/interpreter-v2/signed-url/${TRULIOO_FLOW_ID}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
        console.log('resp', resp)
        // The response contains a signed URL you can use directly
        const launchUrl = resp.data.signedUrl // field name from API response

        return res.json({ launchUrl })
    } catch (err) {
        console.error('Trulioo signed-url error:', err.response?.data || err.message)
        return res.status(500).json({ error: 'Unable to start Trulioo KYC' })
    }
})

module.exports = router

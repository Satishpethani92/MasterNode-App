'use strict'
const express = require('express')
const axios = require('axios')
const router = express.Router()

const TRULIOO_FLOW_ID = process.env.TRULIOO_FLOW_ID

router.post('/generateSessionID', async (req, res) => {
    try {
    // Step 1: get session id from flow call
        const url = `https://api.trulioo.com/wfs/interpreter-v2/test/flow/${TRULIOO_FLOW_ID}`

        const resp = await axios.get(url)
        console.log('flow resp status:', resp.status)
        console.log('flow resp headers:', resp.headers)

        const sessionId = resp.headers['x-hf-session']

        if (!sessionId) {
            throw new Error('x-hf-session header not found in Trulioo flow response')
        }
        console.log('x-hf-session:', sessionId)
        return res.json({ sessionId: sessionId, flowId:TRULIOO_FLOW_ID })
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

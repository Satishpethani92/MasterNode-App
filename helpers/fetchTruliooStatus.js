const axios = require('axios')

async function fetchTruliooStatus (sessionId) {
    if (!sessionId) {
        throw new Error('sessionId is required')
    }

    const {
        TRULIOO_CLIENT_ID,
        TRULIOO_CLIENT_SECRET = 'wfs.export'
    } = process.env

    // 1️⃣ Get OAuth token
    const tokenResp = await axios.post(
        'https://auth-api.trulioo.com/connect/token',
        new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: TRULIOO_CLIENT_ID,
            client_secret: TRULIOO_CLIENT_SECRET
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const accessToken = tokenResp.data.access_token

    // 2️⃣ Query Workflow Studio export API
    const exportResp = await axios.get(
        `https://api.trulioo.com/wfs/export/test/v2/query/client/${sessionId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    const exportData = exportResp.data

    // 3️⃣ Derive Status
    // Default to pending
    let status = 'pending'

    if (exportData && exportData.flowData) {
        // A. Check for specific top-level status or decision fields often returned by Trulioo
        // Adjust these keys based on your specific console.log(exportData) output
        const flowStatus = (exportData.status || '').toLowerCase()
        const executionStatus = (exportData.executionStatus || '').toLowerCase()

        // 🚨 FAILURE / DECLINED CHECKS
        if (
            flowStatus === 'declined' ||
            flowStatus === 'rejected' ||
            flowStatus === 'failed' ||
            executionStatus === 'failed'
        ) {
            status = 'declined'
        } else if (
            flowStatus === 'completed' ||
            flowStatus === 'approved' ||
            executionStatus === 'success'
        ) {
            status = 'completed'
        } else {
            const steps = Object.values(exportData.flowData)
            const allCompleted = steps.every((step) => step.completed === true)
            if (allCompleted) {
                status = 'completed'
            }
        }
    }

    return { status, raw: exportData }
}

module.exports = { fetchTruliooStatus }

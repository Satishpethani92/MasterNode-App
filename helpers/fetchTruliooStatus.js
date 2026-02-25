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
    console.log('exportData', exportData)
    // 3️⃣ Use Trulioo's FINAL status directly
    let status = 'pending'

    if (exportData?.status) {
        const s = exportData.status.toLowerCase()

        switch (s) {
        case 'accepted':
            status = 'approved'
            break
        case 'declined':
        case 'rejected':
        case 'failed':
            status = 'declined'
            break
        case 'review':
        case 'pending_review':
            status = 'pending_review'
            break
        case 'completed':
            status = 'completed'
            break
        default:
            status = 'pending'
        }
    }

    return { status, raw: exportData }
}

module.exports = { fetchTruliooStatus }

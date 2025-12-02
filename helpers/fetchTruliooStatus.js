const axios = require('axios')

async function fetchTruliooStatus (sessionId) {
    if (!sessionId) {
        throw new Error('sessionId is required')
    }

    const {
        TRULIOO_CLIENT_ID,
        TRULIOO_CLIENT_SECRET = 'wfs.export'
    } = process.env

    if (!TRULIOO_CLIENT_ID || !TRULIOO_CLIENT_SECRET) {
        throw new Error('Trulioo client ID/secret not configured')
    }

    // 1️⃣ Get OAuth token from Trulioo auth API
    const tokenResp = await axios.post(
        'https://auth-api.trulioo.com/connect/token',
        new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: TRULIOO_CLIENT_ID,
            client_secret: TRULIOO_CLIENT_SECRET
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    )

    const accessToken = tokenResp.data.access_token
    if (!accessToken) {
        throw new Error('Failed to obtain Trulioo access token')
    }

    // 2️⃣ Query Workflow Studio export API with x-hf-session
    //    Docs: GET https://api.trulioo.com/wfs/export/v2/query/client/{x-hf-session}
    const exportResp = await axios.get(
        `https://api.trulioo.com/wfs/export/v2/query/client/${sessionId}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    )
    console.log('exportResp', exportResp)
    const exportData = exportResp.data
    console.log('exportData', exportData)

    // 3️⃣ Derive a simple status from flowData
    //    flowData is an object with steps; each has `completed: boolean` etc. :contentReference[oaicite:3]{index=3}
    let status = 'pending'

    if (exportData && exportData.flowData) {
        const steps = Object.values(exportData.flowData)
        const allCompleted = steps.every((step) => step.completed === true)

        if (allCompleted) {
            status = 'completed'
        }
    // OPTIONAL: You could inspect serviceData / decision fields here to set "failed" / "rejected"
    }

    console.log('status', status)
    console.log('raw', exportData)
    return {
        status,
        raw: exportData
    }
}

module.exports = { fetchTruliooStatus }

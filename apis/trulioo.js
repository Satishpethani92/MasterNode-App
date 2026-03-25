'use strict'
const express = require('express')
const axios = require('axios')
const fs = require('fs/promises')
const path = require('path')
const router = express.Router()
const TruliooSession = require('../models/mongodb/truliooSession')
const { fetchTruliooStatus } = require('../helpers/fetchTruliooStatus')
const { createPdfBuffer } = require('../helpers/createPdfBuffer')
const { addBufferToIpfs } = require('../helpers/ipfs')

const TRULIOO_FLOW_ID = process.env.TRULIOO_FLOW_ID
const TRULIOO_COMPANY_FLOW_ID = process.env.TRULIOO_COMPANY_FLOW_ID
const TRULIOO_DOCUMENTS_DIR = path.join(process.cwd(), 'storage', 'trulioo-documents')

// Optional: helper to normalize wallet address
function normalizeWalletAddress (addr = '') {
    if (!addr) return ''
    let a = addr.trim().toLowerCase()
    // your app sometimes uses xdc..., sometimes 0x...
    if (a.startsWith('0x')) return a
    if (a.startsWith('xdc')) return '0x' + a.slice(3)
    return a
}

async function getAccessToken () {
    const {
        TRULIOO_CLIENT_ID,
        TRULIOO_CLIENT_SECRET = 'wfs.export'
    } = process.env

    const tokenResp = await axios.post(
        'https://auth-api.trulioo.com/connect/token',
        new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: TRULIOO_CLIENT_ID,
            client_secret: TRULIOO_CLIENT_SECRET
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    return tokenResp.data.access_token
}

async function getTransactionData (clientId) {
    if (!clientId) {
        throw new Error('clientId is required')
    }

    const accessToken = await getAccessToken()
    const response = await axios.get(
        `https://api.trulioo.com/wfs/export/test/v2/query/client/${clientId}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    )

    return response.data
}

function isCompletedStatus (status = '') {
    const normalizedStatus = status.toLowerCase()
    return normalizedStatus === 'completed' || normalizedStatus === 'approved'
}

function getDocumentFileName (walletAddress, kycType) {
    const sanitizedWallet = normalizeWalletAddress(walletAddress).replace(/[^a-z0-9]/g, '')
    return `trulioo-${kycType || 'individual'}-${sanitizedWallet || 'unknown'}.pdf`
}

async function ensureTruliooDocumentsDir () {
    await fs.mkdir(TRULIOO_DOCUMENTS_DIR, { recursive: true })
}

async function savePdfLocally ({ walletAddress, kycType, pdfBuffer }) {
    await ensureTruliooDocumentsDir()

    const fileName = getDocumentFileName(walletAddress, kycType)
    const filePath = path.join(TRULIOO_DOCUMENTS_DIR, fileName)

    await fs.writeFile(filePath, pdfBuffer)

    return {
        fileName,
        filePath
    }
}

async function readSavedPdf (filePath) {
    if (!filePath) {
        return null
    }

    try {
        return await fs.readFile(filePath)
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null
        }

        throw error
    }
}

async function createAndSaveTruliooPdf ({ walletAddress, session, kycType }) {
    const transactionData = await getTransactionData(session.sessionId)
    const generatedAt = new Date().toISOString()
    const pdfBuffer = createPdfBuffer({
        title: 'Trulioo KYC Document',
        metadata: {
            'Wallet Address': walletAddress,
            'KYC Type': session.kycType || kycType,
            'Session ID': session.sessionId,
            'Generated At': generatedAt,
            'Verification Status': String(transactionData.status || session.status || '').toUpperCase()
        },
        sections: buildKycPdfSections(transactionData)
    })

    const { fileName, filePath } = await savePdfLocally({
        walletAddress,
        kycType: session.kycType || kycType,
        pdfBuffer
    })

    session.documentName = fileName
    session.documentLocalPath = filePath
    session.documentSavedAt = new Date()
    session.rawStatus = transactionData
    await session.save()

    return {
        pdfBuffer,
        transactionData
    }
}

function stringifyFieldValue (value) {
    if (Array.isArray(value)) {
        return value.join(', ')
    }

    if (value === null || typeof value === 'undefined' || value === '') {
        return '-'
    }

    return String(value)
}

function extractKycFieldRows (transactionData) {
    const flowData = transactionData && transactionData.flowData ? transactionData.flowData : {}
    const rows = []

    Object.keys(flowData).forEach(flowKey => {
        const fieldData = flowData[flowKey] && flowData[flowKey].fieldData ? flowData[flowKey].fieldData : {}

        Object.keys(fieldData).forEach(fieldKey => {
            const field = fieldData[fieldKey]
            const label = field.normalizedName || field.name || field.role || fieldKey
            const value = stringifyFieldValue(field.value)

            rows.push({
                label,
                value,
                sortKey: label.toLowerCase()
            })
        })
    })

    return rows.sort((left, right) => left.sortKey.localeCompare(right.sortKey))
        .map(({ label, value }) => ({ label, value }))
}

function buildKycPdfSections (transactionData) {
    const fieldRows = extractKycFieldRows(transactionData)

    return [
        {
            title: 'KYC Form Details',
            rows: fieldRows
        }
    ]
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

                    if (isCompletedStatus(existing.status) && !existing.documentLocalPath) {
                        try {
                            await createAndSaveTruliooPdf({
                                walletAddress: normalizedAddress,
                                session: existing,
                                kycType
                            })
                        } catch (backupError) {
                            console.log('Unable to save Trulioo PDF locally:', backupError.message)
                        }
                    }
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

router.post('/getTransactionData', async (req, res) => {
    try {
        const { walletAddress, kycType = 'individual' } = req.body

        if (!walletAddress) {
            return res.status(400).json({ error: 'walletAddress is required' })
        }

        const normalizedAddress = normalizeWalletAddress(walletAddress)
        const session = await TruliooSession.findOne({
            walletAddress: normalizedAddress,
            ...(kycType === 'individual'
                ? { $or: [{ kycType: 'individual' }, { kycType: { $exists: false } }] }
                : { kycType })
        }).sort({ createdAt: -1 })

        if (!session) {
            return res.status(404).json({ error: 'No Trulioo session found for this wallet' })
        }

        const statusData = await fetchTruliooStatus(session.sessionId)
        session.status = statusData.status
        session.rawStatus = statusData.raw
        await session.save()

        if (!isCompletedStatus(session.status)) {
            return res.status(409).json({
                error: `KYC is not completed yet. Current status: ${session.status}`,
                status: session.status
            })
        }

        if (session.documentHash) {
            return res.json({
                hash: session.documentHash,
                fileName: session.documentName,
                localPath: session.documentLocalPath,
                sessionId: session.sessionId,
                status: session.status,
                transactionData: session.rawStatus
            })
        }

        let pdfBuffer = await readSavedPdf(session.documentLocalPath)
        let transactionData = session.rawStatus

        if (!pdfBuffer) {
            const documentData = await createAndSaveTruliooPdf({
                walletAddress: normalizedAddress,
                session,
                kycType
            })
            pdfBuffer = documentData.pdfBuffer
            transactionData = documentData.transactionData
        }

        const hash = await addBufferToIpfs(pdfBuffer)

        session.documentHash = hash
        if (!session.documentName) {
            session.documentName = getDocumentFileName(normalizedAddress, session.kycType || kycType)
        }
        session.documentUploadedAt = new Date()
        await session.save()

        return res.json({
            hash,
            fileName: session.documentName,
            localPath: session.documentLocalPath,
            sessionId: session.sessionId,
            status: session.status,
            transactionData
        })
    } catch (err) {
        console.error('Unable to fetch Trulioo transaction data:', err.response?.data || err.message)
        return res.status(500).json({ error: 'Unable to fetch transaction data' })
    }
})

module.exports = router

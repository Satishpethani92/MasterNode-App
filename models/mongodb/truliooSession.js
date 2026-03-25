const mongoose = require('mongoose')

const truliooSessionSchema = new mongoose.Schema(
    {
        walletAddress: {
            type: String,
            required: true,
            index: true
        },
        kycType: {
            type: String,
            enum: ['individual', 'company'],
            default: 'individual',
            index: true
        },
        sessionId: {
            type: String,
            required: true
        },
        flowId: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'pending_review', 'completed', 'failed', 'declined', 'rejected', 'approved'],
            default: 'pending'
        },
        rawStatus: {
            type: mongoose.Schema.Types.Mixed
        },
        documentHash: {
            type: String
        },
        documentName: {
            type: String
        },
        documentLocalPath: {
            type: String
        },
        documentSavedAt: {
            type: Date
        },
        documentUploadedAt: {
            type: Date
        }
    },
    { timestamps: true }
)

truliooSessionSchema.index({ walletAddress: 1, kycType: 1 }, { unique: true })

module.exports = mongoose.model('TruliooSession', truliooSessionSchema)

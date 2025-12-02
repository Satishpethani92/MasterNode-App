const mongoose = require('mongoose')

const truliooSessionSchema = new mongoose.Schema(
    {
        walletAddress: {
            type: String,
            required: true,
            index: true,
            unique: true
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
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        rawStatus: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model('TruliooSession', truliooSessionSchema)

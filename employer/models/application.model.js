import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    status: {
        type: String,
        enum: ['applied', 'viewed', 'interview', 'offer', 'hired', 'rejected'],
        default: 'applied'
    },
    category: {
        type: String,
        enum: ['saved', 'applied', 'interviews', 'offers', 'hired', 'archived'],
        required: true
    },
    appliedDate: { type: Date, default: Date.now }
}, { timestamps: true });

applicationSchema.index({ user: 1, job: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);
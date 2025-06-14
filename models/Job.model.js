import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    schoolName: { 
        type: String, 
        required: true 
    },
    location: { 
        type: String, 
        required: true 
    },
    salary: {
        type: String
    },
    type: {
        type: String
    },
    description: {
        type: String
    },
    postedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    approvedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    status: {
        type: String,
        enum: ['pending_approval', 'active', 'rejected', 'closed'],
        default: 'pending_approval'
    }
}, { timestamps: true });

export const Job = mongoose.model('Job', jobSchema);
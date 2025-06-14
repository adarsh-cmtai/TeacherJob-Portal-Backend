
import mongoose from 'mongoose';
const collegeProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    address: String,
    website: String,
    description: String,
    logo: { public_id: String, url: String }
}, { timestamps: true });
export const CollegeProfile = mongoose.model('CollegeProfile', collegeProfileSchema);
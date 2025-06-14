import { Job } from '../../models/Job.model.js';
import { Application } from '../../employer/models/application.model.js';
import { CollegeProfile } from '../models/profile.model.js';
import { uploadOnCloudinary } from '../../config/cloudinaryConfig.js';

export const getMyCollegeProfile = async (req, res) => {
    try {
        const profile = await CollegeProfile.findOne({ user: req.user.id });
        res.status(200).json(profile);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const createJobPost = async (req, res) => {
    try {
        const collegeProfile = await CollegeProfile.findOne({ user: req.user.id });
        const job = await Job.create({
            ...req.body,
            postedBy: req.user.id,
            schoolName: collegeProfile.name,
            status: 'pending_approval'
        });
        res.status(201).json(job);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getMyPostedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user.id });
        res.status(200).json(jobs);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getApplicationsForMyJobs = async (req, res) => {
    try {
        const jobsPostedByCollege = await Job.find({ postedBy: req.user.id }).select('_id');
        const jobIds = jobsPostedByCollege.map(job => job._id);
        const applications = await Application.find({ job: { $in: jobIds } }).populate({
            path: 'user', select: 'email',
            populate: { path: 'employerProfile', model: 'EmployerProfile', select: 'name headline skills' }
        }).populate('job', 'title');
        res.status(200).json(applications);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const shortlistCandidate = async (req, res) => {
    try {
        const { appId } = req.params;
        const application = await Application.findByIdAndUpdate(appId, { status: 'shortlisted' }, { new: true });
        res.status(200).json(application);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const scheduleInterview = async (req, res) => {
    try {
        const { appId } = req.params;
        const { meetingLink, dateTime, instructions } = req.body;
        const application = await Application.findByIdAndUpdate(appId, {
            status: 'interview_scheduled',
            category: 'interviews',
            'interviewDetails.meetingLink': meetingLink,
            'interviewDetails.dateTime': dateTime,
            'interviewDetails.instructions': instructions,
            'interviewDetails.confirmedByAdmin': false
        }, { new: true });
        res.status(200).json(application);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateStatusAfterInterview = async (req, res) => {
    try {
        const { appId } = req.params;
        const { status } = req.body;
        let updateData = { status };

        if (req.file) {
            const result = await uploadOnCloudinary(req.file.buffer, 'offer_letters');
            updateData = {
                ...updateData,
                status: 'offer_extended',
                category: 'offers',
                'offerLetter.public_id': result.public_id,
                'offerLetter.url': result.secure_url,
                'offerLetter.forwardedByAdmin': false,
            };
        }
        const application = await Application.findByIdAndUpdate(appId, updateData, { new: true });
        res.status(200).json(application);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getHiredCandidates = async (req, res) => {
    try {
        const jobsPostedByCollege = await Job.find({ postedBy: req.user.id }).select('_id');
        const jobIds = jobsPostedByCollege.map(job => job._id);
        const applications = await Application.find({ job: { $in: jobIds }, status: 'hired' }).populate('user', 'email');
        res.status(200).json(applications);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
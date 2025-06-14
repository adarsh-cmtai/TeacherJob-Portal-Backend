import { Job } from '../../models/Job.model.js';
import { Application } from '../../employer/models/application.model.js';
import { User } from '../../models/User.model.js';
import { EmployerProfile } from '../../employer/models/profile.model.js';
import { CollegeProfile } from '../../college/models/profile.model.js';
import { AdminProfile } from '../models/profile.model.js';
import { createNotification } from '../../notifications/controllers/notification.controller.js';

export const getWorkflowApplications = async (req, res) => {
    try {
        const applications = await Application.find({
            status: { $in: ['interview_scheduled', 'offer_extended', 'hired', 'rejected'] }
        })
        .populate({
            path: 'user',
            select: 'email',
            populate: { path: 'employerProfile', model: 'EmployerProfile', select: 'name' }
        })
        .populate({
            path: 'job',
            select: 'title schoolName',
        })
        .sort({ updatedAt: -1 });

        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createJobByAdmin = async (req, res) => {
    try {
        const { title, schoolName, location, description, type, salary, postedBy } = req.body;
        if (!title || !schoolName || !location || !postedBy) {
            return res.status(400).json({ message: 'Title, schoolName, location, and postedBy (college user ID) are required.' });
        }
        const job = await Job.create({
            title, schoolName, location, description, type, salary,
            postedBy,
            approvedBy: req.user.id,
            status: 'active'
        });
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateJobByAdmin = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findByIdAndUpdate(jobId, req.body, { new: true, runValidators: true });
        if (!job) {
            return res.status(404).json({ message: 'Job not found.' });
        }
        res.status(200).json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteJobByAdmin = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found.' });
        }
        await Application.deleteMany({ job: jobId });
        await Job.findByIdAndDelete(jobId);
        res.status(200).json({ success: true, message: 'Job and all associated applications have been deleted.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const manageJobPosts = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status } = req.body;
        const job = await Job.findByIdAndUpdate(jobId, { status, approvedBy: req.user.id }, { new: true });
        
        if (job) {
            const message = `Your job post '${job.title}' has been ${status}.`;
            await createNotification(job.postedBy, message, '/college/jobs');
        }

        res.status(200).json(job);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};

export const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find(req.query).populate({
            path: 'postedBy',
            select: 'email',
            populate: {
                path: 'collegeProfile', 
                model: 'CollegeProfile',
                select: 'name',
                strictPopulate: false
            }
        });
        res.status(200).json(jobs);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};

export const getAllUsersByRole = async (req, res) => {
    try {
        const { role } = req.query;
        if (!role) {
            return res.status(400).json({ message: 'Role query parameter is required' });
        }
        
        const users = await User.find({ role }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .populate({ path: 'employerProfile', select: 'name', strictPopulate: false })
            .populate({ path: 'collegeProfile', select: 'name', strictPopulate: false })
            .populate({ path: 'adminProfile', select: 'name', strictPopulate: false })
            .select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFullUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: "User not found." });

        let details = { user };

        if (user.role === 'employer') {
            details.profile = await EmployerProfile.findOne({ user: userId }).populate('skills', 'name');
            details.applications = await Application.find({ user: userId }).populate('job', 'title schoolName');
        } else if (user.role === 'college') {
            details.profile = await CollegeProfile.findOne({ user: userId });
            details.jobs = await Job.find({ postedBy: userId });
        } else if (user.role === 'admin') {
            details.profile = await AdminProfile.findOne({ user: userId });
        }
        
        res.status(200).json(details);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};

export const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        if (!['active', 'pending', 'suspended'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }
        const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFullEmployerDetails = async (req, res) => {
    try {
        const { empId } = req.params;
        const employer = await User.findById(empId).select('-password');
        if (!employer) return res.status(404).json({ message: "Employer not found." });

        const profile = await EmployerProfile.findOne({ user: empId });
        const applications = await Application.find({ user: empId }).populate('job', 'title schoolName status');
        
        res.status(200).json({ employer, profile, applications });
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};

export const getFullCollegeDetails = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const college = await User.findById(collegeId).select('-password');
        if (!college) return res.status(404).json({ message: "College not found." });

        const profile = await CollegeProfile.findOne({ user: collegeId });
        const jobs = await Job.find({ postedBy: collegeId });
        const jobIds = jobs.map(j => j._id);
        const hiredCount = await Application.countDocuments({ job: { $in: jobIds }, status: 'hired' });
        
        res.status(200).json({ college, profile, jobs, hiredCount });
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};

export const forwardInterviewToEmployer = async (req, res) => {
    try {
        const { appId } = req.params;
        const application = await Application.findByIdAndUpdate(
            appId, 
            { 'interviewDetails.confirmedByAdmin': true }, 
            { new: true }
        ).populate('job');
        
        if (application) {
            const message = `An interview has been scheduled for the ${application.job.title} position. Please check your applications for details.`;
            await createNotification(application.user, message, '/my-jobs?category=interviews');
        }
        
        res.status(200).json({ success: true, message: "Interview details forwarded to employer." });
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};

export const forwardOfferToEmployer = async (req, res) => {
    try {
        const { appId } = req.params;
        const application = await Application.findByIdAndUpdate(
            appId, 
            { 
                'offerLetter.forwardedByAdmin': true,
                status: 'hired', 
                category: 'hired' 
            }, 
            { new: true }
        ).populate('job');
        
        if (application) {
            const message = `Congratulations! You have received an offer for the ${application.job.title} position.`;
            await createNotification(application.user, message, '/my-jobs?category=offers');
        }
        
        res.status(200).json({ success: true, message: "Offer letter forwarded to employer." });
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
};
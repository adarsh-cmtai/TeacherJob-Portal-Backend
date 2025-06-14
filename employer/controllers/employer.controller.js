import { EmployerProfile } from '../models/profile.model.js';
import { Application } from '../models/application.model.js';
import { Skill } from '../../models/Skill.model.js';
import { uploadOnCloudinary } from '../../config/cloudinaryConfig.js';

const calculateProfileStrength = (profile) => {
    let strength = 0;
    if (profile.name) strength += 10; if (profile.headline) strength += 10;
    if (profile.phone) strength += 5; if (profile.location) strength += 5;
    if (profile.profilePicture?.url) strength += 15; if (profile.demoVideo?.url) strength += 15;
    if (profile.workExperience?.length > 0) strength += 15;
    if (profile.education?.length > 0) strength += 10; if (profile.skills?.length > 0) strength += 10;
    return Math.min(strength, 100);
};

export const getMyProfile = async (req, res) => {
    try {
        const profile = await EmployerProfile.findOne({ user: req.user.id }).populate('skills');
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });
        const profileStrength = calculateProfileStrength(profile);
        const maskedEmail = req.user.email.replace(/(.{1})(.*)(@.*)/, "$1********$3");
        res.json({ ...profile.toObject(), profileStrength, email: maskedEmail });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateProfileDetails = async (req, res) => {
    const { name, headline, location, phone } = req.body;
    try {
        const profile = await EmployerProfile.findOneAndUpdate(
            { user: req.user.id },
            { $set: { name, headline, location, phone } },
            { new: true, runValidators: true }
        );
        res.json(profile);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateNotificationSettings = async (req, res) => {
    const { emailJobAlerts, whatsappUpdates, messagesFromSchools } = req.body;
    try {
        const profile = await EmployerProfile.findOneAndUpdate(
            { user: req.user.id },
            { $set: { 
                "settings.notifications.emailJobAlerts": emailJobAlerts,
                "settings.notifications.whatsappUpdates": whatsappUpdates,
                "settings.notifications.messagesFromSchools": messagesFromSchools
            }},
            { new: true }
        );
        res.status(200).json(profile.settings.notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addExperience = async (req, res) => {
    try {
        const profile = await EmployerProfile.findOneAndUpdate(
            { user: req.user.id }, 
            { $push: { workExperience: req.body } }, 
            { new: true }
        );
        res.status(201).json(profile.workExperience);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateExperience = async (req, res) => {
    try {
        const profile = await EmployerProfile.findOneAndUpdate(
            { user: req.user.id, "workExperience._id": req.params.expId },
            { $set: { "workExperience.$": { ...req.body, _id: req.params.expId } } }, 
            { new: true }
        );
        if (!profile) return res.status(404).json({ message: "Experience not found" });
        res.json(profile.workExperience);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteExperience = async (req, res) => {
    try {
        await EmployerProfile.findOneAndUpdate(
            { user: req.user.id }, 
            { $pull: { workExperience: { _id: req.params.expId } } }
        );
        res.json({ message: "Experience removed" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const addEducation = async (req, res) => {
    try {
        const profile = await EmployerProfile.findOneAndUpdate(
            { user: req.user.id }, 
            { $push: { education: req.body } }, 
            { new: true }
        );
        res.status(201).json(profile.education);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateEducation = async (req, res) => {
    try {
        const profile = await EmployerProfile.findOneAndUpdate(
            { user: req.user.id, "education._id": req.params.eduId },
            { $set: { "education.$": { ...req.body, _id: req.params.eduId } } },
            { new: true }
        );
        if (!profile) return res.status(404).json({ message: "Education not found" });
        res.json(profile.education);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteEducation = async (req, res) => {
    try {
        await EmployerProfile.findOneAndUpdate(
            { user: req.user.id },
            { $pull: { education: { _id: req.params.eduId } } }
        );
        res.json({ message: "Education removed" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateSkills = async (req, res) => {
    const { skills } = req.body;
    try {
        const skillIds = await Promise.all(
            skills.map(async (name) => {
                const skill = await Skill.findOneAndUpdate(
                    { name: name.trim().toLowerCase() },
                    { $setOnInsert: { name: name.trim().toLowerCase() } },
                    { upsert: true, new: true }
                );
                return skill._id;
            })
        );
        const profile = await EmployerProfile.findOneAndUpdate(
            { user: req.user.id },
            { $set: { skills: skillIds } },
            { new: true }
        ).populate('skills');
        res.json(profile.skills);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const uploadFile = async (req, res, fileType) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    try {
        const folder = `teacher-portal/${fileType}s`;
        const result = await uploadOnCloudinary(req.file.buffer, folder);
        let updateData;
        if (fileType === 'profilePicture') updateData = { profilePicture: { public_id: result.public_id, url: result.secure_url } };
        else if (fileType === 'demoVideo') updateData = { demoVideo: { public_id: result.public_id, url: result.secure_url } };
        else updateData = { $push: { documents: { public_id: result.public_id, url: result.secure_url, name: req.file.originalname } } };
        const profile = await EmployerProfile.findOneAndUpdate({ user: req.user.id }, updateData, { new: true });
        res.json({ message: `${fileType} uploaded!`, url: result.secure_url, profile });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const uploadProfilePicture = (req, res) => uploadFile(req, res, 'profilePicture');
export const uploadDemoVideo = (req, res) => uploadFile(req, res, 'demoVideo');
export const uploadDocument = (req, res) => uploadFile(req, res, 'document');

export const getMyApplications = async (req, res) => {
    try {
        const { category } = req.query;
        if (!category) return res.status(400).json({ message: "Category query parameter is required." });
        const applications = await Application.find({ user: req.user.id, category: category }).populate('job');
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const applyToJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const application = await Application.create({
            user: req.user.id,
            job: jobId,
            category: 'applied',
            status: 'applied'
        });
        res.status(201).json(application);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "You have already applied for this job." });
        res.status(500).json({ message: error.message });
    }
};

export const saveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const application = await Application.findOneAndUpdate(
            { user: req.user.id, job: jobId },
            { $setOnInsert: { user: req.user.id, job: jobId, category: 'saved' } },
            { upsert: true, new: true, runValidators: true }
        );
        res.status(200).json(application);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateApplication = async (req, res) => {
    try {
        const { appId } = req.params;
        const { category, status, action } = req.body;
        const updatePayload = {};
        if (category) updatePayload.category = category;
        if (status) updatePayload.status = status;
        if (action === 'accept_offer') { updatePayload.status = 'hired'; updatePayload.category = 'hired'; }
        if (action === 'decline_offer') { updatePayload.status = 'rejected'; updatePayload.category = 'archived'; }
        const application = await Application.findOneAndUpdate(
            { _id: appId, user: req.user.id },
            { $set: updatePayload },
            { new: true }
        );
        if (!application) return res.status(404).json({ message: "Application not found." });
        res.status(200).json(application);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const withdrawApplication = async (req, res) => {
    try {
        const { appId } = req.params;
        const application = await Application.findOneAndDelete({ _id: appId, user: req.user.id });
        if (!application) return res.status(404).json({ message: "Application not found." });
        res.status(200).json({ message: "Application withdrawn successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
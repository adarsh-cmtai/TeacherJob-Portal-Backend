import express from 'express';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import { upload } from '../../middleware/multer.js';
import {
    getMyProfile,
    updateProfileDetails,
    addExperience,
    updateExperience,
    deleteExperience,
    addEducation,
    updateEducation,
    deleteEducation,
    updateSkills,
    uploadProfilePicture,
    uploadDemoVideo,
    uploadDocument,
    getMyApplications,
    applyToJob,
    saveJob,
    updateApplication,
    withdrawApplication,
    updateNotificationSettings
} from '../controllers/employer.controller.js';

const router = express.Router();

router.use(protect, restrictTo('employer'));

router.route('/profile')
    .get(getMyProfile)
    .put(updateProfileDetails);

router.route('/experience')
    .post(addExperience);
router.route('/experience/:expId')
    .put(updateExperience)
    .delete(deleteExperience);

router.route('/education')
    .post(addEducation);
router.route('/education/:eduId')
    .put(updateEducation)
    .delete(deleteEducation);

router.route('/skills')
    .put(updateSkills);

router.post('/upload/picture', upload.single('profilePicture'), uploadProfilePicture);
router.post('/upload/video', upload.single('demoVideo'), uploadDemoVideo);
router.post('/upload/document', upload.single('document'), uploadDocument);

router.route('/applications')
    .get(getMyApplications);
router.post('/applications/apply/:jobId', applyToJob);
router.post('/applications/save/:jobId', saveJob);
router.route('/applications/:appId')
    .put(updateApplication)
    .delete(withdrawApplication);

router.put('/settings/notifications', updateNotificationSettings);

export default router;
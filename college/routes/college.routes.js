import express from 'express';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import { upload } from '../../middleware/multer.js';
import {
    getMyCollegeProfile, createJobPost, getMyPostedJobs, getApplicationsForMyJobs,
    shortlistCandidate, scheduleInterview, updateStatusAfterInterview, getHiredCandidates
} from '../controllers/college.controller.js';

const router = express.Router();
router.use(protect, restrictTo('college'));

router.get('/profile', getMyCollegeProfile);
router.post('/jobs', createJobPost);
router.get('/jobs', getMyPostedJobs);
router.get('/applications', getApplicationsForMyJobs);
router.put('/applications/:appId/shortlist', shortlistCandidate);
router.put('/applications/:appId/schedule-interview', scheduleInterview);
router.put('/applications/:appId/update-status', upload.single('offerLetter'), updateStatusAfterInterview);
router.get('/hired', getHiredCandidates);

export default router;
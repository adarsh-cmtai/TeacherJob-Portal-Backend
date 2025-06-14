import express from 'express';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import {
    manageJobPosts,
    getAllJobs,
    getFullEmployerDetails,
    getFullCollegeDetails,
    forwardInterviewToEmployer,
    forwardOfferToEmployer,
    getAllUsersByRole,
    createJobByAdmin,
    updateJobByAdmin,
    deleteJobByAdmin,
    getWorkflowApplications,
    getAllUsers,
    getFullUserDetails,
    updateUserStatus
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(protect, restrictTo('Admin'));

router.route('/jobs')
    .get(getAllJobs)  
    .post(createJobByAdmin);

router.route('/jobs/:jobId')
    .put(updateJobByAdmin)
    .delete(deleteJobByAdmin);

router.put('/jobs/:jobId/manage', manageJobPosts); 

router.get('/users/all', getAllUsers);
router.get('/users/role', getAllUsersByRole);
router.get('/users/employer/:empId', getFullEmployerDetails);
router.get('/users/college/:collegeId', getFullCollegeDetails);
router.get('/users/:userId', getFullUserDetails);
router.put('/users/:userId/status', updateUserStatus);

router.get('/applications', getWorkflowApplications);
router.put('/applications/:appId/forward-interview', forwardInterviewToEmployer);
router.put('/applications/:appId/forward-offer', forwardOfferToEmployer);

export default router;
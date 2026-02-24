import express from 'express';
import { registerUser, loginUser, resetPassword, updatePassword } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reset-password', resetPassword);
router.post('/update-password', updatePassword);

export default router;
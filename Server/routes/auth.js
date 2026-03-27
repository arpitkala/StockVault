const express = require('express');
const { body } = require('express-validator');
const {
  register, login, getMe, updateProfile, completeKYC, getReferralStats
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], login);

router.get('/me',            protect, getMe);
router.put('/profile',       protect, updateProfile);
router.post('/kyc/complete', protect, completeKYC);
router.get('/referral',      protect, getReferralStats);

module.exports = router;
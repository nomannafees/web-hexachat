
import express from "express";

import {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfilePicture,
  updateProfile,
  regenerateChatPin,
  checkAvailability
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";
import {
  loginLimiter,
  registerLimiter,
  otpVerifyLimiter,
  otpResendLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  availabilityLimiter
} from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/register", registerLimiter, register);
router.get("/check-availability", availabilityLimiter, checkAvailability);
router.post("/verify-otp", otpVerifyLimiter, verifyOtp);
router.post("/resend-otp", otpResendLimiter, resendOtp);
router.post("/login", loginLimiter, login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPasswordLimiter, resetPassword);

router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.post("/regenerate-pin", protect, regenerateChatPin);
router.patch(
  "/profile-picture",
  protect,
  updateProfilePicture
);

export default router;
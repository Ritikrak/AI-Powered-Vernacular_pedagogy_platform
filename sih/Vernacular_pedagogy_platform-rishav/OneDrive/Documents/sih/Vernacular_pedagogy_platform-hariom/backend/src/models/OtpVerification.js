import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required for OTP verification'],
      lowercase: true,
      trim: true,
      index: true
    },
    otp: {
      type: String,
      required: [true, 'OTP code is required'],
      trim: true
    },
    purpose: {
      type: String,
      enum: ['teacher_2fa', 'password_reset', 'general'],
      default: 'teacher_2fa'
    },
    // TTL index: automatically deletes document from MongoDB after 300 seconds (5 minutes)
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300
    }
  },
  {
    timestamps: false
  }
);

// Ensure index creation
otpVerificationSchema.index({ email: 1, otp: 1 });

export const OtpVerification = mongoose.models.OtpVerification || mongoose.model('OtpVerification', otpVerificationSchema);

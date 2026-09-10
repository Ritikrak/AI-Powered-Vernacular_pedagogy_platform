import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    teacherId: {
      type: String,
      required: [true, 'Teacher ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    email: {
      type: String,
      required: [true, 'Teacher email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Invalid email address'],
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      enum: ['teacher'],
      default: 'teacher',
      index: true
    },
    preferredLanguage: {
      type: String,
      enum: ['Hindi', 'English', 'Santhali', 'Mundari', 'Ho', 'Kurukh'],
      default: 'Hindi'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

teacherSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

teacherSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return {
    id: obj._id,
    _id: obj._id,
    teacherId: obj.teacherId,
    name: obj.name,
    email: obj.email,
    role: obj.role,
    preferredLanguage: obj.preferredLanguage,
    createdAt: obj.createdAt
  };
};

export const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);

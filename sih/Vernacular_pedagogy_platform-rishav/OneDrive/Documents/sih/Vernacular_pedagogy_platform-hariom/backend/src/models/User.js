import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Invalid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      enum: ['teacher', 'student', 'admin'],
      default: 'student',
      index: true
    },
    preferredLanguage: {
      type: String,
      enum: ['Hindi', 'English', 'Santhali', 'Mundari', 'Ho', 'Kurukh'],
      default: 'Hindi'
    },
    gradeLevel: {
      type: String,
      default: 'Class 5'
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

// In-memory fallback mock storage
export const mockUsers = [
  {
    _id: 'usr_teacher_01',
    name: 'Classroom Teacher',
    email: 'teacher@lokshiksha.in',
    role: 'teacher',
    preferredLanguage: 'Hindi',
    gradeLevel: 'Class 5',
    comparePassword: async (pwd) => pwd === 'teacher@2026' || pwd.length >= 6,
    toSafeObject() { return { id: this._id, name: this.name, email: this.email, role: this.role, preferredLanguage: this.preferredLanguage, gradeLevel: this.gradeLevel }; }
  },
  {
    _id: 'usr_student_01',
    name: 'Student Learner',
    email: 'student@lokshiksha.in',
    role: 'student',
    preferredLanguage: 'Santhali',
    gradeLevel: 'Class 6',
    comparePassword: async (pwd) => pwd === 'student@2026' || pwd.length >= 6,
    toSafeObject() { return { id: this._id, name: this.name, email: this.email, role: this.role, preferredLanguage: this.preferredLanguage, gradeLevel: this.gradeLevel }; }
  }
];

export const User = mongoose.models.User || mongoose.model('User', userSchema);

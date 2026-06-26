import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type UserRole = 'admin' | 'staff';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  refreshTokens: string[];
  resetPasswordOtp?: string;
  resetPasswordOtpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'staff'] satisfies UserRole[],
        message: 'Role must be either admin or staff',
      },
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false, // Hidden by default
    },
    resetPasswordOtp: {
      type: String,
      select: false,
    },
    resetPasswordOtpExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['password'] = undefined;
        ret['refreshTokens'] = undefined;
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

// ─────────────────────────────────────────────
// Pre-save: hash password if modified
// ─────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─────────────────────────────────────────────
// Instance method: comparePassword
// ─────────────────────────────────────────────
userSchema.methods['comparePassword'] = async function (
  this: IUserDocument,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─────────────────────────────────────────────
// Static method: findByEmail
// ─────────────────────────────────────────────
userSchema.statics['findByEmail'] = function (
  email: string
): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase().trim() })
    .select('+password +refreshTokens')
    .exec();
};

// ─────────────────────────────────────────────
// Limit refresh token storage (max 5 sessions)
// ─────────────────────────────────────────────
const MAX_REFRESH_TOKENS = 5;
userSchema.pre('save', function () {
  if (this.isModified('refreshTokens') && this.refreshTokens.length > MAX_REFRESH_TOKENS) {
    // Remove oldest tokens (keep the most recent MAX_REFRESH_TOKENS)
    this.refreshTokens = this.refreshTokens.slice(-MAX_REFRESH_TOKENS);
  }
});

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

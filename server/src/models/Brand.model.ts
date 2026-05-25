import mongoose, { Schema, Document, Model } from 'mongoose';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface IBrand {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBrandDocument extends IBrand, Document {}
export interface IBrandModel extends Model<IBrandDocument> {}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const brandSchema = new Schema<IBrandDocument, IBrandModel>(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Brand name cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);


export const Brand = mongoose.model<IBrandDocument, IBrandModel>('Brand', brandSchema);

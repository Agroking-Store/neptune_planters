import mongoose, { Schema, Document, Model } from 'mongoose';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface ICategory {
  departmentId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryDocument extends ICategory, Document {}
export interface ICategoryModel extends Model<ICategoryDocument> {}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const categorySchema = new Schema<ICategoryDocument, ICategoryModel>(
  {
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required for a category'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
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

// Unique category name within a department
categorySchema.index({ departmentId: 1, name: 1 }, { unique: true });

export const Category = mongoose.model<ICategoryDocument, ICategoryModel>(
  'Category',
  categorySchema
);

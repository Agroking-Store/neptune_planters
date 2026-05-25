import mongoose, { Schema, Document, Model } from 'mongoose';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface IDepartment {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartmentDocument extends IDepartment, Document {}
export interface IDepartmentModel extends Model<IDepartmentDocument> {}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const departmentSchema = new Schema<IDepartmentDocument, IDepartmentModel>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
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


export const Department = mongoose.model<IDepartmentDocument, IDepartmentModel>(
  'Department',
  departmentSchema
);

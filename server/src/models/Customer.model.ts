import mongoose, { Schema, Document, Model } from 'mongoose';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface ICustomer {
  customerCode: string;
  customerName: string;
  email?: string;
  phoneNumber?: string;
  phoneNumber?: string;
  address?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerDocument extends ICustomer, Document {}
export interface ICustomerModel extends Model<ICustomerDocument> {
  generateCustomerCode(): Promise<string>;
}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const customerSchema = new Schema<ICustomerDocument, ICustomerModel>(
  {
    customerCode: {
      type: String,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      unique: true,
      trim: true,
      maxlength: [200, 'Customer name cannot exceed 200 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
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

// ─────────────────────────────────────────────
// Static: generate next CUST-XXXX code
// ─────────────────────────────────────────────
customerSchema.statics['generateCustomerCode'] = async function (): Promise<string> {
  const last = await this.findOne({}, { customerCode: 1 })
    .sort({ customerCode: -1 })
    .lean()
    .exec();

  if (!last?.customerCode) return 'CUST-0001';

  const num = parseInt(last.customerCode.replace('CUST-', ''), 10);
  return `CUST-${String(num + 1).padStart(4, '0')}`;
};

// ─────────────────────────────────────────────
// Pre-save: auto-set customerCode
// ─────────────────────────────────────────────
customerSchema.pre('save', async function () {
  if (this.isNew && !this.customerCode) {
    const Model = this.constructor as ICustomerModel;
    this.customerCode = await Model.generateCustomerCode();
  }
});

export const Customer = mongoose.model<ICustomerDocument, ICustomerModel>(
  'Customer',
  customerSchema
);

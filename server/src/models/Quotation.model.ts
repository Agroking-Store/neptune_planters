import mongoose, { Schema, Document, Model } from 'mongoose';

// ─────────────────────────────────────────────
// Sub-document: Customer Snapshot
// ─────────────────────────────────────────────
export interface ICustomerSnapshot {
  customerName: string;
  email?: string;
  phoneNumber?: string;
}

// ─────────────────────────────────────────────
// Sub-document: Product Snapshot
// ─────────────────────────────────────────────
export interface IProductSnapshot {
  productName: string;
  hsnNumber?: string;
  description?: string;
  size?: string;
}

// ─────────────────────────────────────────────
// Sub-document: Quotation Item
// ─────────────────────────────────────────────
export interface IQuotationItem {
  productId: mongoose.Types.ObjectId;
  productSnapshot: IProductSnapshot;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  selectedSize?: string;
  selectedTexture?: string;
  total: number;
}

// ─────────────────────────────────────────────
// Quotation interface
// ─────────────────────────────────────────────
export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
export type DisplayPreference = 'Customer Name' | 'Company Name' | 'Both';

export interface IQuotation {
  quotationId: string;
  customerId: mongoose.Types.ObjectId;
  customerSnapshot: ICustomerSnapshot;
  createdDate: Date;
  followUpDate?: Date;
  status: QuotationStatus;
  termsAndConditions: string[];
  validTill?: {
    days: number;
    months: number;
  };
  advancePayment?: number;
  deliveryTime?: number;
  transportationCharges?: number;
  totalAmount: number;
  totalDiscount: number;
  items: IQuotationItem[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuotationDocument extends IQuotation, Document {}
export interface IQuotationModel extends Model<IQuotationDocument> {
  generateQuotationId(): Promise<string>;
}

// ─────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────
const customerSnapshotSchema = new Schema<ICustomerSnapshot>(
  {
    customerName: { type: String, required: true },
    email: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
  },
  { _id: false }
);

const productSnapshotSchema = new Schema<IProductSnapshot>(
  {
    productName: { type: String, required: true },
    hsnNumber: { type: String, default: '' },
    description: { type: String, default: '' },
    size: { type: String, default: '' },
  },
  { _id: false }
);

const quotationItemSchema = new Schema<IQuotationItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    productSnapshot: {
      type: productSnapshotSchema,
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPercent: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0,
    },
    selectedSize: {
      type: String,
      default: '',
    },
    selectedTexture: {
      type: String,
      default: '',
    },
    total: {
      type: Number,
      min: [0, 'Total cannot be negative'],
      default: 0,
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────
// Main Quotation Schema
// ─────────────────────────────────────────────
const quotationSchema = new Schema<IQuotationDocument, IQuotationModel>(
  {
    quotationId: {
      type: String,
      unique: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },
    customerSnapshot: {
      type: customerSnapshotSchema,
      required: true,
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Sent', 'Accepted', 'Rejected'],
        message: 'Status must be Draft, Sent, Accepted, or Rejected',
      },
      default: 'Draft',
    },
    termsAndConditions: {
      type: [String],
      default: [],
    },
    validTill: {
      days: { type: Number, default: 15 },
      months: { type: Number, default: 0 },
    },
    advancePayment: {
      type: Number,
      default: 0,
    },
    deliveryTime: {
      type: Number,
      default: 10,
    },
    transportationCharges: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      min: [0, 'Total amount cannot be negative'],
      default: 0,
    },
    totalDiscount: {
      type: Number,
      min: [0, 'Total discount cannot be negative'],
      default: 0,
    },
    items: {
      type: [quotationItemSchema],
      validate: {
        validator: (v: IQuotationItem[]) => v.length > 0,
        message: 'At least one item is required',
      },
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
// Static: generate next QUO-XXXX id
// ─────────────────────────────────────────────
quotationSchema.statics['generateQuotationId'] = async function (): Promise<string> {
  const last = await this.findOne({}, { quotationId: 1 })
    .sort({ quotationId: -1 })
    .lean()
    .exec();

  if (!last?.quotationId) return 'QUO-0001';

  const num = parseInt(last.quotationId.replace('QUO-', ''), 10);
  return `QUO-${String(num + 1).padStart(4, '0')}`;
};

// ─────────────────────────────────────────────
// Pre-save: auto-set quotationId
// ─────────────────────────────────────────────
quotationSchema.pre('save', async function () {
  if (this.isNew && !this.quotationId) {
    const Model = this.constructor as IQuotationModel;
    this.quotationId = await Model.generateQuotationId();
  }
});

export const Quotation = mongoose.model<IQuotationDocument, IQuotationModel>(
  'Quotation',
  quotationSchema
);

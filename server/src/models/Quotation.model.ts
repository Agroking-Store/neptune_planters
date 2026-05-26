import mongoose, { Schema, Document, Model } from 'mongoose';

// ─────────────────────────────────────────────
// Sub-document: Customer Snapshot
// ─────────────────────────────────────────────
export interface ICustomerSnapshot {
  customerName: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  gstNumber?: string;
}

// ─────────────────────────────────────────────
// Sub-document: Product Snapshot
// ─────────────────────────────────────────────
export interface IProductSnapshot {
  productName: string;
  sku: string;
  hsnNumber?: string;
  size?: string;
  uom?: string;
}

// ─────────────────────────────────────────────
// Sub-document: Quotation Item
// ─────────────────────────────────────────────
export interface IQuotationItem {
  productId: mongoose.Types.ObjectId;
  productSnapshot: IProductSnapshot;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
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
  displayPreference: DisplayPreference;
  termsAndConditions: string[];
  notes?: string;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
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
    companyName: { type: String, default: '' },
    email: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
  },
  { _id: false }
);

const productSnapshotSchema = new Schema<IProductSnapshot>(
  {
    productName: { type: String, required: true },
    sku: { type: String, default: '' },
    hsnNumber: { type: String, default: '' },
    size: { type: String, default: '' },
    uom: { type: String, default: '' },
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
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      default: 0,
    },
    tax: {
      type: Number,
      min: [0, 'Tax cannot be negative'],
      default: 0,
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
    displayPreference: {
      type: String,
      enum: {
        values: ['Customer Name', 'Company Name', 'Both'],
        message: 'Display preference must be Customer Name, Company Name, or Both',
      },
      default: 'Both',
    },
    termsAndConditions: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    subtotal: {
      type: Number,
      min: [0, 'Subtotal cannot be negative'],
      default: 0,
    },
    tax: {
      type: Number,
      min: [0, 'Tax cannot be negative'],
      default: 0,
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      default: 0,
    },
    totalAmount: {
      type: Number,
      min: [0, 'Total amount cannot be negative'],
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

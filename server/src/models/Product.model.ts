import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  UOM_VALUES,
  PRODUCT_STATUS_VALUES,
  IMAGE_TYPE_VALUES,
  type UOM,
  type ProductStatus,
  type ImageType,
} from '../utils/constants';

// ─────────────────────────────────────────────
// Sub-document: Product Image
// ─────────────────────────────────────────────
export interface IProductImage {
  type: ImageType;
  url: string;
  publicId: string;
}

// ─────────────────────────────────────────────
// Product interface
// ─────────────────────────────────────────────
export interface IProduct {
  productId: string;
  productName: string;
  slug: string;
  productImages: IProductImage[];
  sku: string;
  hsnNumber?: string;
  description?: string;
  departmentId: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  brandId?: mongoose.Types.ObjectId;
  unitPrice: number;
  defaultDiscount: number;
  taxPercentage: number;
  stockQuantity: number;
  batchNo?: string;
  color?: string;
  productN?: string;
  size?: string;
  dimensions?: string;
  uom: UOM;
  status: ProductStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProduct, Document {}
export interface IProductModel extends Model<IProductDocument> {
  generateProductId(): Promise<string>;
}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const productImageSchema = new Schema<IProductImage>(
  {
    type: {
      type: String,
      enum: { values: [...IMAGE_TYPE_VALUES], message: 'Image type must be product, reference, or texture' },
      required: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  { _id: false }
);

const productSchema = new Schema<IProductDocument, IProductModel>(
  {
    productId: {
      type: String,
      unique: true,
      index: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    productImages: {
      type: [productImageSchema],
      default: [],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    hsnNumber: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    defaultDiscount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0,
    },
    taxPercentage: {
      type: Number,
      min: [0, 'Tax cannot be negative'],
      max: [100, 'Tax cannot exceed 100%'],
      default: 18,
    },
    stockQuantity: {
      type: Number,
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
    },
    batchNo: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    productN: {
      type: String,
      trim: true,
      default: '',
    },
    size: {
      type: String,
      trim: true,
      default: '',
    },
    dimensions: {
      type: String,
      trim: true,
      default: '',
    },
    uom: {
      type: String,
      enum: {
        values: [...UOM_VALUES] satisfies string[],
        message: `UOM must be one of: ${UOM_VALUES.join(', ')}`,
      },
      required: [true, 'Unit of measure is required'],
      default: 'pcs',
    },
    status: {
      type: String,
      enum: {
        values: [...PRODUCT_STATUS_VALUES] satisfies string[],
        message: 'Status must be Active or Inactive',
      },
      default: 'Active',
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
// Auto-generate slug from productName
// ─────────────────────────────────────────────
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─────────────────────────────────────────────
// Static: generate next PROD-XXXX id
// ─────────────────────────────────────────────
productSchema.statics['generateProductId'] = async function (): Promise<string> {
  const last = await this.findOne({}, { productId: 1 })
    .sort({ productId: -1 })
    .lean()
    .exec();

  if (!last?.productId) return 'PROD-0001';

  const num = parseInt(last.productId.replace('PROD-', ''), 10);
  return `PROD-${String(num + 1).padStart(4, '0')}`;
};

// ─────────────────────────────────────────────
// Pre-save: auto-set productId and slug
// ─────────────────────────────────────────────
productSchema.pre('save', async function () {
  if (this.isNew) {
    // Generate productId
    const Model = this.constructor as IProductModel;
    this.productId = await Model.generateProductId();

    // Generate unique slug
    const baseSlug = generateSlug(this.productName);
    let slug = baseSlug;
    let counter = 1;
    while (await mongoose.model('Product').exists({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }
    this.slug = slug;
  }
});

export const Product = mongoose.model<IProductDocument, IProductModel>(
  'Product',
  productSchema
);

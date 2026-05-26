import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISale extends Document {
  productId: Types.ObjectId;
  quotationId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalAmount: number; // Inclusive of tax (grand total for this item)
  selectedSize?: string;
  selectedTexture?: string;
  saleDate: Date;
  month: string; // e.g. "2026-05" for easy aggregation
  year: number;  // e.g. 2026
}

const SaleSchema = new Schema<ISale>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    selectedSize: { type: String, default: null },
    selectedTexture: { type: String, default: null },
    saleDate: { type: Date, required: true, default: Date.now },
    month: { type: String, required: true },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);

// Index for efficient querying by quotation, product, and dates
SaleSchema.index({ quotationId: 1 });
SaleSchema.index({ productId: 1 });
SaleSchema.index({ month: 1, year: 1 });

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);

import mongoose, { Document, Schema } from 'mongoose';

export type StockOutReason = 'DAMAGED' | 'EXPIRED' | 'LOST' | 'INTERNAL_USAGE' | 'MANUAL_ADJUSTMENT';

export interface IStockOut extends Document {
  referenceNumber: string;
  productId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  reason: StockOutReason;
  notes?: string;
  performedBy: mongoose.Types.ObjectId;
  performedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockOutSchema = new Schema<IStockOut>(
  {
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      enum: ['DAMAGED', 'EXPIRED', 'LOST', 'INTERNAL_USAGE', 'MANUAL_ADJUSTMENT'],
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const StockOut = mongoose.model<IStockOut>('StockOut', StockOutSchema);

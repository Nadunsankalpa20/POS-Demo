import mongoose, { Document, Schema } from 'mongoose';

export interface IStockIn extends Document {
  referenceNumber: string;
  supplierId?: mongoose.Types.ObjectId;
  supplierName: string;
  productId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  costPrice: number;
  totalCost: number;
  batchNumber?: string;
  expiryDate?: Date;
  notes?: string;
  receivedBy: mongoose.Types.ObjectId;
  receivedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockInSchema = new Schema<IStockIn>(
  {
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    supplierName: {
      type: String,
      required: true,
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
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    batchNumber: {
      type: String,
      default: '',
    },
    expiryDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receivedByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const StockIn = mongoose.model<IStockIn>('StockIn', StockInSchema);

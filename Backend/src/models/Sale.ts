import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethod = 'CASH' | 'CARD' | 'QR' | 'OTHER';
export type SaleStatus = 'COMPLETED' | 'VOIDED' | 'REFUNDED';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
}

export interface ISale extends Document {
  invoiceNumber: string;
  cashierId: mongoose.Types.ObjectId;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  change: number;
  paymentReference?: string;
  status: SaleStatus;
  voidReason?: string;
  voidedAt?: Date;
  voidedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      default: '',
    },
    barcode: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const SaleSchema = new Schema<ISale>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cashierName: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    items: [SaleItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'QR', 'OTHER'],
      required: true,
    },
    paymentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    change: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentReference: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'VOIDED', 'REFUNDED'],
      default: 'COMPLETED',
      index: true,
    },
    voidReason: {
      type: String,
      default: '',
    },
    voidedAt: {
      type: Date,
    },
    voidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);

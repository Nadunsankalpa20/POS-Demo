import mongoose, { Document, Schema } from 'mongoose';

export type MovementType = 'SALE' | 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'RETURN';

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  type: MovementType;
  quantity: number; // positive for addition, negative for deduction
  previousStock: number;
  newStock: number;
  referenceId: string; // Invoice number, StockIn ref, etc.
  notes?: string;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
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
    type: {
      type: String,
      enum: ['SALE', 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN'],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: String,
      default: '',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      default: 'System',
    },
  },
  {
    timestamps: true,
  }
);

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);

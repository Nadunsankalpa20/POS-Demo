import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  sku: string;
  barcode: string;
  productCode?: string;
  categoryId?: mongoose.Types.ObjectId;
  categoryName?: string;
  brandId?: mongoose.Types.ObjectId;
  brandName?: string;
  supplierId?: mongoose.Types.ObjectId;
  supplierName?: string;
  costPrice: number;
  sellingPrice: number;
  discount: number; // percentage or fixed
  tax: number; // percentage (e.g. 5 for 5%)
  stockQuantity: number;
  minimumStock: number;
  unit: string;
  imageUrl: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    barcode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    productCode: {
      type: String,
      trim: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    categoryName: {
      type: String,
      default: 'General',
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
    },
    brandName: {
      type: String,
      default: '',
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    supplierName: {
      type: String,
      default: '',
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sellingPrice: {
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
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    minimumStock: {
      type: Number,
      default: 10,
      min: 0,
    },
    unit: {
      type: String,
      default: 'Piece',
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching in POS
ProductSchema.index({ name: 'text', sku: 'text', barcode: 'text', productCode: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

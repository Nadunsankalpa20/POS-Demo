import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, closeDatabase } from '../config/database';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { Supplier } from '../models/Supplier';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';
import { Sale } from '../models/Sale';

export const seedDatabase = async () => {
  console.log('[Seed] Starting database seed...');

  // 1. Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Supplier.deleteMany({}),
    Product.deleteMany({}),
    StockMovement.deleteMany({}),
    Sale.deleteMany({}),
  ]);

  // 2. Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const managerPassword = await bcrypt.hash('manager123', salt);
  const cashierPassword = await bcrypt.hash('cashier123', salt);

  const [adminUser, managerUser, cashierUser] = await User.create([
    {
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
      active: true,
    },
    {
      username: 'manager',
      passwordHash: managerPassword,
      fullName: 'Store Manager (Sarah)',
      role: 'MANAGER',
      active: true,
    },
    {
      username: 'cashier',
      passwordHash: cashierPassword,
      fullName: 'Cashier 01 (Alex)',
      role: 'CASHIER',
      active: true,
    },
    {
      username: 'cashier2',
      passwordHash: cashierPassword,
      fullName: 'Cashier 02 (David)',
      role: 'CASHIER',
      active: true,
    },
  ]);
  console.log('[Seed] Created default users: admin, manager, cashier');

  // 3. Create Categories
  const categoriesData = [
    { name: 'Beverages', code: 'BEV', color: '#06b6d4', icon: 'Coffee', description: 'Soft drinks, juices, coffee, tea, water' },
    { name: 'Bakery', code: 'BAK', color: '#f59e0b', icon: 'Croissant', description: 'Fresh breads, pastries, buns, cakes' },
    { name: 'Dairy', code: 'DAI', color: '#3b82f6', icon: 'Milk', description: 'Milk, butter, cheeses, yogurts, creams' },
    { name: 'Snacks', code: 'SNK', color: '#ec4899', icon: 'Cookie', description: 'Crisps, chocolates, biscuits, nuts' },
    { name: 'Groceries', code: 'GRO', color: '#10b981', icon: 'ShoppingBag', description: 'Rice, flour, pasta, grains, spices' },
    { name: 'Personal Care', code: 'PER', color: '#8b5cf6', icon: 'Sparkles', description: 'Soaps, shampoos, oral care, lotions' },
    { name: 'Household', code: 'HOU', color: '#64748b', icon: 'Home', description: 'Cleaning supplies, detergents, paper towels' },
    { name: 'Frozen Food', code: 'FRZ', color: '#0284c7', icon: 'Snowflake', description: 'Ice creams, frozen veggies, pizzas' },
  ];

  const categories = await Category.create(categoriesData);
  const catMap = new Map(categories.map((c) => [c.name, c]));
  console.log(`[Seed] Created ${categories.length} categories`);

  // 4. Create Suppliers
  const suppliersData = [
    { name: 'Global Beverage Distro', contactPerson: 'John Smith', email: 'orders@globalbev.com', phone: '+1-555-0101' },
    { name: 'Nature Fresh Farms & Dairy', contactPerson: 'Emma Watson', email: 'supply@naturefresh.com', phone: '+1-555-0102' },
    { name: 'Prime Grocers Supply Ltd', contactPerson: 'Michael Chang', email: 'wholesale@primegrocers.com', phone: '+1-555-0103' },
    { name: 'Apex Household & Health', contactPerson: 'Laura Vance', email: 'sales@apexdistro.com', phone: '+1-555-0104' },
  ];
  const suppliers = await Supplier.create(suppliersData);
  const supMap = new Map(suppliers.map((s) => [s.name, s]));
  console.log(`[Seed] Created ${suppliers.length} suppliers`);

  // 5. Create Brands
  const brandsData = [
    { name: 'Coca Cola' },
    { name: 'Pepsi' },
    { name: 'Nestle' },
    { name: 'Anchor' },
    { name: 'Lays' },
    { name: 'Heinz' },
    { name: 'Unilever' },
    { name: 'Colgate' },
  ];
  const brands = await Brand.create(brandsData);
  const brandMap = new Map(brands.map((b) => [b.name, b]));

  // 6. Create 25+ Sample Products
  const productsData = [
    // Beverages
    {
      name: 'Coca Cola Classic 500ml',
      sku: 'COKE500',
      barcode: '890103000001',
      category: 'Beverages',
      brand: 'Coca Cola',
      supplier: 'Global Beverage Distro',
      costPrice: 160,
      sellingPrice: 240,
      discount: 0,
      tax: 5,
      stockQuantity: 120,
      minimumStock: 20,
      unit: 'Bottle',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Diet Coke 330ml Can',
      sku: 'DIETCOKE330',
      barcode: '890103000002',
      category: 'Beverages',
      brand: 'Coca Cola',
      supplier: 'Global Beverage Distro',
      costPrice: 140,
      sellingPrice: 210,
      discount: 5,
      tax: 5,
      stockQuantity: 80,
      minimumStock: 15,
      unit: 'Can',
      imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Pepsi Max 500ml',
      sku: 'PEPSI500',
      barcode: '890103000003',
      category: 'Beverages',
      brand: 'Pepsi',
      supplier: 'Global Beverage Distro',
      costPrice: 150,
      sellingPrice: 230,
      discount: 0,
      tax: 5,
      stockQuantity: 95,
      minimumStock: 20,
      unit: 'Bottle',
      imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Pure Spring Water 1.5L',
      sku: 'WATER1500',
      barcode: '890103000004',
      category: 'Beverages',
      brand: 'Nestle',
      supplier: 'Global Beverage Distro',
      costPrice: 60,
      sellingPrice: 110,
      discount: 0,
      tax: 0,
      stockQuantity: 150,
      minimumStock: 30,
      unit: 'Bottle',
      imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Orange Juice 1L Carton',
      sku: 'OJUICE1L',
      barcode: '890103000005',
      category: 'Beverages',
      brand: 'Nestle',
      supplier: 'Global Beverage Distro',
      costPrice: 280,
      sellingPrice: 420,
      discount: 10,
      tax: 5,
      stockQuantity: 40,
      minimumStock: 10,
      unit: 'Pack',
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
    },

    // Bakery
    {
      name: 'Artisan Sliced White Bread 450g',
      sku: 'BREAD450',
      barcode: '890103000006',
      category: 'Bakery',
      brand: 'Nestle',
      supplier: 'Nature Fresh Farms & Dairy',
      costPrice: 110,
      sellingPrice: 180,
      discount: 0,
      tax: 0,
      stockQuantity: 65,
      minimumStock: 15,
      unit: 'Loaf',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Whole Grain Brown Bread 500g',
      sku: 'BROWNBREAD500',
      barcode: '890103000007',
      category: 'Bakery',
      brand: 'Nestle',
      supplier: 'Nature Fresh Farms & Dairy',
      costPrice: 130,
      sellingPrice: 220,
      discount: 0,
      tax: 0,
      stockQuantity: 35,
      minimumStock: 10,
      unit: 'Loaf',
      imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Butter Croissant (Pack of 2)',
      sku: 'CROISSANT2P',
      barcode: '890103000008',
      category: 'Bakery',
      brand: 'Nestle',
      supplier: 'Nature Fresh Farms & Dairy',
      costPrice: 180,
      sellingPrice: 320,
      discount: 0,
      tax: 5,
      stockQuantity: 25,
      minimumStock: 8,
      unit: 'Pack',
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
    },

    // Dairy
    {
      name: 'Fresh Full Cream Milk 1L',
      sku: 'MILK1L',
      barcode: '890103000009',
      category: 'Dairy',
      brand: 'Anchor',
      supplier: 'Nature Fresh Farms & Dairy',
      costPrice: 220,
      sellingPrice: 310,
      discount: 0,
      tax: 0,
      stockQuantity: 90,
      minimumStock: 25,
      unit: 'Bottle',
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Anchor Pure Salted Butter 227g',
      sku: 'BUTTER227',
      barcode: '890103000010',
      category: 'Dairy',
      brand: 'Anchor',
      supplier: 'Nature Fresh Farms & Dairy',
      costPrice: 420,
      sellingPrice: 590,
      discount: 0,
      tax: 5,
      stockQuantity: 45,
      minimumStock: 12,
      unit: 'Pack',
      imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Cheddar Cheese Block 250g',
      sku: 'CHEDDAR250',
      barcode: '890103000011',
      category: 'Dairy',
      brand: 'Anchor',
      supplier: 'Nature Fresh Farms & Dairy',
      costPrice: 510,
      sellingPrice: 750,
      discount: 5,
      tax: 5,
      stockQuantity: 30,
      minimumStock: 10,
      unit: 'Block',
      imageUrl: 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Greek Natural Yogurt 500g',
      sku: 'YOGURT500',
      barcode: '890103000012',
      category: 'Dairy',
      brand: 'Nestle',
      supplier: 'Nature Fresh Farms & Dairy',
      costPrice: 260,
      sellingPrice: 380,
      discount: 0,
      tax: 0,
      stockQuantity: 8, // LOW STOCK example!
      minimumStock: 15,
      unit: 'Tub',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
    },

    // Snacks
    {
      name: "Lay's Classic Salted Chips 130g",
      sku: 'LAYS130',
      barcode: '890103000013',
      category: 'Snacks',
      brand: 'Lays',
      supplier: 'Prime Grocers Supply Ltd',
      costPrice: 150,
      sellingPrice: 250,
      discount: 0,
      tax: 5,
      stockQuantity: 110,
      minimumStock: 25,
      unit: 'Pack',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: "Lay's Barbecue Chips 130g",
      sku: 'LAYSBBQ130',
      barcode: '890103000014',
      category: 'Snacks',
      brand: 'Lays',
      supplier: 'Prime Grocers Supply Ltd',
      costPrice: 150,
      sellingPrice: 250,
      discount: 0,
      tax: 5,
      stockQuantity: 75,
      minimumStock: 20,
      unit: 'Pack',
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Dark Chocolate Bar 100g',
      sku: 'CHOCO100',
      barcode: '890103000015',
      category: 'Snacks',
      brand: 'Nestle',
      supplier: 'Prime Grocers Supply Ltd',
      costPrice: 220,
      sellingPrice: 350,
      discount: 10,
      tax: 5,
      stockQuantity: 60,
      minimumStock: 15,
      unit: 'Bar',
      imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=400&q=80',
    },

    // Groceries
    {
      name: 'Basmati Long Grain Rice 5kg',
      sku: 'RICE5KG',
      barcode: '890103000016',
      category: 'Groceries',
      brand: 'Heinz',
      supplier: 'Prime Grocers Supply Ltd',
      costPrice: 1450,
      sellingPrice: 1980,
      discount: 0,
      tax: 0,
      stockQuantity: 40,
      minimumStock: 10,
      unit: 'Bag',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Extra Virgin Olive Oil 750ml',
      sku: 'OLIVEOIL750',
      barcode: '890103000017',
      category: 'Groceries',
      brand: 'Heinz',
      supplier: 'Prime Grocers Supply Ltd',
      costPrice: 1800,
      sellingPrice: 2450,
      discount: 5,
      tax: 5,
      stockQuantity: 28,
      minimumStock: 8,
      unit: 'Bottle',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Heinz Tomato Ketchup 570g',
      sku: 'KETCHUP570',
      barcode: '890103000018',
      category: 'Groceries',
      brand: 'Heinz',
      supplier: 'Prime Grocers Supply Ltd',
      costPrice: 320,
      sellingPrice: 480,
      discount: 0,
      tax: 5,
      stockQuantity: 55,
      minimumStock: 15,
      unit: 'Bottle',
      imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Organic Honey Pure 500g',
      sku: 'HONEY500',
      barcode: '890103000019',
      category: 'Groceries',
      brand: 'Nestle',
      supplier: 'Prime Grocers Supply Ltd',
      costPrice: 650,
      sellingPrice: 950,
      discount: 0,
      tax: 5,
      stockQuantity: 0, // OUT OF STOCK example!
      minimumStock: 10,
      unit: 'Jar',
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80',
    },

    // Personal Care
    {
      name: 'Colgate Total Care Toothpaste 150g',
      sku: 'COLGATE150',
      barcode: '890103000020',
      category: 'Personal Care',
      brand: 'Colgate',
      supplier: 'Apex Household & Health',
      costPrice: 180,
      sellingPrice: 290,
      discount: 0,
      tax: 5,
      stockQuantity: 85,
      minimumStock: 20,
      unit: 'Tube',
      imageUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Dove Beauty Moisture Bar Soap 100g',
      sku: 'DOVESOAP100',
      barcode: '890103000021',
      category: 'Personal Care',
      brand: 'Unilever',
      supplier: 'Apex Household & Health',
      costPrice: 110,
      sellingPrice: 190,
      discount: 0,
      tax: 5,
      stockQuantity: 140,
      minimumStock: 30,
      unit: 'Piece',
      imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Herbal Essence Nourish Shampoo 400ml',
      sku: 'SHAMPOO400',
      barcode: '890103000022',
      category: 'Personal Care',
      brand: 'Unilever',
      supplier: 'Apex Household & Health',
      costPrice: 580,
      sellingPrice: 850,
      discount: 10,
      tax: 5,
      stockQuantity: 42,
      minimumStock: 12,
      unit: 'Bottle',
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
    },

    // Household
    {
      name: 'Dishwashing Liquid Lemon 750ml',
      sku: 'DISHLIQ750',
      barcode: '890103000023',
      category: 'Household',
      brand: 'Unilever',
      supplier: 'Apex Household & Health',
      costPrice: 220,
      sellingPrice: 340,
      discount: 0,
      tax: 5,
      stockQuantity: 60,
      minimumStock: 15,
      unit: 'Bottle',
      imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Ultra Clean Detergent Powder 2kg',
      sku: 'DETERGENT2KG',
      barcode: '890103000024',
      category: 'Household',
      brand: 'Unilever',
      supplier: 'Apex Household & Health',
      costPrice: 750,
      sellingPrice: 1120,
      discount: 0,
      tax: 5,
      stockQuantity: 38,
      minimumStock: 10,
      unit: 'Pack',
      imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80',
    },

    // Frozen Food
    {
      name: 'Vanilla Bean Ice Cream Tub 1L',
      sku: 'ICECREAM1L',
      barcode: '890103000025',
      category: 'Frozen Food',
      brand: 'Nestle',
      supplier: 'Nature Fresh Farms & Dairy',
      costPrice: 480,
      sellingPrice: 720,
      discount: 0,
      tax: 5,
      stockQuantity: 32,
      minimumStock: 10,
      unit: 'Tub',
      imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Frozen Mixed Green Vegetables 500g',
      sku: 'FROZENVEEG500',
      barcode: '890103000026',
      category: 'Frozen Food',
      brand: 'Heinz',
      supplier: 'Nature Fresh Farms & Dairy',
      costPrice: 240,
      sellingPrice: 390,
      discount: 0,
      tax: 0,
      stockQuantity: 50,
      minimumStock: 12,
      unit: 'Pack',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const products = [];
  for (const item of productsData) {
    const cat = catMap.get(item.category);
    const sup = supMap.get(item.supplier);
    const br = brandMap.get(item.brand);

    const product = await Product.create({
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      productCode: item.sku,
      categoryId: cat?._id,
      categoryName: item.category,
      supplierId: sup?._id,
      supplierName: item.supplier,
      brandId: br?._id,
      brandName: item.brand,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      discount: item.discount,
      tax: item.tax,
      stockQuantity: item.stockQuantity,
      minimumStock: item.minimumStock,
      unit: item.unit,
      imageUrl: item.imageUrl,
      status: 'Active',
    });

    products.push(product);

    // Create initial stock movement for tracking
    if (item.stockQuantity > 0) {
      await StockMovement.create({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        type: 'STOCK_IN',
        quantity: item.stockQuantity,
        previousStock: 0,
        newStock: item.stockQuantity,
        referenceId: 'INIT-SEED',
        notes: 'Initial opening inventory seed',
        userId: adminUser._id,
        userName: adminUser.fullName,
      });
    }
  }
  console.log(`[Seed] Created ${products.length} products with initial stock movements.`);

  // 7. Seed 2 Sample Completed Sales
  const cokeProd = products.find((p) => p.sku === 'COKE500')!;
  const breadProd = products.find((p) => p.sku === 'BREAD450')!;
  const milkProd = products.find((p) => p.sku === 'MILK1L')!;

  const sale1Items = [
    {
      productId: cokeProd._id,
      productName: cokeProd.name,
      sku: cokeProd.sku,
      barcode: cokeProd.barcode,
      quantity: 2,
      unitPrice: cokeProd.sellingPrice,
      costPrice: cokeProd.costPrice,
      discount: 0,
      tax: 24,
      lineTotal: 504,
    },
    {
      productId: breadProd._id,
      productName: breadProd.name,
      sku: breadProd.sku,
      barcode: breadProd.barcode,
      quantity: 1,
      unitPrice: breadProd.sellingPrice,
      costPrice: breadProd.costPrice,
      discount: 0,
      tax: 0,
      lineTotal: 180,
    },
  ];

  await Sale.create({
    invoiceNumber: 'INV-20260918-1001',
    cashierId: cashierUser._id,
    cashierName: cashierUser.fullName,
    customerName: 'Walk-in Customer',
    items: sale1Items,
    subtotal: 660,
    discount: 0,
    tax: 24,
    total: 684,
    paymentMethod: 'CASH',
    paymentAmount: 1000,
    change: 316,
    status: 'COMPLETED',
  });

  const sale2Items = [
    {
      productId: milkProd._id,
      productName: milkProd.name,
      sku: milkProd.sku,
      barcode: milkProd.barcode,
      quantity: 2,
      unitPrice: milkProd.sellingPrice,
      costPrice: milkProd.costPrice,
      discount: 0,
      tax: 0,
      lineTotal: 620,
    },
  ];

  await Sale.create({
    invoiceNumber: 'INV-20260918-1002',
    cashierId: cashierUser._id,
    cashierName: cashierUser.fullName,
    customerName: 'Robert Johnson',
    items: sale2Items,
    subtotal: 620,
    discount: 20,
    tax: 0,
    total: 600,
    paymentMethod: 'CARD',
    paymentAmount: 600,
    change: 0,
    paymentReference: 'TXN-984214',
    status: 'COMPLETED',
  });

  console.log('[Seed] Database seed completed successfully!');
};

// If run directly via tsx
if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await seedDatabase();
      await closeDatabase();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]', err);
      process.exit(1);
    }
  })();
}

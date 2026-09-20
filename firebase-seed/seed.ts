/**
 * Firebase Firestore Seed Script
 * Run: npx tsx seed.ts
 *
 * Populates Firestore with:
 *  - 3 default users (admin, manager, cashier)
 *  - 8 categories
 *  - 4 suppliers
 *  - 26 products with initial stock
 *  - 2 sample sales
 *
 * Set FIREBASE_SERVICE_ACCOUNT_KEY env var (path to serviceAccountKey.json)
 * OR use the Firebase emulator for local testing.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// ── Init ────────────────────────────────────────────────────────────────────

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './serviceAccountKey.json';
if (!fs.existsSync(keyPath)) {
  console.error(`❌  Service account key not found at: ${keyPath}`);
  console.error('   Download it from Firebase Console → Project Settings → Service Accounts → Generate new private key');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const authAdmin = getAuth();

// ── Helpers ─────────────────────────────────────────────────────────────────

const now = Timestamp.now();

async function clearCollection(name: string) {
  const snap = await db.collection(name).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`  ✓ Cleared ${name} (${snap.size} docs)`);
}

async function createAuthUser(email: string, password: string, uid?: string) {
  try {
    const existing = await authAdmin.getUserByEmail(email).catch(() => null);
    if (existing) {
      await authAdmin.updateUser(existing.uid, { password });
      return existing.uid;
    }
    const user = await authAdmin.createUser({ email, password, uid });
    return user.uid;
  } catch (err: any) {
    console.warn(`  ⚠ Auth user ${email}: ${err.message}`);
    return uid || email.replace(/[^a-z0-9]/g, '');
  }
}

// ── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Starting Firestore seed...\n');

  // Clear existing data
  console.log('Clearing existing collections...');
  await Promise.all([
    clearCollection('users'),
    clearCollection('categories'),
    clearCollection('suppliers'),
    clearCollection('products'),
    clearCollection('stockMovements'),
    clearCollection('sales'),
    clearCollection('auditLogs'),
  ]);

  // ── 1. Users ──────────────────────────────────────────────────────────────
  console.log('\nCreating users...');

  const adminUid = await createAuthUser('admin@pos.system', 'admin123');
  const managerUid = await createAuthUser('manager@pos.system', 'manager123');
  const cashierUid = await createAuthUser('cashier@pos.system', 'cashier123');
  const cashier2Uid = await createAuthUser('cashier2@pos.system', 'cashier123');

  const users = [
    { uid: adminUid, username: 'admin', fullName: 'System Administrator', role: 'ADMIN', email: 'admin@pos.system', active: true },
    { uid: managerUid, username: 'manager', fullName: 'Store Manager (Sarah)', role: 'MANAGER', email: 'manager@pos.system', active: true },
    { uid: cashierUid, username: 'cashier', fullName: 'Cashier 01 (Alex)', role: 'CASHIER', email: 'cashier@pos.system', active: true },
    { uid: cashier2Uid, username: 'cashier2', fullName: 'Cashier 02 (David)', role: 'CASHIER', email: 'cashier2@pos.system', active: true },
  ];

  const batch1 = db.batch();
  for (const u of users) {
    const ref = db.collection('users').doc(u.uid);
    const { uid, ...data } = u;
    batch1.set(ref, { ...data, createdAt: now, updatedAt: now });
  }
  await batch1.commit();
  console.log(`  ✓ Created ${users.length} users`);

  // ── 2. Categories ─────────────────────────────────────────────────────────
  console.log('\nCreating categories...');

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

  const catMap: Record<string, string> = {};
  const batch2 = db.batch();
  for (const cat of categoriesData) {
    const ref = db.collection('categories').doc();
    catMap[cat.name] = ref.id;
    batch2.set(ref, { ...cat, active: true, createdAt: now, updatedAt: now });
  }
  await batch2.commit();
  console.log(`  ✓ Created ${categoriesData.length} categories`);

  // ── 3. Suppliers ──────────────────────────────────────────────────────────
  console.log('\nCreating suppliers...');

  const suppliersData = [
    { name: 'Global Beverage Distro', contactPerson: 'John Smith', email: 'orders@globalbev.com', phone: '+1-555-0101' },
    { name: 'Nature Fresh Farms & Dairy', contactPerson: 'Emma Watson', email: 'supply@naturefresh.com', phone: '+1-555-0102' },
    { name: 'Prime Grocers Supply Ltd', contactPerson: 'Michael Chang', email: 'wholesale@primegrocers.com', phone: '+1-555-0103' },
    { name: 'Apex Household & Health', contactPerson: 'Laura Vance', email: 'sales@apexdistro.com', phone: '+1-555-0104' },
  ];

  const supMap: Record<string, string> = {};
  const batch3 = db.batch();
  for (const sup of suppliersData) {
    const ref = db.collection('suppliers').doc();
    supMap[sup.name] = ref.id;
    batch3.set(ref, { ...sup, createdAt: now, updatedAt: now });
  }
  await batch3.commit();
  console.log(`  ✓ Created ${suppliersData.length} suppliers`);

  // ── 4. Products ───────────────────────────────────────────────────────────
  console.log('\nCreating products...');

  const productsRaw = [
    { name: 'Coca Cola Classic 500ml', sku: 'COKE500', barcode: '890103000001', category: 'Beverages', supplier: 'Global Beverage Distro', costPrice: 160, sellingPrice: 240, discount: 0, tax: 5, stockQuantity: 120, minimumStock: 20, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80' },
    { name: 'Diet Coke 330ml Can', sku: 'DIETCOKE330', barcode: '890103000002', category: 'Beverages', supplier: 'Global Beverage Distro', costPrice: 140, sellingPrice: 210, discount: 5, tax: 5, stockQuantity: 80, minimumStock: 15, unit: 'Can', imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80' },
    { name: 'Pepsi Max 500ml', sku: 'PEPSI500', barcode: '890103000003', category: 'Beverages', supplier: 'Global Beverage Distro', costPrice: 150, sellingPrice: 230, discount: 0, tax: 5, stockQuantity: 95, minimumStock: 20, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=400&q=80' },
    { name: 'Pure Spring Water 1.5L', sku: 'WATER1500', barcode: '890103000004', category: 'Beverages', supplier: 'Global Beverage Distro', costPrice: 60, sellingPrice: 110, discount: 0, tax: 0, stockQuantity: 150, minimumStock: 30, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80' },
    { name: 'Orange Juice 1L Carton', sku: 'OJUICE1L', barcode: '890103000005', category: 'Beverages', supplier: 'Global Beverage Distro', costPrice: 280, sellingPrice: 420, discount: 10, tax: 5, stockQuantity: 40, minimumStock: 10, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80' },
    { name: 'Artisan Sliced White Bread 450g', sku: 'BREAD450', barcode: '890103000006', category: 'Bakery', supplier: 'Nature Fresh Farms & Dairy', costPrice: 110, sellingPrice: 180, discount: 0, tax: 0, stockQuantity: 65, minimumStock: 15, unit: 'Loaf', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
    { name: 'Whole Grain Brown Bread 500g', sku: 'BROWNBREAD500', barcode: '890103000007', category: 'Bakery', supplier: 'Nature Fresh Farms & Dairy', costPrice: 130, sellingPrice: 220, discount: 0, tax: 0, stockQuantity: 35, minimumStock: 10, unit: 'Loaf', imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80' },
    { name: 'Butter Croissant (Pack of 2)', sku: 'CROISSANT2P', barcode: '890103000008', category: 'Bakery', supplier: 'Nature Fresh Farms & Dairy', costPrice: 180, sellingPrice: 320, discount: 0, tax: 5, stockQuantity: 25, minimumStock: 8, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80' },
    { name: 'Fresh Full Cream Milk 1L', sku: 'MILK1L', barcode: '890103000009', category: 'Dairy', supplier: 'Nature Fresh Farms & Dairy', costPrice: 220, sellingPrice: 310, discount: 0, tax: 0, stockQuantity: 90, minimumStock: 25, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80' },
    { name: 'Anchor Pure Salted Butter 227g', sku: 'BUTTER227', barcode: '890103000010', category: 'Dairy', supplier: 'Nature Fresh Farms & Dairy', costPrice: 420, sellingPrice: 590, discount: 0, tax: 5, stockQuantity: 45, minimumStock: 12, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Cheddar Cheese Block 250g', sku: 'CHEDDAR250', barcode: '890103000011', category: 'Dairy', supplier: 'Nature Fresh Farms & Dairy', costPrice: 510, sellingPrice: 750, discount: 5, tax: 5, stockQuantity: 30, minimumStock: 10, unit: 'Block', imageUrl: 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?auto=format&fit=crop&w=400&q=80' },
    { name: 'Greek Natural Yogurt 500g', sku: 'YOGURT500', barcode: '890103000012', category: 'Dairy', supplier: 'Nature Fresh Farms & Dairy', costPrice: 260, sellingPrice: 380, discount: 0, tax: 0, stockQuantity: 8, minimumStock: 15, unit: 'Tub', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80' },
    { name: "Lay's Classic Salted Chips 130g", sku: 'LAYS130', barcode: '890103000013', category: 'Snacks', supplier: 'Prime Grocers Supply Ltd', costPrice: 150, sellingPrice: 250, discount: 0, tax: 5, stockQuantity: 110, minimumStock: 25, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80' },
    { name: "Lay's Barbecue Chips 130g", sku: 'LAYSBBQ130', barcode: '890103000014', category: 'Snacks', supplier: 'Prime Grocers Supply Ltd', costPrice: 150, sellingPrice: 250, discount: 0, tax: 5, stockQuantity: 75, minimumStock: 20, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80' },
    { name: 'Dark Chocolate Bar 100g', sku: 'CHOCO100', barcode: '890103000015', category: 'Snacks', supplier: 'Prime Grocers Supply Ltd', costPrice: 220, sellingPrice: 350, discount: 10, tax: 5, stockQuantity: 60, minimumStock: 15, unit: 'Bar', imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=400&q=80' },
    { name: 'Basmati Long Grain Rice 5kg', sku: 'RICE5KG', barcode: '890103000016', category: 'Groceries', supplier: 'Prime Grocers Supply Ltd', costPrice: 1450, sellingPrice: 1980, discount: 0, tax: 0, stockQuantity: 40, minimumStock: 10, unit: 'Bag', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Extra Virgin Olive Oil 750ml', sku: 'OLIVEOIL750', barcode: '890103000017', category: 'Groceries', supplier: 'Prime Grocers Supply Ltd', costPrice: 1800, sellingPrice: 2450, discount: 5, tax: 5, stockQuantity: 28, minimumStock: 8, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
    { name: 'Heinz Tomato Ketchup 570g', sku: 'KETCHUP570', barcode: '890103000018', category: 'Groceries', supplier: 'Prime Grocers Supply Ltd', costPrice: 320, sellingPrice: 480, discount: 0, tax: 5, stockQuantity: 55, minimumStock: 15, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80' },
    { name: 'Organic Honey Pure 500g', sku: 'HONEY500', barcode: '890103000019', category: 'Groceries', supplier: 'Prime Grocers Supply Ltd', costPrice: 650, sellingPrice: 950, discount: 0, tax: 5, stockQuantity: 0, minimumStock: 10, unit: 'Jar', imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80' },
    { name: 'Colgate Total Care Toothpaste 150g', sku: 'COLGATE150', barcode: '890103000020', category: 'Personal Care', supplier: 'Apex Household & Health', costPrice: 180, sellingPrice: 290, discount: 0, tax: 5, stockQuantity: 85, minimumStock: 20, unit: 'Tube', imageUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=400&q=80' },
    { name: 'Dove Beauty Moisture Bar Soap 100g', sku: 'DOVESOAP100', barcode: '890103000021', category: 'Personal Care', supplier: 'Apex Household & Health', costPrice: 110, sellingPrice: 190, discount: 0, tax: 5, stockQuantity: 140, minimumStock: 30, unit: 'Piece', imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=400&q=80' },
    { name: 'Herbal Essence Nourish Shampoo 400ml', sku: 'SHAMPOO400', barcode: '890103000022', category: 'Personal Care', supplier: 'Apex Household & Health', costPrice: 580, sellingPrice: 850, discount: 10, tax: 5, stockQuantity: 42, minimumStock: 12, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Dishwashing Liquid Lemon 750ml', sku: 'DISHLIQ750', barcode: '890103000023', category: 'Household', supplier: 'Apex Household & Health', costPrice: 220, sellingPrice: 340, discount: 0, tax: 5, stockQuantity: 60, minimumStock: 15, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=80' },
    { name: 'Ultra Clean Detergent Powder 2kg', sku: 'DETERGENT2KG', barcode: '890103000024', category: 'Household', supplier: 'Apex Household & Health', costPrice: 750, sellingPrice: 1120, discount: 0, tax: 5, stockQuantity: 38, minimumStock: 10, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80' },
    { name: 'Vanilla Bean Ice Cream Tub 1L', sku: 'ICECREAM1L', barcode: '890103000025', category: 'Frozen Food', supplier: 'Nature Fresh Farms & Dairy', costPrice: 480, sellingPrice: 720, discount: 0, tax: 5, stockQuantity: 32, minimumStock: 10, unit: 'Tub', imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80' },
    { name: 'Frozen Mixed Green Vegetables 500g', sku: 'FROZENVEEG500', barcode: '890103000026', category: 'Frozen Food', supplier: 'Nature Fresh Farms & Dairy', costPrice: 240, sellingPrice: 390, discount: 0, tax: 0, stockQuantity: 50, minimumStock: 12, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80' },
  ];

  const productIds: Record<string, string> = {};
  const movBatch = db.batch();

  for (const item of productsRaw) {
    const prodRef = db.collection('products').doc();
    productIds[item.sku] = prodRef.id;
    const categoryId = catMap[item.category] || '';
    const supplierId = supMap[item.supplier] || '';

    await prodRef.set({
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      productCode: item.sku,
      categoryId,
      categoryName: item.category,
      supplierId,
      supplierName: item.supplier,
      brandName: '',
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      discount: item.discount,
      tax: item.tax,
      stockQuantity: item.stockQuantity,
      minimumStock: item.minimumStock,
      unit: item.unit,
      imageUrl: item.imageUrl,
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    });

    if (item.stockQuantity > 0) {
      const movRef = db.collection('stockMovements').doc();
      movBatch.set(movRef, {
        productId: prodRef.id,
        productName: item.name,
        sku: item.sku,
        type: 'STOCK_IN',
        quantity: item.stockQuantity,
        previousStock: 0,
        newStock: item.stockQuantity,
        referenceId: 'INIT-SEED',
        notes: 'Initial opening inventory seed',
        userId: adminUid,
        userName: 'System Administrator',
        createdAt: now,
      });
    }
  }
  await movBatch.commit();
  console.log(`  ✓ Created ${productsRaw.length} products with stock movements`);

  // ── 5. Sample Sales ───────────────────────────────────────────────────────
  console.log('\nCreating sample sales...');

  const cokeId = productIds['COKE500'];
  const breadId = productIds['BREAD450'];
  const milkId = productIds['MILK1L'];

  await db.collection('sales').add({
    invoiceNumber: 'INV-20260918-1001',
    cashierId: cashierUid,
    cashierName: 'Cashier 01 (Alex)',
    customerName: 'Walk-in Customer',
    items: [
      { productId: cokeId, productName: 'Coca Cola Classic 500ml', sku: 'COKE500', barcode: '890103000001', quantity: 2, unitPrice: 240, costPrice: 160, discount: 0, tax: 24, lineTotal: 504 },
      { productId: breadId, productName: 'Artisan Sliced White Bread 450g', sku: 'BREAD450', barcode: '890103000006', quantity: 1, unitPrice: 180, costPrice: 110, discount: 0, tax: 0, lineTotal: 180 },
    ],
    subtotal: 660,
    discount: 0,
    tax: 24,
    total: 684,
    paymentMethod: 'CASH',
    paymentAmount: 1000,
    change: 316,
    status: 'COMPLETED',
    createdAt: now,
    updatedAt: now,
  });

  await db.collection('sales').add({
    invoiceNumber: 'INV-20260918-1002',
    cashierId: cashierUid,
    cashierName: 'Cashier 01 (Alex)',
    customerName: 'Robert Johnson',
    items: [
      { productId: milkId, productName: 'Fresh Full Cream Milk 1L', sku: 'MILK1L', barcode: '890103000009', quantity: 2, unitPrice: 310, costPrice: 220, discount: 0, tax: 0, lineTotal: 620 },
    ],
    subtotal: 620,
    discount: 20,
    tax: 0,
    total: 600,
    paymentMethod: 'CARD',
    paymentAmount: 600,
    change: 0,
    paymentReference: 'TXN-984214',
    status: 'COMPLETED',
    createdAt: now,
    updatedAt: now,
  });

  console.log('  ✓ Created 2 sample sales');
  console.log('\n✅ Firestore seed completed successfully!\n');
  console.log('Default Login Credentials:');
  console.log('  Admin:    admin / admin123    → admin@pos.system');
  console.log('  Manager:  manager / manager123 → manager@pos.system');
  console.log('  Cashier:  cashier / cashier123 → cashier@pos.system');
  console.log('  Cashier2: cashier2 / cashier123 → cashier2@pos.system\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

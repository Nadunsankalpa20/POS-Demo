import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBlCnLroD2qk8F2NYE07UW5OCFCz-hV8iI",
  authDomain: "pos-demo-837d5.firebaseapp.com",
  projectId: "pos-demo-837d5",
  storageBucket: "pos-demo-837d5.firebasestorage.app",
  messagingSenderId: "594812029122",
  appId: "1:594812029122:web:2c1a06d3082dca2f6e935b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function getOrCreateAuthUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`  ✓ Created auth user: ${email}`);
    return cred.user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log(`  ✓ Auth user exists, signed in: ${email}`);
      return cred.user.uid;
    }
    console.warn(`  ⚠ Could not create auth user ${email}: ${err.message}`);
    // Generate fallback UID based on email
    return email.replace(/[^a-zA-Z0-9]/g, '_');
  }
}

async function runSeed() {
  console.log('🚀 Starting Firebase Firestore Seed for pos-demo-837d5...\n');

  // 1. Auth Users
  console.log('1. Setting up Staff Login Accounts...');
  const adminUid = await getOrCreateAuthUser('admin@pos.system', 'admin123');
  const managerUid = await getOrCreateAuthUser('manager@pos.system', 'manager123');
  const cashierUid = await getOrCreateAuthUser('cashier@pos.system', 'cashier123');
  const cashier2Uid = await getOrCreateAuthUser('cashier2@pos.system', 'cashier123');

  const staffProfiles = [
    { uid: adminUid, username: 'admin', fullName: 'System Administrator', role: 'ADMIN', email: 'admin@pos.system', password: 'admin123', active: true },
    { uid: managerUid, username: 'manager', fullName: 'Store Manager (Sarah)', role: 'MANAGER', email: 'manager@pos.system', password: 'manager123', active: true },
    { uid: cashierUid, username: 'cashier', fullName: 'Cashier 01 (Alex)', role: 'CASHIER', email: 'cashier@pos.system', password: 'cashier123', active: true },
    { uid: cashier2Uid, username: 'cashier2', fullName: 'Cashier 02 (David)', role: 'CASHIER', email: 'cashier2@pos.system', password: 'cashier123', active: true },
  ];

  for (const staff of staffProfiles) {
    await setDoc(doc(db, 'users', staff.uid), {
      ...staff,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  console.log('  ✓ Staff profiles saved to Firestore\n');

  // 2. Categories
  console.log('2. Creating Categories...');
  const categoriesData = [
    { id: 'cat_bev', name: 'Beverages', code: 'BEV', color: '#06b6d4', icon: 'Coffee', description: 'Soft drinks, juices, coffee, tea, water', active: true },
    { id: 'cat_bak', name: 'Bakery', code: 'BAK', color: '#f59e0b', icon: 'Croissant', description: 'Fresh breads, pastries, buns, cakes', active: true },
    { id: 'cat_dai', name: 'Dairy', code: 'DAI', color: '#3b82f6', icon: 'Milk', description: 'Milk, butter, cheeses, yogurts, creams', active: true },
    { id: 'cat_snk', name: 'Snacks', code: 'SNK', color: '#ec4899', icon: 'Cookie', description: 'Crisps, chocolates, biscuits, nuts', active: true },
    { id: 'cat_gro', name: 'Groceries', code: 'GRO', color: '#10b981', icon: 'ShoppingBag', description: 'Rice, flour, pasta, grains, spices', active: true },
    { id: 'cat_per', name: 'Personal Care', code: 'PER', color: '#8b5cf6', icon: 'Sparkles', description: 'Soaps, shampoos, oral care, lotions', active: true },
    { id: 'cat_hou', name: 'Household', code: 'HOU', color: '#64748b', icon: 'Home', description: 'Cleaning supplies, detergents, paper towels', active: true },
    { id: 'cat_frz', name: 'Frozen Food', code: 'FRZ', color: '#0284c7', icon: 'Snowflake', description: 'Ice creams, frozen veggies, pizzas', active: true },
  ];

  for (const cat of categoriesData) {
    await setDoc(doc(db, 'categories', cat.id), {
      ...cat,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  console.log(`  ✓ ${categoriesData.length} categories created\n`);

  // 3. Suppliers
  console.log('3. Creating Suppliers...');
  const suppliersData = [
    { id: 'sup_bev', name: 'Global Beverage Distro', contactPerson: 'John Smith', email: 'orders@globalbev.com', phone: '+1-555-0101' },
    { id: 'sup_dairy', name: 'Nature Fresh Farms & Dairy', contactPerson: 'Emma Watson', email: 'supply@naturefresh.com', phone: '+1-555-0102' },
    { id: 'sup_grocer', name: 'Prime Grocers Supply Ltd', contactPerson: 'Michael Chang', email: 'wholesale@primegrocers.com', phone: '+1-555-0103' },
    { id: 'sup_apex', name: 'Apex Household & Health', contactPerson: 'Laura Vance', email: 'sales@apexdistro.com', phone: '+1-555-0104' },
  ];

  for (const sup of suppliersData) {
    await setDoc(doc(db, 'suppliers', sup.id), {
      ...sup,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  console.log(`  ✓ ${suppliersData.length} suppliers created\n`);

  // 4. Products
  console.log('4. Creating Products...');
  const productsRaw = [
    { name: 'Coca Cola Classic 500ml', sku: 'COKE500', barcode: '890103000001', categoryId: 'cat_bev', categoryName: 'Beverages', supplierId: 'sup_bev', supplierName: 'Global Beverage Distro', costPrice: 160, sellingPrice: 240, discount: 0, tax: 5, stockQuantity: 120, minimumStock: 20, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80' },
    { name: 'Diet Coke 330ml Can', sku: 'DIETCOKE330', barcode: '890103000002', categoryId: 'cat_bev', categoryName: 'Beverages', supplierId: 'sup_bev', supplierName: 'Global Beverage Distro', costPrice: 140, sellingPrice: 210, discount: 5, tax: 5, stockQuantity: 80, minimumStock: 15, unit: 'Can', imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80' },
    { name: 'Pepsi Max 500ml', sku: 'PEPSI500', barcode: '890103000003', categoryId: 'cat_bev', categoryName: 'Beverages', supplierId: 'sup_bev', supplierName: 'Global Beverage Distro', costPrice: 150, sellingPrice: 230, discount: 0, tax: 5, stockQuantity: 95, minimumStock: 20, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=400&q=80' },
    { name: 'Pure Spring Water 1.5L', sku: 'WATER1500', barcode: '890103000004', categoryId: 'cat_bev', categoryName: 'Beverages', supplierId: 'sup_bev', supplierName: 'Global Beverage Distro', costPrice: 60, sellingPrice: 110, discount: 0, tax: 0, stockQuantity: 150, minimumStock: 30, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80' },
    { name: 'Orange Juice 1L Carton', sku: 'OJUICE1L', barcode: '890103000005', categoryId: 'cat_bev', categoryName: 'Beverages', supplierId: 'sup_bev', supplierName: 'Global Beverage Distro', costPrice: 280, sellingPrice: 420, discount: 10, tax: 5, stockQuantity: 40, minimumStock: 10, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80' },
    { name: 'Artisan Sliced White Bread 450g', sku: 'BREAD450', barcode: '890103000006', categoryId: 'cat_bak', categoryName: 'Bakery', supplierId: 'sup_dairy', supplierName: 'Nature Fresh Farms & Dairy', costPrice: 110, sellingPrice: 180, discount: 0, tax: 0, stockQuantity: 65, minimumStock: 15, unit: 'Loaf', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
    { name: 'Whole Grain Brown Bread 500g', sku: 'BROWNBREAD500', barcode: '890103000007', categoryId: 'cat_bak', categoryName: 'Bakery', supplierId: 'sup_dairy', supplierName: 'Nature Fresh Farms & Dairy', costPrice: 130, sellingPrice: 220, discount: 0, tax: 0, stockQuantity: 35, minimumStock: 10, unit: 'Loaf', imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80' },
    { name: 'Butter Croissant (Pack of 2)', sku: 'CROISSANT2P', barcode: '890103000008', categoryId: 'cat_bak', categoryName: 'Bakery', supplierId: 'sup_dairy', supplierName: 'Nature Fresh Farms & Dairy', costPrice: 180, sellingPrice: 320, discount: 0, tax: 5, stockQuantity: 25, minimumStock: 8, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80' },
    { name: 'Fresh Full Cream Milk 1L', sku: 'MILK1L', barcode: '890103000009', categoryId: 'cat_dai', categoryName: 'Dairy', supplierId: 'sup_dairy', supplierName: 'Nature Fresh Farms & Dairy', costPrice: 220, sellingPrice: 310, discount: 0, tax: 0, stockQuantity: 90, minimumStock: 25, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80' },
    { name: 'Anchor Pure Salted Butter 227g', sku: 'BUTTER227', barcode: '890103000010', categoryId: 'cat_dai', categoryName: 'Dairy', supplierId: 'sup_dairy', supplierName: 'Nature Fresh Farms & Dairy', costPrice: 420, sellingPrice: 590, discount: 0, tax: 5, stockQuantity: 45, minimumStock: 12, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Cheddar Cheese Block 250g', sku: 'CHEDDAR250', barcode: '890103000011', categoryId: 'cat_dai', categoryName: 'Dairy', supplierId: 'sup_dairy', supplierName: 'Nature Fresh Farms & Dairy', costPrice: 510, sellingPrice: 750, discount: 5, tax: 5, stockQuantity: 30, minimumStock: 10, unit: 'Block', imageUrl: 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?auto=format&fit=crop&w=400&q=80' },
    { name: 'Greek Natural Yogurt 500g', sku: 'YOGURT500', barcode: '890103000012', categoryId: 'cat_dai', categoryName: 'Dairy', supplierId: 'sup_dairy', supplierName: 'Nature Fresh Farms & Dairy', costPrice: 260, sellingPrice: 380, discount: 0, tax: 0, stockQuantity: 8, minimumStock: 15, unit: 'Tub', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80' },
    { name: "Lay's Classic Salted Chips 130g", sku: 'LAYS130', barcode: '890103000013', categoryId: 'cat_snk', categoryName: 'Snacks', supplierId: 'sup_grocer', supplierName: 'Prime Grocers Supply Ltd', costPrice: 150, sellingPrice: 250, discount: 0, tax: 5, stockQuantity: 110, minimumStock: 25, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80' },
    { name: "Lay's Barbecue Chips 130g", sku: 'LAYSBBQ130', barcode: '890103000014', categoryId: 'cat_snk', categoryName: 'Snacks', supplierId: 'sup_grocer', supplierName: 'Prime Grocers Supply Ltd', costPrice: 150, sellingPrice: 250, discount: 0, tax: 5, stockQuantity: 75, minimumStock: 20, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80' },
    { name: 'Dark Chocolate Bar 100g', sku: 'CHOCO100', barcode: '890103000015', categoryId: 'cat_snk', categoryName: 'Snacks', supplierId: 'sup_grocer', supplierName: 'Prime Grocers Supply Ltd', costPrice: 220, sellingPrice: 350, discount: 10, tax: 5, stockQuantity: 60, minimumStock: 15, unit: 'Bar', imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=400&q=80' },
    { name: 'Basmati Long Grain Rice 5kg', sku: 'RICE5KG', barcode: '890103000016', categoryId: 'cat_gro', categoryName: 'Groceries', supplierId: 'sup_grocer', supplierName: 'Prime Grocers Supply Ltd', costPrice: 1450, sellingPrice: 1980, discount: 0, tax: 0, stockQuantity: 40, minimumStock: 10, unit: 'Bag', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Extra Virgin Olive Oil 750ml', sku: 'OLIVEOIL750', barcode: '890103000017', categoryId: 'cat_gro', categoryName: 'Groceries', supplierId: 'sup_grocer', supplierName: 'Prime Grocers Supply Ltd', costPrice: 1800, sellingPrice: 2450, discount: 5, tax: 5, stockQuantity: 28, minimumStock: 8, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
    { name: 'Heinz Tomato Ketchup 570g', sku: 'KETCHUP570', barcode: '890103000018', categoryId: 'cat_gro', categoryName: 'Groceries', supplierId: 'sup_grocer', supplierName: 'Prime Grocers Supply Ltd', costPrice: 320, sellingPrice: 480, discount: 0, tax: 5, stockQuantity: 55, minimumStock: 15, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80' },
    { name: 'Organic Honey Pure 500g', sku: 'HONEY500', barcode: '890103000019', categoryId: 'cat_gro', categoryName: 'Groceries', supplierId: 'sup_grocer', supplierName: 'Prime Grocers Supply Ltd', costPrice: 650, sellingPrice: 950, discount: 0, tax: 5, stockQuantity: 0, minimumStock: 10, unit: 'Jar', imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80' },
    { name: 'Colgate Total Care Toothpaste 150g', sku: 'COLGATE150', barcode: '890103000020', categoryId: 'cat_per', categoryName: 'Personal Care', supplierId: 'sup_apex', supplierName: 'Apex Household & Health', costPrice: 180, sellingPrice: 290, discount: 0, tax: 5, stockQuantity: 85, minimumStock: 20, unit: 'Tube', imageUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=400&q=80' },
    { name: 'Dove Beauty Moisture Bar Soap 100g', sku: 'DOVESOAP100', barcode: '890103000021', categoryId: 'cat_per', categoryName: 'Personal Care', supplierId: 'sup_apex', supplierName: 'Apex Household & Health', costPrice: 110, sellingPrice: 190, discount: 0, tax: 5, stockQuantity: 140, minimumStock: 30, unit: 'Piece', imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=400&q=80' },
    { name: 'Herbal Essence Nourish Shampoo 400ml', sku: 'SHAMPOO400', barcode: '890103000022', categoryId: 'cat_per', categoryName: 'Personal Care', supplierId: 'sup_apex', supplierName: 'Apex Household & Health', costPrice: 580, sellingPrice: 850, discount: 10, tax: 5, stockQuantity: 42, minimumStock: 12, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Dishwashing Liquid Lemon 750ml', sku: 'DISHLIQ750', barcode: '890103000023', categoryId: 'cat_hou', categoryName: 'Household', supplierId: 'sup_apex', supplierName: 'Apex Household & Health', costPrice: 220, sellingPrice: 340, discount: 0, tax: 5, stockQuantity: 60, minimumStock: 15, unit: 'Bottle', imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=80' },
    { name: 'Ultra Clean Detergent Powder 2kg', sku: 'DETERGENT2KG', barcode: '890103000024', categoryId: 'cat_hou', categoryName: 'Household', supplierId: 'sup_apex', supplierName: 'Apex Household & Health', costPrice: 750, sellingPrice: 1120, discount: 0, tax: 5, stockQuantity: 38, minimumStock: 10, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80' },
    { name: 'Vanilla Bean Ice Cream Tub 1L', sku: 'ICECREAM1L', barcode: '890103000025', categoryId: 'cat_frz', categoryName: 'Frozen Food', supplierId: 'sup_dairy', supplierName: 'Nature Fresh Farms & Dairy', costPrice: 480, sellingPrice: 720, discount: 0, tax: 5, stockQuantity: 32, minimumStock: 10, unit: 'Tub', imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80' },
    { name: 'Frozen Mixed Green Vegetables 500g', sku: 'FROZENVEEG500', barcode: '890103000026', categoryId: 'cat_frz', categoryName: 'Frozen Food', supplierId: 'sup_dairy', supplierName: 'Nature Fresh Farms & Dairy', costPrice: 240, sellingPrice: 390, discount: 0, tax: 0, stockQuantity: 50, minimumStock: 12, unit: 'Pack', imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80' },
  ];

  for (const item of productsRaw) {
    const prodDoc = doc(collection(db, 'products'));
    await setDoc(prodDoc, {
      ...item,
      productCode: item.sku,
      brandName: '',
      status: 'Active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  console.log(`  ✓ ${productsRaw.length} products created in Firestore\n`);

  console.log('🎉 Firestore Seed completed successfully!');
  console.log('\nDefault Logins:');
  console.log('  Admin:     admin / admin123');
  console.log('  Manager:   manager / manager123');
  console.log('  Cashier:   cashier / cashier123');
  console.log('  Cashier 2: cashier2 / cashier123\n');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});

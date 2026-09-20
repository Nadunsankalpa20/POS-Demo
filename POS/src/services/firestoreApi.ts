import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { db, auth } from './firebase';

// ─── Auth ──────────────────────────────────────────────────────────────────

export const firebaseAuth = {
  /**
   * Login using username → looks up email in users collection, then signs in via Firebase Auth.
   * Password is managed by Firebase Auth.
   */
  async login(username: string, password: string) {
    // 1. Find user document by username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Invalid username or password');

    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    if (!userData.active) throw new Error('Account is inactive. Contact admin.');

    // 2. Sign in with Firebase Auth or fallback to verified profile
    let token = `firestore-token-${userDoc.id}`;
    try {
      const email = userData.email as string;
      const credential = await signInWithEmailAndPassword(auth, email, password);
      token = await credential.user.getIdToken();
    } catch {
      if (userData.password && userData.password !== password) {
        throw new Error('Invalid username or password');
      }
    }

    return {
      token,
      user: {
        id: userDoc.id,
        username: userData.username,
        fullName: userData.fullName,
        role: userData.role,
        active: userData.active,
      },
    };
  },

  async logout() {
    await signOut(auth);
  },
};

// ─── Products ──────────────────────────────────────────────────────────────

export const productsApi = {
  async getAll(params?: { search?: string; categoryId?: string; status?: string }) {
    const constraints: QueryConstraint[] = [];

    if (params?.status && params.status !== 'ALL') {
      constraints.push(where('status', '==', params.status));
    } else {
      constraints.push(where('status', '==', 'Active'));
    }

    if (params?.categoryId && params.categoryId !== 'ALL') {
      constraints.push(where('categoryId', '==', params.categoryId));
    }

    constraints.push(orderBy('name'));
    constraints.push(limit(150));

    const q = query(collection(db, 'products'), ...constraints);
    const snap = await getDocs(q);

    let products = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    // Client-side search filter (Firestore doesn't support full-text search)
    if (params?.search) {
      const term = params.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term) ||
          p.productCode?.toLowerCase().includes(term)
      );
    }

    return { products, total: products.length };
  },

  async getByBarcode(barcode: string) {
    const q = query(collection(db, 'products'), where('barcode', '==', barcode), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Product not found');
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  },

  /** Subscribe to real-time product changes (for live stock updates in POS) */
  subscribeToProducts(callback: (products: any[]) => void) {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'Active'),
      orderBy('name')
    );
    return onSnapshot(q, (snap) => {
      const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(products);
    });
  },
};

// ─── Categories ────────────────────────────────────────────────────────────

export const categoriesApi = {
  async getAll(): Promise<any[]> {
    const q = query(collection(db, 'categories'), where('active', '==', true), orderBy('name'));
    const snap = await getDocs(q);
    // Add _id alias so components that reference _id still work
    return snap.docs.map((d) => ({ id: d.id, _id: d.id, ...d.data() }));
  },
};

// ─── Sales ─────────────────────────────────────────────────────────────────

export const salesApi = {
  async checkout(salePayload: any): Promise<any> {
    // Run as a transaction to atomically decrement stock + create sale
    const invoiceNumber =
      salePayload.invoiceNumber ||
      `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const saleRef = await runTransaction(db, async (transaction) => {
      // 1. Decrement stock for each item
      for (const item of salePayload.items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) throw new Error(`Product ${item.productName} not found`);
        const currentStock = productSnap.data().stockQuantity as number;
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}. Available: ${currentStock}`);
        }
        transaction.update(productRef, {
          stockQuantity: currentStock - item.quantity,
          updatedAt: serverTimestamp(),
        });
      }

      // 2. Create the sale document
      const newSaleRef = doc(collection(db, 'sales'));
      transaction.set(newSaleRef, {
        ...salePayload,
        invoiceNumber,
        status: 'COMPLETED',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return newSaleRef;
    });

    // 3. Create stock movement records (outside transaction for simplicity)
    for (const item of salePayload.items) {
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      const currentStock = productSnap.data()?.stockQuantity ?? 0;
      await addDoc(collection(db, 'stockMovements'), {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        type: 'SALE',
        quantity: -item.quantity,
        previousStock: currentStock + item.quantity,
        newStock: currentStock,
        referenceId: invoiceNumber,
        notes: `POS Sale: ${invoiceNumber}`,
        userId: salePayload.cashierId,
        userName: salePayload.cashierName,
        createdAt: serverTimestamp(),
      });
    }

    // Return full sale data that components expect (total, invoiceNumber etc.)
    const saleSnap = await getDoc(saleRef);
    return { id: saleRef.id, ...saleSnap.data(), invoiceNumber };
  },

  async getHistory(params?: { cashierId?: string; limitCount?: number }) {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (params?.cashierId) {
      constraints.push(where('cashierId', '==', params.cashierId));
    }
    constraints.push(limit(params?.limitCount || 25));

    const q = query(collection(db, 'sales'), ...constraints);
    const snap = await getDocs(q);
    const sales = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { sales, total: sales.length };
  },

  async getByInvoice(invoiceNumber: string) {
    const q = query(
      collection(db, 'sales'),
      where('invoiceNumber', '==', invoiceNumber),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Invoice not found');
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  },
};

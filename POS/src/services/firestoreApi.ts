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
    // 1. Find user document by username in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Invalid username or password');

    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    if (!userData.active) throw new Error('Account is inactive. Contact admin.');

    // 2. Verify password — try Firebase Auth first, then stored password fallback
    let token = `pos-session-${userDoc.id}-${Date.now()}`;
    let authSuccess = false;

    try {
      const email = userData.email as string;
      const credential = await signInWithEmailAndPassword(auth, email, password);
      token = await credential.user.getIdToken();
      authSuccess = true;
    } catch (authErr: any) {
      // Firebase Auth failed — check if it's wrong password or just Auth not configured
      const code = authErr?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
        throw new Error('Invalid username or password');
      }
      // For other errors (auth/configuration-not-found, network, etc.) fall through to stored password check
    }

    // If Firebase Auth didn't succeed, verify against stored password
    if (!authSuccess) {
      const storedPassword = userData.password as string | undefined;
      if (!storedPassword || storedPassword !== password) {
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
    let snap;
    try {
      if (params?.status && params.status !== 'ALL') {
        const q = query(collection(db, 'products'), where('status', '==', params.status));
        snap = await getDocs(q);
      } else {
        const q = query(collection(db, 'products'));
        snap = await getDocs(q);
      }
    } catch {
      snap = await getDocs(collection(db, 'products'));
    }

    let products = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    // Status filter
    if (params?.status && params.status !== 'ALL') {
      products = products.filter((p) => p.status === params.status);
    } else if (!params?.status) {
      products = products.filter((p) => p.status === 'Active' || !p.status);
    }

    // Category filter
    if (params?.categoryId && params.categoryId !== 'ALL') {
      products = products.filter(
        (p) => p.categoryId === params.categoryId || p.categoryName === params.categoryId
      );
    }

    // Client-side search filter (Firestore doesn't support full-text search)
    if (params?.search) {
      const term = params.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term) ||
          p.productCode?.toLowerCase().includes(term)
      );
    }

    // Client-side sort by name (no composite index required)
    products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

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
    const q = query(collection(db, 'products'));
    return onSnapshot(q, (snap) => {
      const products = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p: any) => p.status === 'Active' || !p.status)
        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
      callback(products);
    });
  },
};

// ─── Categories ────────────────────────────────────────────────────────────

export const categoriesApi = {
  async getAll(): Promise<any[]> {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const cats = snap.docs.map((d) => ({ id: d.id, _id: d.id, ...d.data() }));
      return cats
        .filter((c: any) => c.active !== false)
        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
    } catch {
      return [];
    }
  },
};

// ─── Sales ─────────────────────────────────────────────────────────────────

export const salesApi = {
  async checkout(salePayload: any): Promise<any> {
    const invoiceNumber =
      salePayload.invoiceNumber ||
      `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { newSaleRef, productUpdates } = await runTransaction(db, async (transaction) => {
      // ── PHASE 1: READ ALL PRODUCTS FIRST (No writes allowed yet) ──
      const updates: { ref: any; currentStock: number; newStock: number; item: any }[] = [];

      for (const item of salePayload.items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) {
          throw new Error(`Product "${item.productName || item.sku}" not found in inventory.`);
        }
        const currentStock = (productSnap.data()?.stockQuantity as number) ?? 0;
        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.productName}". Available: ${currentStock}, Requested: ${item.quantity}`
          );
        }
        updates.push({
          ref: productRef,
          currentStock,
          newStock: currentStock - item.quantity,
          item,
        });
      }

      // ── PHASE 2: WRITE ALL UPDATES (All reads completed) ─────────
      for (const { ref, newStock } of updates) {
        transaction.update(ref, {
          stockQuantity: newStock,
          updatedAt: serverTimestamp(),
        });
      }

      // Create the sale document
      const createdSaleRef = doc(collection(db, 'sales'));
      transaction.set(createdSaleRef, {
        ...salePayload,
        invoiceNumber,
        status: 'COMPLETED',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { newSaleRef: createdSaleRef, productUpdates: updates };
    });

    // ── PHASE 3: Create stock movement records ──────────────────────
    for (const { currentStock, newStock, item } of productUpdates) {
      try {
        await addDoc(collection(db, 'stockMovements'), {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          type: 'SALE',
          quantity: -item.quantity,
          previousStock: currentStock,
          newStock,
          referenceId: invoiceNumber,
          notes: `POS Sale: ${invoiceNumber}`,
          userId: salePayload.cashierId || 'cashier',
          userName: salePayload.cashierName || 'Cashier',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Failed to record stock movement:', err);
      }
    }

    return {
      id: newSaleRef.id,
      _id: newSaleRef.id,
      ...salePayload,
      invoiceNumber,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };
  },

  async getHistory(params?: { cashierId?: string; limitCount?: number }) {
    try {
      const q = query(collection(db, 'sales'), limit(100));
      const snap = await getDocs(q);
      let sales = snap.docs.map((d) => ({ id: d.id, _id: d.id, ...d.data() })) as any[];

      if (params?.cashierId) {
        sales = sales.filter((s) => s.cashierId === params.cashierId);
      }

      // In-memory sort by createdAt desc
      sales.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      const limited = sales.slice(0, params?.limitCount || 25);
      return { sales: limited, total: sales.length };
    } catch {
      return { sales: [], total: 0 };
    }
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
    return { id: d.id, _id: d.id, ...d.data() };
  },
};

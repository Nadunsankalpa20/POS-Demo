import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  QueryConstraint,
  startAfter,
  getCountFromServer,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth';
import { db, auth } from './firebase';

// ─── Helpers ───────────────────────────────────────────────────────────────

const tsToDate = (ts: any): Date => (ts?.toDate ? ts.toDate() : new Date(ts));

// ─── Auth ──────────────────────────────────────────────────────────────────

export const firebaseAuth = {
  async login(username: string, password: string) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Invalid username or password');

    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    if (!userData.active) throw new Error('Account is inactive. Contact admin.');

    // Try Firebase Auth first, then fall back to stored password
    let token = `pos-session-${userDoc.id}-${Date.now()}`;
    let authSuccess = false;

    try {
      const credential = await signInWithEmailAndPassword(auth, userData.email, password);
      token = await credential.user.getIdToken();
      authSuccess = true;
    } catch (authErr: any) {
      const code = authErr?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
        throw new Error('Invalid username or password');
      }
      // For auth/configuration-not-found or other infra errors, fall through
    }

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

// ─── Dashboard ─────────────────────────────────────────────────────────────

export const dashboardApi = {
  async getMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = Timestamp.fromDate(today);

    // Today's sales
    const salesQ = query(
      collection(db, 'sales'),
      where('status', '==', 'COMPLETED'),
      where('createdAt', '>=', todayTs)
    );
    const salesSnap = await getDocs(salesQ);
    const todaySales = salesSnap.docs.map((d) => d.data());
    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);

    // Total products
    const productsSnap = await getCountFromServer(collection(db, 'products'));
    const totalProducts = productsSnap.data().count;

    // Low stock
    const lowStockQ = query(collection(db, 'products'), where('status', '==', 'Active'));
    const allProductsSnap = await getDocs(lowStockQ);
    const lowStockCount = allProductsSnap.docs.filter((d) => {
      const data = d.data();
      return data.stockQuantity <= data.minimumStock;
    }).length;

    // Total users
    const usersSnap = await getCountFromServer(collection(db, 'users'));

    return {
      todayRevenue,
      todayTransactions: todaySales.length,
      totalProducts,
      lowStockCount,
      totalUsers: usersSnap.data().count,
    };
  },

  /** Subscribe to live sales feed for dashboard */
  subscribeToRecentSales(callback: (sales: any[]) => void) {
    const q = query(
      collection(db, 'sales'),
      where('status', '==', 'COMPLETED'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  },

  /** Subscribe to low-stock products for live alerts */
  subscribeToLowStockProducts(callback: (products: any[]) => void) {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'Active'),
      orderBy('stockQuantity')
    );
    return onSnapshot(q, (snap) => {
      const products = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p: any) => p.stockQuantity <= p.minimumStock);
      callback(products);
    });
  },
};

// ─── Products ──────────────────────────────────────────────────────────────

export const productsApi = {
  async getAll(params?: {
    search?: string;
    categoryId?: string;
    status?: string;
    lowStock?: boolean;
    page?: number;
    limitCount?: number;
  }) {
    let snap;
    try {
      if (params?.status && params.status !== 'ALL') {
        const q = query(collection(db, 'products'), where('status', '==', params.status));
        snap = await getDocs(q);
      } else {
        snap = await getDocs(collection(db, 'products'));
      }
    } catch {
      snap = await getDocs(collection(db, 'products'));
    }

    let products = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    if (params?.status && params.status !== 'ALL') {
      products = products.filter((p) => p.status === params.status);
    }
    if (params?.categoryId && params.categoryId !== 'ALL') {
      products = products.filter(
        (p) => p.categoryId === params.categoryId || p.categoryName === params.categoryId
      );
    }

    products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (params?.search) {
      const term = params.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term)
      );
    }

    if (params?.lowStock) {
      products = products.filter((p) => p.stockQuantity <= p.minimumStock);
    }

    const total = products.length;
    const pageSize = params?.limitCount || 50;
    const page = params?.page || 1;
    const paginated = products.slice((page - 1) * pageSize, page * pageSize);

    return { products: paginated, total, page, totalPages: Math.ceil(total / pageSize) };
  },

  async create(data: any) {
    const ref = await addDoc(collection(db, 'products'), {
      ...data,
      status: data.status || 'Active',
      stockQuantity: data.stockQuantity || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, ...data };
  },

  async update(id: string, data: any) {
    const ref = doc(db, 'products', id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
    return { id, ...data };
  },

  async softDelete(id: string) {
    await updateDoc(doc(db, 'products', id), {
      status: 'Inactive',
      updatedAt: serverTimestamp(),
    });
  },

  subscribeToAll(callback: (products: any[]) => void) {
    const q = query(collection(db, 'products'), orderBy('name'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  },
};

// ─── Stock ─────────────────────────────────────────────────────────────────

export const stockApi = {
  async stockIn(payload: { productId: string; quantity: number; notes?: string; supplierId?: string; userId: string; userName: string }) {
    await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', payload.productId);
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) throw new Error('Product not found');
      const data = productSnap.data();
      const previousStock = data.stockQuantity as number;
      const newStock = previousStock + payload.quantity;

      transaction.update(productRef, {
        stockQuantity: newStock,
        status: 'Active',
        updatedAt: serverTimestamp(),
      });

      const movementRef = doc(collection(db, 'stockMovements'));
      transaction.set(movementRef, {
        productId: payload.productId,
        productName: data.name,
        sku: data.sku,
        type: 'STOCK_IN',
        quantity: payload.quantity,
        previousStock,
        newStock,
        referenceId: `STOCK-IN-${Date.now()}`,
        notes: payload.notes || '',
        userId: payload.userId,
        userName: payload.userName,
        createdAt: serverTimestamp(),
      });
    });
  },

  async stockOut(payload: { productId: string; quantity: number; notes?: string; reason?: string; userId: string; userName: string }) {
    await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', payload.productId);
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) throw new Error('Product not found');
      const data = productSnap.data();
      const previousStock = data.stockQuantity as number;
      if (previousStock < payload.quantity) {
        throw new Error(`Insufficient stock. Available: ${previousStock}`);
      }
      const newStock = previousStock - payload.quantity;

      transaction.update(productRef, {
        stockQuantity: newStock,
        updatedAt: serverTimestamp(),
      });

      const movementRef = doc(collection(db, 'stockMovements'));
      transaction.set(movementRef, {
        productId: payload.productId,
        productName: data.name,
        sku: data.sku,
        type: 'STOCK_OUT',
        quantity: -payload.quantity,
        previousStock,
        newStock,
        referenceId: `STOCK-OUT-${Date.now()}`,
        notes: payload.notes || payload.reason || '',
        userId: payload.userId,
        userName: payload.userName,
        createdAt: serverTimestamp(),
      });
    });
  },

  async voidSale(saleId: string, reason: string, userId: string, userName: string) {
    await runTransaction(db, async (transaction) => {
      // ── PHASE 1: READS FIRST ────────────────────────────────
      const saleRef = doc(db, 'sales', saleId);
      const saleSnap = await transaction.get(saleRef);
      if (!saleSnap.exists()) throw new Error('Sale not found');
      const sale = saleSnap.data();
      if (sale.status === 'VOIDED') throw new Error('Sale is already voided');

      // Read all products before making any writes
      const productRestorations: { ref: any; newStock: number; prev: number; item: any }[] = [];
      for (const item of sale.items || []) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);
        if (productSnap.exists()) {
          const prev = (productSnap.data()?.stockQuantity as number) ?? 0;
          productRestorations.push({
            ref: productRef,
            newStock: prev + item.quantity,
            prev,
            item,
          });
        }
      }

      // ── PHASE 2: WRITES SECOND ──────────────────────────────
      transaction.update(saleRef, {
        status: 'VOIDED',
        voidReason: reason,
        voidedAt: serverTimestamp(),
        voidedBy: userId,
        updatedAt: serverTimestamp(),
      });

      for (const { ref, newStock, prev, item } of productRestorations) {
        transaction.update(ref, { stockQuantity: newStock, updatedAt: serverTimestamp() });

        const movRef = doc(collection(db, 'stockMovements'));
        transaction.set(movRef, {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          type: 'VOID',
          quantity: item.quantity,
          previousStock: prev,
          newStock,
          referenceId: sale.invoiceNumber,
          notes: `Void: ${reason}`,
          userId,
          userName,
          createdAt: serverTimestamp(),
        });
      }
    });
  },

  async getMovements(params?: { productId?: string; type?: string; limitCount?: number }) {
    try {
      const q = query(collection(db, 'stockMovements'), limit(150));
      const snap = await getDocs(q);
      let movements = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

      if (params?.productId) {
        movements = movements.filter((m) => m.productId === params.productId);
      }
      if (params?.type && params.type !== 'ALL') {
        movements = movements.filter((m) => m.type === params.type);
      }

      movements.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });

      return { movements: movements.slice(0, params?.limitCount || 50) };
    } catch {
      return { movements: [] };
    }
  },
};

// ─── Sales ─────────────────────────────────────────────────────────────────

export const salesApi = {
  async getAll(params?: {
    page?: number;
    limitCount?: number;
    status?: string;
    invoiceNumber?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (params?.status) constraints.unshift(where('status', '==', params.status));

    if (params?.startDate) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(new Date(params.startDate))));
    }
    if (params?.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59);
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(end)));
    }

    const pageSize = params?.limitCount || 20;
    constraints.push(limit(pageSize));

    const q = query(collection(db, 'sales'), ...constraints);
    const snap = await getDocs(q);
    let sales = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    // Client-side invoice filter
    if (params?.invoiceNumber) {
      const term = params.invoiceNumber.toLowerCase();
      sales = sales.filter((s) => s.invoiceNumber?.toLowerCase().includes(term));
    }

    return { sales, total: sales.length };
  },

  subscribeToSales(callback: (sales: any[]) => void) {
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  },
};

// ─── Reports ───────────────────────────────────────────────────────────────

export const reportsApi = {
  async getSalesReport(filter?: { startDate?: string; endDate?: string; paymentMethod?: string }) {
    const constraints: QueryConstraint[] = [where('status', '==', 'COMPLETED'), orderBy('createdAt', 'desc')];

    if (filter?.startDate) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(new Date(filter.startDate))));
    }
    if (filter?.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59);
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(end)));
    }
    if (filter?.paymentMethod) {
      constraints.push(where('paymentMethod', '==', filter.paymentMethod));
    }

    const q = query(collection(db, 'sales'), ...constraints);
    const snap = await getDocs(q);
    const sales = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalTransactions = sales.length;
    const totalDiscount = sales.reduce((sum, s) => sum + (s.discount || 0), 0);
    const totalTax = sales.reduce((sum, s) => sum + (s.tax || 0), 0);

    return { sales, totalRevenue, totalTransactions, totalDiscount, totalTax };
  },

  async getProductPerformance(filter?: { startDate?: string; endDate?: string }) {
    const constraints: QueryConstraint[] = [where('status', '==', 'COMPLETED')];
    if (filter?.startDate) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(new Date(filter.startDate))));
    }
    if (filter?.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59);
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(end)));
    }

    const q = query(collection(db, 'sales'), ...constraints);
    const snap = await getDocs(q);

    const productMap: Record<string, { name: string; sku: string; quantitySold: number; revenue: number }> = {};
    for (const saleDoc of snap.docs) {
      const sale = saleDoc.data();
      for (const item of sale.items || []) {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.productName, sku: item.sku, quantitySold: 0, revenue: 0 };
        }
        productMap[item.productId].quantitySold += item.quantity;
        productMap[item.productId].revenue += item.lineTotal || 0;
      }
    }

    return Object.entries(productMap)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  },

  async getStockReport() {
    const q = query(collection(db, 'products'), orderBy('stockQuantity'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};

// ─── Categories ────────────────────────────────────────────────────────────

export const categoriesApi = {
  async getAll() {
    const snap = await getDocs(collection(db, 'categories'));
    const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return cats.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  },

  async create(payload: any) {
    const ref = await addDoc(collection(db, 'categories'), {
      ...payload,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, ...payload };
  },
};

// ─── Suppliers ─────────────────────────────────────────────────────────────

export const suppliersApi = {
  async getAll() {
    const snap = await getDocs(collection(db, 'suppliers'));
    const sups = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return sups.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  },

  async create(payload: any) {
    const ref = await addDoc(collection(db, 'suppliers'), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, ...payload };
  },
};

// ─── Users ─────────────────────────────────────────────────────────────────

export const usersApi = {
  async getAll() {
    const q = query(collection(db, 'users'), orderBy('fullName'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const { passwordHash, ...safe } = d.data() as any;
      return { id: d.id, ...safe };
    });
  },

  async create(payload: { username: string; password: string; fullName: string; role: string }) {
    // Create Firebase Auth user
    const email = `${payload.username}@pos.system`;
    const credential = await createUserWithEmailAndPassword(auth, email, payload.password);

    // Store user profile in Firestore
    const userRef = doc(db, 'users', credential.user.uid);
    const userData = {
      username: payload.username.toLowerCase(),
      fullName: payload.fullName,
      role: payload.role,
      email,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const { updateDoc: updateDocFn, ..._ } = await import('firebase/firestore');
    await import('firebase/firestore').then(({ setDoc }) => setDoc(userRef, userData));

    return { id: credential.user.uid, ...userData };
  },

  async update(id: string, payload: any) {
    const { password, ...rest } = payload;
    await updateDoc(doc(db, 'users', id), { ...rest, updatedAt: serverTimestamp() });
    return { id, ...rest };
  },
};

// ─── Audit Logs ────────────────────────────────────────────────────────────

export const auditApi = {
  async log(payload: { module: string; action: string; description: string; userId: string; userName: string; meta?: any }) {
    await addDoc(collection(db, 'auditLogs'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  },

  async getAll(params?: { module?: string; action?: string; limitCount?: number }) {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(params?.limitCount || 100)];
    if (params?.module) constraints.unshift(where('module', '==', params.module));
    if (params?.action) constraints.unshift(where('action', '==', params.action));

    const q = query(collection(db, 'auditLogs'), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};

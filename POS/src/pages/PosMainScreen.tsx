import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { ProductGrid } from '../components/ProductGrid';
import { Cart } from '../components/Cart';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { SalesHistoryDrawer } from '../components/SalesHistoryDrawer';
import { HeldBillsDrawer } from '../components/HeldBillsDrawer';
import { ProductItem, useCartStore } from '../store/cartStore';
import { api } from '../services/api';
import { getPosSocket } from '../services/socket';

interface PosMainScreenProps {
  onOpenMenu?: () => void;
}

export const PosMainScreen: React.FC<PosMainScreenProps> = ({ onOpenMenu }) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Modals & Drawers state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isHeldBillsOpen, setIsHeldBillsOpen] = useState<boolean>(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<any | null>(null);

  const [liveSyncToast, setLiveSyncToast] = useState<string | null>(null);

  const { items, addItem } = useCartStore();

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data.products || []);
    } catch (e) {
      console.error('Failed to load products in POS:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();

    // Online / Offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Socket.IO Real-time Stock Synchronizer
    const socket = getPosSocket();

    socket.on('STOCK_UPDATED', (payload: any) => {
      console.log('[POS] Received real-time STOCK_UPDATED event:', payload);
      setProducts((prev) =>
        prev.map((p) =>
          p._id === payload.productId
            ? { ...p, stockQuantity: payload.newStock }
            : p
        )
      );
      setLiveSyncToast('Live Stock Sync: Instant Inventory Updated');
      setTimeout(() => setLiveSyncToast(null), 3500);
    });

    socket.on('PRODUCT_CREATED', () => {
      loadProducts();
      setLiveSyncToast('New Product Added in BackOffice');
      setTimeout(() => setLiveSyncToast(null), 3500);
    });
    socket.on('PRODUCT_UPDATED', () => {
      loadProducts();
      setLiveSyncToast('Live Product Details Refreshed');
      setTimeout(() => setLiveSyncToast(null), 3500);
    });
    socket.on('PRODUCT_DELETED', () => loadProducts());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.off('STOCK_UPDATED');
      socket.off('PRODUCT_CREATED');
      socket.off('PRODUCT_UPDATED');
      socket.off('PRODUCT_DELETED');
    };
  }, [loadProducts]);

  // Handle Barcode Scanned
  const handleScanBarcode = (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      addItem(product, 1);
    }
  };

  // Keyboard Shortcuts (F4 = Checkout, F8 = History)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4' && items.length > 0 && !isCheckoutOpen) {
        e.preventDefault();
        setIsCheckoutOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setIsHistoryOpen(true);
      } else if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
        setIsHistoryOpen(false);
        setIsHeldBillsOpen(false);
        setActiveReceiptSale(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, isCheckoutOpen]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-100 via-emerald-50/50 to-teal-50/40 dark:from-[#0b0f19] dark:via-[#0c1424] dark:to-[#070c17] overflow-hidden relative font-sans">
      {/* Dynamic Ambient Green Energy Orbs for live feeling */}
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-emerald-500/20 dark:bg-emerald-500/15 rounded-full blur-[110px] pointer-events-none animate-ambient-green" />
      <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] bg-teal-500/20 dark:bg-teal-500/12 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
      <div className="absolute -bottom-24 left-1/3 w-[500px] h-[500px] bg-emerald-400/15 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none animate-ambient-green" />

      {/* Live Green Telemetry Notification Pill */}
      {liveSyncToast && (
        <div className="fixed bottom-6 left-6 z-40 animate-slide-up pointer-events-none">
          <div className="px-4 py-2 rounded-2xl bg-emerald-600/90 dark:bg-emerald-500/90 text-white text-xs font-black tracking-wide shadow-2xl shadow-emerald-500/60 border border-emerald-300/50 backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping" />
            <span>⚡ {liveSyncToast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHeldBills={() => setIsHeldBillsOpen(true)}
        onOpenMenu={onOpenMenu}
        isOnline={isOnline}
      />

      {/* Main Workspace: Left = Catalog / Products, Right = Active Cart */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        <ProductGrid
          products={products}
          isLoading={isLoading}
          onRefresh={loadProducts}
          onScanBarcode={handleScanBarcode}
        />

        <Cart onOpenCheckout={() => setIsCheckoutOpen(true)} />
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(sale) => {
          setIsCheckoutOpen(false);
          setActiveReceiptSale(sale);
        }}
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={!!activeReceiptSale}
        sale={activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
      />

      {/* Sales History Drawer */}
      <SalesHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSale={(sale) => setActiveReceiptSale(sale)}
      />

      {/* Held Bills Drawer */}
      <HeldBillsDrawer
        isOpen={isHeldBillsOpen}
        onClose={() => setIsHeldBillsOpen(false)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { ProductItem, useCartStore } from '../store/cartStore';
import { Plus, Check, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: ProductItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.minimumStock;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    const result = addItem(product, 1);
    if (!result.success && result.message) {
      setErrorToast(result.message);
      setTimeout(() => setErrorToast(null), 2500);
      return;
    }

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 550);
  };

  return (
    <div
      onClick={handleAdd}
      className={`group relative flex flex-col justify-between rounded-2xl p-3.5 transition-all duration-300 cursor-pointer ${
        isOutOfStock
          ? 'ios-glass-tile opacity-50 cursor-not-allowed border-dashed border-gray-700'
          : `ios-glass-tile neon-glow-card ${isAdded ? 'ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/30 -translate-y-1' : ''}`
      }`}
    >
      {/* Floating "+1 ADDED" Live Green Particle */}
      {isAdded && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-float-particle">
          <div className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-black tracking-wider shadow-xl shadow-emerald-500/60 border border-emerald-200 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>+1 ADDED</span>
          </div>
        </div>
      )}

      {/* Toast Alert on Card if stock exceeded */}
      {errorToast && (
        <div className="absolute inset-x-2 top-2 z-20 bg-rose-600 text-white text-[11px] font-bold p-2 rounded-xl text-center shadow-lg animate-bounce">
          {errorToast}
        </div>
      )}

      {/* Top Image Container with 3D Depth */}
      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3 flex items-center justify-center">
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 ${
            isOutOfStock ? 'grayscale contrast-75' : ''
          }`}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
          }}
        />

        {/* Category Badge */}
        {product.categoryName && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-sm">
            {product.categoryName}
          </span>
        )}

        {/* Stock Badge with Live Green Radar Pulse */}
        <div className="absolute top-2 right-2">
          {isOutOfStock ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500 text-white shadow-sm">
              <XCircle className="w-3 h-3" /> OUT
            </span>
          ) : isLowStock ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-sm">
              <AlertTriangle className="w-3 h-3" /> {product.stockQuantity} left
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600/90 text-white shadow-md shadow-emerald-600/30 backdrop-blur-sm border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-green-pulse" />
              <span>{product.stockQuantity} in stock</span>
            </span>
          )}
        </div>

        {/* Discount Tag */}
        {product.discount > 0 && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-500 text-white shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {product.discount}% OFF
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-emerald-500 transition-colors">
            {product.name}
          </h3>
          <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <span>SKU: {product.sku}</span>
            <span>•</span>
            <span>{product.unit}</span>
          </div>
        </div>

        {/* Price & Action Button */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 font-semibold uppercase">Price</div>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              Rs. {product.sellingPrice.toFixed(2)}
            </div>
          </div>

          <button
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 font-bold active:scale-90 cursor-pointer ${
              isOutOfStock
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : isAdded
                ? 'ios-glass-button scale-110 shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-300'
                : 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:bg-emerald-500/20 dark:hover:bg-emerald-500 dark:text-emerald-400 dark:hover:text-white shadow-sm hover:shadow-emerald-500/40 hover:scale-105'
            }`}
          >
            {isAdded ? <Check className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Printer,
  Check,
  Copy,
  ArrowRight,
  Store,
  Sparkles,
  Heart,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  X,
  Award,
  ShieldCheck,
  ShoppingBag,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import receiptBg from '../assets/receipt-bg.jpg';
import matharaLogo from '../assets/mathara-logo.png';
import { soundService } from '../services/audio';
import { CustomerLoyaltyModal } from './CustomerLoyaltyModal';

interface ReceiptModalProps {
  isOpen: boolean;
  sale: any;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  sale,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);

  // Auto-show Customer Loyalty prompt right after billing/receipt opens
  useEffect(() => {
    if (isOpen) {
      setShowLoyalty(true);
      soundService.playCheckoutSuccess();

      // Multi-stage confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6'],
        });

        const timer1 = setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#10b981', '#34d399', '#06b6d4'],
          });
        }, 250);

        const timer2 = setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#f59e0b', '#10b981', '#ec4899'],
          });
        }, 400);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      } catch (e) {
        // Safe confetti fallback
      }
    } else {
      setShowLoyalty(false);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Escape, Enter, or Space to start next transaction, Ctrl+P to print)
  // Ignored while the Customer Loyalty modal is displayed so cashier can type freely
  useEffect(() => {
    if (!isOpen || showLoyalty) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        // Prevent accidental space scroll
        if (e.key === ' ') e.preventDefault();
        onClose();
      } else if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showLoyalty, onClose]);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
========================================
       මාතර ස්ටෝරස් (MATHARA STORES)
14 පොදු වෙලද සංකීර්ණය, දුම් රියපොල මාර්ගය
               වාද්දුව
         Tel: 071 073 7822
========================================
Invoice:  ${sale.invoiceNumber}
Date:     ${new Date(sale.createdAt || Date.now()).toLocaleString()}
Cashier:  ${sale.cashierName}
Customer: ${sale.customerName || 'Walk-in Customer'}
----------------------------------------
${(sale.items || [])
  .map(
    (i: any) =>
      `${i.productName.padEnd(20).slice(0, 20)} ${String(i.quantity).padStart(2)} x Rs.${Number(i.unitPrice).toFixed(0)}  Rs.${Number(i.lineTotal).toFixed(2)}`
  )
  .join('\n')}
----------------------------------------
Subtotal:                Rs. ${Number(sale.subtotal).toFixed(2)}
Discount:               -Rs. ${Number(sale.discount).toFixed(2)}
Tax:                    +Rs. ${Number(sale.tax).toFixed(2)}
----------------------------------------
TOTAL:                   Rs. ${Number(sale.total).toFixed(2)}
----------------------------------------
Payment: ${sale.paymentMethod}
Tendered: Rs. ${Number(sale.paymentAmount || sale.total).toFixed(2)}
Change:   Rs. ${Number(sale.change || 0).toFixed(2)}
========================================
      THANK YOU FOR SHOPPING WITH US!
             PLEASE COME AGAIN!
========================================
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPaymentIcon = () => {
    switch (sale.paymentMethod) {
      case 'CASH':
        return <Banknote className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
      case 'CARD':
        return <CreditCard className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
      default:
        return <Smartphone className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
    }
  };

  // Estimated loyalty points earned (1 point per Rs. 50)
  const loyaltyPointsEarned = Math.floor(Number(sale.total) / 50);

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-2xl flex flex-col xl:flex-row overflow-hidden select-none font-sans text-slate-900 dark:text-white animate-fade-in">
      
      {/* =========================================================================
          LEFT SIDE: THE BILL / RECEIPT (ACTUAL SCREEN SIZE & HEIGHT)
          ========================================================================= */}
      <section className="w-full xl:w-[52%] h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-white/70 dark:bg-slate-900/60 border-r border-slate-200 dark:border-white/10 overflow-hidden relative">
        {/* Subtle background ambient glow */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Bill Container: Expansive, clean, printable actual-size ticket */}
        <div className="flex-1 flex flex-col bg-white text-slate-900 rounded-3xl shadow-2xl shadow-slate-300/60 dark:shadow-black/60 overflow-hidden border border-slate-200 dark:border-slate-700">
          
          {/* Top Decorative Header Strip with print action */}
          <div className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between no-print">
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
              <span>Official Tax Invoice & Checkout Receipt</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Print thermal receipt (80mm)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Printable Ticket Content (takes full remaining height, item list scrolls if long) */}
          <div id="printable-receipt" className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto font-mono text-xs text-slate-800 bg-white">
            
            {/* 1. Store Header */}
            <div>
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                {/* Mathara Stores Official Logo */}
                <div className="flex justify-center mb-3">
                  <img
                    src={matharaLogo}
                    alt="Mathara Stores - මාතර ස්ටෝරස්"
                    className="h-24 w-auto object-contain"
                    style={{ maxWidth: '200px' }}
                  />
                </div>
                <h2 className="text-base font-black tracking-tight text-slate-900">මාතර ස්ටෝරස්</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Mathara Stores</p>
                <p className="text-[11px] text-slate-600 font-medium mt-1">
                  14 පොදු වෙලද සංකීර්ණය, දුම් රියපොල මාර්ගය, වාද්දුව
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tel: <strong className="text-emerald-700">071 073 7822</strong>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Tax Reg / VAT ID: 1049284920</p>
              </div>

              {/* 2. Invoice Meta Details Grid */}
              <div className="py-3 border-b border-dashed border-slate-300 grid grid-cols-2 gap-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400">Invoice No: </span>
                  <strong className="text-slate-900 font-extrabold">{sale.invoiceNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Date: </span>
                  <span className="font-medium text-slate-700">{new Date(sale.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Cashier: </span>
                  <span className="font-semibold text-slate-800">{sale.cashierName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Customer: </span>
                  <span className="font-bold text-emerald-700">{sale.customerName || 'Walk-in Customer'}</span>
                </div>
              </div>

              {/* 3. Items Table Header */}
              <div className="pt-3 pb-2 flex justify-between text-[11px] text-slate-400 uppercase font-extrabold border-b border-slate-200">
                <span className="w-1/2">Item Description</span>
                <span className="w-1/6 text-right">Qty</span>
                <span className="w-1/6 text-right">Price</span>
                <span className="w-1/6 text-right">Total</span>
              </div>

              {/* 4. Item Rows (Scrollable for multi-item baskets) */}
              <div className="py-2 space-y-2.5 max-h-[36vh] xl:max-h-[38vh] overflow-y-auto pr-1">
                {(sale.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <div className="w-1/2 pr-2">
                      <div className="font-bold text-slate-900 text-sm">{item.productName}</div>
                      <div className="text-[10px] text-slate-400 font-sans">SKU: {item.sku || 'N/A'}</div>
                    </div>
                    <div className="w-1/6 text-right font-bold text-slate-700">
                      {item.quantity}
                    </div>
                    <div className="w-1/6 text-right text-slate-500">
                      Rs. {Number(item.unitPrice).toFixed(2)}
                    </div>
                    <div className="w-1/6 text-right font-black text-slate-900">
                      Rs. {Number(item.lineTotal).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Financial Summary & Grand Total */}
            <div className="pt-3 border-t-2 border-slate-900 mt-2 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold">Rs. {Number(sale.subtotal).toFixed(2)}</span>
              </div>

              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-xs text-rose-600 font-bold">
                  <span>Special Discount Applied:</span>
                  <span>-Rs. {Number(sale.discount).toFixed(2)}</span>
                </div>
              )}

              {Number(sale.tax) > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Sales Tax / VAT:</span>
                  <span>+Rs. {Number(sale.tax).toFixed(2)}</span>
                </div>
              )}

              {/* GRAND TOTAL ROW */}
              <div className="py-2.5 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex justify-between items-center text-slate-900 my-1">
                <span className="text-sm font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">Grand Total Amount:</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  Rs. {Number(sale.total).toFixed(2)}
                </span>
              </div>

              {/* Tender & Change Row */}
              <div className="pt-1 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Payment Tender: <strong className="text-slate-900 font-extrabold uppercase">{sale.paymentMethod}</strong></span>
                  <span>Tendered: <strong>Rs. {Number(sale.paymentAmount || sale.total).toFixed(2)}</strong></span>
                </div>
                {sale.paymentMethod === 'CASH' && (
                  <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    <span>Change Returned:</span>
                    <span>Rs. {Number(sale.change || 0).toFixed(2)}</span>
                  </div>
                )}
                {sale.paymentReference && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Ref ID: {sale.paymentReference}
                  </div>
                )}
              </div>

              {/* Barcode & Friendly Farewell Note */}
              <div className="pt-3 text-center space-y-1 border-t border-dashed border-slate-300 mt-2">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-8 w-52 bg-repeat-x flex items-center justify-center font-mono tracking-widest text-[10px] text-slate-400 select-none">
                    ||| | |||| | || ||| || ||| | |||| | ||
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{sale.invoiceNumber}</div>
                </div>
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 tracking-wide uppercase">
                  ★ THANK YOU FOR SHOPPING WITH US! ★
                </p>
                <p className="text-[10px] text-slate-400">
                  Goods in original condition returnable within 7 days with this bill.
                </p>
              </div>
            </div>

          </div>

          {/* Bottom ticket serrated edge decoration */}
          <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 border-t border-dashed border-slate-400" />
        </div>
      </section>

      {/* =========================================================================
          RIGHT SIDE: DEDICATED IMAGE + ANIMATED GREETING + QUICK CONTROLS
          ========================================================================= */}
      <section className="w-full xl:w-[48%] h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-white/95 via-emerald-50/40 to-teal-50/30 dark:from-slate-900/90 dark:via-slate-950/95 dark:to-emerald-950/40 relative overflow-y-auto text-slate-900 dark:text-white">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full ios-glass-pill text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Transaction Settled Successfully</span>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl ios-glass-pill hover:bg-slate-200/60 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Close / Exit (Esc or Space)"
          >
            <span>Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. DEDICATED STORE CELEBRATION SHOWCASE IMAGE */}
        <div className="relative w-full h-48 sm:h-56 lg:h-64 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/20 shadow-xl group my-2">
          <img
            src={receiptBg || '/receipt-bg.jpg'}
            alt="Customer Gratitude Checkout"
            className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-700 filter brightness-100 dark:brightness-90 contrast-105"
          />
          {/* Subtle gradient overlay to enhance badge readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

          {/* Floating Badges on Image */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full ios-glass-pill text-[11px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5 shadow-lg">
              <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Customer Satisfaction Guarantee</span>
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="px-3 py-1 rounded-xl ios-glass-pill text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Verified Supermarket Checkout</span>
            </span>

            {loyaltyPointsEarned > 0 && (
              <span className="px-3.5 py-1 rounded-xl ios-glass-pill text-xs font-extrabold text-amber-600 dark:text-amber-300 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>+{loyaltyPointsEarned} SuperPoints</span>
              </span>
            )}
          </div>
        </div>

        {/* 2. HIGH-IMPACT ANIMATED GREETING SECTION */}
        <div className="space-y-3 text-center my-2">
          {/* Pulsing checkmark badge with glow rings */}
          <div className="inline-flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 animate-ping absolute inset-0" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/40 border border-white/40 animate-pulse-glow">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Breathtaking Animated Gratitude Headline (Vibrant in Light & Dark Mode) */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-300 dark:via-teal-200 dark:to-cyan-300 bg-clip-text text-transparent">
            THANK YOU FOR SHOPPING WITH US!
          </h1>

          {/* Subtitle with animation */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-lg mx-auto flex items-center justify-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-bounce" />
            <span>We truly appreciate your visit and look forward to seeing you again!</span>
          </p>

          {/* Loyalty and Member Notice Tile */}
          <div className="p-3.5 rounded-2xl ios-glass-tile flex items-center justify-between border-amber-400/40 bg-amber-500/10 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300">Member Rewards Program</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">Keep this invoice for warranty & member reward redemption</div>
              </div>
            </div>
            <div className="text-right font-extrabold text-amber-700 dark:text-amber-300 text-xs">
              ★ VIP LANE
            </div>
          </div>
        </div>

        {/* 3. QUICK ACTIONS & BIG "START NEXT TRANSACTION" BUTTON */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrint}
              className="py-3.5 px-4 rounded-2xl ios-glass-button text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill (80mm)</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-3.5 px-4 rounded-2xl ios-glass-tile hover:bg-slate-200/50 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
            </button>
          </div>

          {/* Customer Loyalty Button — prominent, amber-accented */}
          <button
            onClick={() => setShowLoyalty(true)}
            className="w-full py-3.5 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 text-amber-700 dark:text-amber-300 font-extrabold text-sm flex items-center justify-center gap-2.5 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:shadow-amber-400/20 active:scale-95 transition-all group"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-400/20 flex items-center justify-center group-hover:bg-amber-400/30 transition-colors">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span>Customer Loyalty</span>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </button>

          {/* Huge Primary "Start Next Transaction" Button */}
          <button
            onClick={onClose}
            className="w-full py-4 sm:py-5 rounded-3xl ios-glass-button text-white text-base sm:text-lg font-black flex items-center justify-center gap-3 cursor-pointer shadow-2xl shadow-emerald-500/40 hover:scale-[1.01] active:scale-98 transition-all group"
          >
            <span>START NEXT TRANSACTION</span>
            <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1.5 transition-transform" />
          </button>
          <div className="text-center text-[11px] text-slate-500 dark:text-slate-400">
            Press <kbd className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white font-mono text-[10px]">Esc</kbd> or <kbd className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white font-mono text-[10px]">Space</kbd> to serve next customer
          </div>
        </div>

      </section>

      {/* Customer Loyalty Modal — overlay on top of ReceiptModal */}
      <CustomerLoyaltyModal
        isOpen={showLoyalty}
        sale={sale}
        onSkip={() => setShowLoyalty(false)}
        onComplete={() => { setShowLoyalty(false); }}
      />

    </div>
  );
};

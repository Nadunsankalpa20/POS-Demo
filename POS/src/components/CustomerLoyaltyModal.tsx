import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  Sparkles,
  Heart,
  SkipForward,
  Star,
  Gift,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface CustomerLoyaltyModalProps {
  isOpen: boolean;
  sale: any;
  onSkip: () => void;
  onComplete: () => void;
}

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

const API_BASE = 'http://localhost:5000/api';

export const CustomerLoyaltyModal: React.FC<CustomerLoyaltyModalProps> = ({
  isOpen,
  sale,
  onSkip,
  onComplete,
}) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<SendStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  // Reset state every time modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPhone('');
      setStatus('idle');
      setErrorMsg('');
      setEmailSent(false);
      setSmsSent(false);
    }
  }, [isOpen]);

  // Keyboard: Escape to skip
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onSkip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onSkip]);

  if (!isOpen || !sale) return null;

  const hasInput = email.trim() !== '' || phone.trim() !== '';
  const loyaltyPoints = Math.floor(Number(sale.total) / 50);

  const handleSend = async () => {
    if (!hasInput) return;

    // Basic validation
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (phone.trim() && !/^[\d\s\-+()]{7,15}$/.test(phone.trim())) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/notifications/send-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          sale,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEmailSent(!!email.trim() && data.results?.email?.success);
        setSmsSent(!!phone.trim() && data.results?.sms?.success);
        setStatus('success');
        // Auto-close after 3s
        setTimeout(() => onComplete(), 3000);
      } else {
        setStatus('error');
        setErrorMsg(data.message || 'Failed to send notifications.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg('Network error. Please check your connection.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
        onClick={onSkip}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-white via-emerald-50/60 to-teal-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/40 rounded-3xl shadow-2xl border border-emerald-200/60 dark:border-white/10 overflow-hidden animate-scale-up">

        {/* Header gradient strip */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 pt-7 pb-10">
          {/* Decorative orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-8 w-20 h-20 bg-teal-300/20 rounded-full translate-y-1/2 blur-xl" />

          {/* Skip button top-right */}
          <button
            onClick={onSkip}
            className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Skip"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Animated icon */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-xl">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-amber-900 fill-amber-900" />
              </div>
            </div>
          </div>

          <h2 className="text-center text-xl font-black text-white tracking-tight">Customer Loyalty</h2>
          <p className="text-center text-xs text-emerald-100 mt-1 font-medium">
            Send this invoice & a thank-you message to your customer
          </p>

          {/* Points badge */}
          {loyaltyPoints > 0 && (
            <div className="flex justify-center mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/30 border border-amber-300/40 text-amber-100 text-xs font-bold">
                <Sparkles className="w-3 h-3 text-amber-300" />
                +{loyaltyPoints} SuperPoints earned on this visit!
              </span>
            </div>
          )}
        </div>

        {/* White card body that overlaps the header */}
        <div className="relative -mt-5 mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-white/10 p-5 mb-4">

          {status === 'success' ? (
            /* ── SUCCESS STATE ── */
            <div className="flex flex-col items-center py-4 gap-3 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Sent Successfully! 🎉</h3>
              <div className="space-y-1.5 w-full">
                {emailSent && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Invoice email sent to <strong>{email}</strong></span>
                  </div>
                )}
                {smsSent && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700">
                    <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">Thank-you SMS sent to <strong>{phone}</strong></span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                Closing automatically…
              </p>
            </div>
          ) : (
            /* ── INPUT STATE ── */
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Enter the customer's contact info below. Both fields are optional — fill in what you have.
              </p>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-500" />
                  Email Address
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                    placeholder="customer@example.com"
                    disabled={status === 'sending'}
                    className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-500" />
                  Phone Number
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setErrorMsg(''); }}
                  placeholder="077 123 4567"
                  disabled={status === 'sending'}
                  className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all disabled:opacity-50"
                />
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-xs text-red-600 dark:text-red-400 font-medium animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* What will be sent info */}
              {hasInput && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-white/10 space-y-1 animate-fade-in">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Will send:</p>
                  {email.trim() && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Mail className="w-3 h-3 text-emerald-500" />
                      Beautiful HTML invoice email to <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{email}</span>
                    </div>
                  )}
                  {phone.trim() && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Phone className="w-3 h-3 text-teal-500" />
                      Thank-you SMS with invoice details to <span className="text-teal-600 dark:text-teal-400 font-semibold">{phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {status !== 'success' && (
          <div className="px-4 pb-5 flex gap-3">
            {/* Skip */}
            <button
              onClick={onSkip}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!hasInput || status === 'sending'}
              className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invoice & Thank You
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

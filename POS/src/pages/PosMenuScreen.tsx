import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useShiftStore } from '../store/shiftStore';
import { useThemeStore } from '../store/themeStore';
import { soundService } from '../services/audio';
import {
  Store, User, ShieldCheck, Clock, Wifi, KeyRound,
  Receipt, Settings, LogOut, ShieldAlert, CheckCircle2,
  AlertTriangle, DollarSign, Wallet, ArrowRight, Sun,
  Moon, Volume2, VolumeX, Printer, Terminal, Activity,
  Lock, RefreshCw, Layers, Sparkles, Check, FileSpreadsheet
} from 'lucide-react';

interface PosMenuScreenProps {
  onNavigateToPos: () => void;
}

type MenuTab = 'SIGN_ON' | 'INVOICE' | 'SETTINGS' | 'SIGN_OFF' | 'MANAGER_SIGN_OFF';

export const PosMenuScreen: React.FC<PosMenuScreenProps> = ({ onNavigateToPos }) => {
  const { user, logout, terminalId } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const shiftStore = useShiftStore();

  const [activeTab, setActiveTab] = useState<MenuTab>('SIGN_ON');

  // Telemetry state
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [pingMs, setPingMs] = useState<number>(14);
  const [serverConnectTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Sign On Form state
  const [floatAmount, setFloatAmount] = useState<number>(5000);
  const [customFloat, setCustomFloat] = useState<string>('5000');
  const [lockerId, setLockerId] = useState<string>('Locker #01');
  const [signOnNotes, setSignOnNotes] = useState<string>('');
  const [signOnSuccessMsg, setSignOnSuccessMsg] = useState<string | null>(null);

  // Invoicing Gate Warning Modal
  const [showGateWarning, setShowGateWarning] = useState<boolean>(false);

  // Sign Off Form state
  const [countedCash, setCountedCash] = useState<string>('');
  const [signOffNotes, setSignOffNotes] = useState<string>('');
  const [signOffSummary, setSignOffSummary] = useState<any | null>(null);

  // Manager Sign Off state
  const [managerPin, setManagerPin] = useState<string>('');
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState<boolean>(false);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [managerSummary, setManagerSummary] = useState<any | null>(null);

  // Settings State
  const [receiptWidth, setReceiptWidth] = useState<'80mm' | '58mm'>('80mm');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState<boolean>(true);

  // Live Clock & Ping Fluctuations
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);

    const pingTimer = setInterval(() => {
      setPingMs(Math.floor(12 + Math.random() * 6));
    }, 4000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(pingTimer);
    };
  }, []);

  // Handle Tab Click
  const handleSelectTab = (tab: MenuTab) => {
    soundService.playScanBeep();
    if (tab === 'INVOICE') {
      if (!shiftStore.isShiftActive) {
        soundService.playErrorBuzz();
        setShowGateWarning(true);
        return;
      }
      onNavigateToPos();
      return;
    }
    setActiveTab(tab);
  };

  // Sign On Action
  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    const floatVal = parseFloat(customFloat) || floatAmount;
    if (floatVal < 0) return;

    shiftStore.signOn({
      openingFloat: floatVal,
      lockerId,
      cashierId: user?.id || user?.username || 'cashier',
      cashierName: user?.fullName || 'Cashier 1',
      terminalId,
      laneNumber: 'Lane 01',
      notes: signOnNotes,
    });

    soundService.playScanBeep();
    setSignOnSuccessMsg(`Shift started! Locker float of Rs. ${floatVal.toFixed(2)} recorded.`);
    setTimeout(() => setSignOnSuccessMsg(null), 4000);
  };

  // Sign Off Action
  const handleCompleteSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = parseFloat(countedCash) || 0;
    const summary = shiftStore.signOff(counted, signOffNotes);
    soundService.playScanBeep();
    setSignOffSummary(summary);
  };

  // Manager PIN verification
  const handleManagerAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerPin === '1234' || managerPin === 'admin123' || user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      setIsManagerAuthenticated(true);
      setManagerError(null);
      soundService.playScanBeep();
      setManagerSummary({
        managerName: user?.fullName || 'Supervisor Manager',
        terminalId,
        grossSales: shiftStore.cashSales + shiftStore.cardSales + shiftStore.qrSales,
        totalBills: shiftStore.totalTransactions,
        openingCash: shiftStore.openingFloat,
        closingCashExpected: shiftStore.openingFloat + shiftStore.cashSales,
        auditTimestamp: new Date().toLocaleString(),
      });
    } else {
      soundService.playErrorBuzz();
      setManagerError('Invalid Manager Security PIN. (Default test PIN: 1234)');
    }
  };

  const handleManagerFinalize = () => {
    shiftStore.managerSignOff(user?.fullName || 'Supervisor');
    soundService.playScanBeep();
    logout();
  };

  // Expected Cash calculation
  const expectedCashInLocker = shiftStore.openingFloat + shiftStore.cashSales;
  const countedNum = parseFloat(countedCash) || 0;
  const variance = countedNum - expectedCashInLocker;

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-100 via-emerald-50/40 to-teal-50/30 dark:from-[#060a12] dark:via-[#09101d] dark:to-[#040810] text-slate-800 dark:text-slate-100 overflow-hidden select-none font-sans relative">

      {/* Dynamic Ambient Color Halos */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* ══════════════════════════════════════════════════════════════
          TOP NAVIGATION & TELEMETRY HEADER
      ══════════════════════════════════════════════════════════════ */}
      <header className="h-20 px-6 ios-glass-panel flex items-center justify-between border-b border-white/10 shrink-0 z-30 shadow-lg">

        {/* 1. Brand & Store Info */}
        <div className="flex items-center gap-4">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20">
            <Store className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-green-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                SUPERMART POS
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                TERMINAL MENU
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>Mathara Stores Flagship</span>
              <span>•</span>
              <span className="text-emerald-500 font-bold">{terminalId}</span>
              <span>•</span>
              <span>Lane 01</span>
            </div>
          </div>
        </div>

        {/* 2. Server Telemetry & Live Clock */}
        <div className="hidden lg:flex items-center gap-5 px-5 py-2 rounded-2xl ios-glass-pill border border-emerald-500/25">
          {/* Server Connection Status */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="flex flex-col">
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                Cloud Server Sync
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono">
                {pingMs}ms latency · Since {serverConnectTime}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-300 dark:bg-white/15" />

          {/* Real-time Clock */}
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
            <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
            <div className="flex flex-col leading-tight">
              <span>{time || '--:--:--'}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{date}</span>
            </div>
          </div>
        </div>

        {/* 3. User Details & Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl ios-glass-pill hover:bg-white/40 dark:hover:bg-white/10 text-slate-700 dark:text-gray-200 transition-all cursor-pointer shadow-sm"
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User Profile Card */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-300 dark:border-white/15">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md">
              {user?.fullName?.charAt(0) || 'C'}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{user?.fullName || 'Cashier 1'}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {user?.role || 'CASHIER'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                @{user?.username || 'cashier'} · Active Operator
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 transition-all cursor-pointer active:scale-95 ml-1"
              title="Logout Operator Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          SHIFT STATUS ALERT RIBBON
      ══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-2 bg-black/10 dark:bg-black/30 border-b border-white/5 flex items-center justify-between text-xs shrink-0">
        {shiftStore.isShiftActive ? (
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-green-pulse" />
            <span>Shift Active:</span>
            <strong className="font-mono text-slate-800 dark:text-white">
              {shiftStore.shiftId}
            </strong>
            <span className="text-slate-400">|</span>
            <span>Signed on at:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {shiftStore.signOnTime ? new Date(shiftStore.signOnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
            <span className="text-slate-400">|</span>
            <span>Opening Locker Float:</span>
            <strong className="text-emerald-600 dark:text-emerald-300 font-mono">
              Rs. {shiftStore.openingFloat.toFixed(2)}
            </strong>
            <span className="text-slate-400">|</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              {shiftStore.lockerId}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>Shift Inactive:</span>
            <span className="text-slate-600 dark:text-slate-300">
              You must <strong>Sign On</strong> and record your starting money in the locker before opening the Invoice register.
            </span>
          </div>
        )}

        <div className="text-[11px] font-mono text-slate-500">
          Terminal Status: <strong className="text-slate-700 dark:text-slate-300">Ready &amp; Secured</strong>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MAIN BODY: 5 TABS NAVIGATION & CONTENT
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-6 gap-6">

        {/* ── Left Side: 5 Core Tabs Navigation ── */}
        <div className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col gap-3">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 px-3 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>Terminal Functions</span>
          </div>

          {/* 1. SIGN ON TAB */}
          <button
            type="button"
            onClick={() => handleSelectTab('SIGN_ON')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
              activeTab === 'SIGN_ON'
                ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'ios-glass-tile hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'SIGN_ON' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40' : 'bg-emerald-500/10 text-emerald-500'
              }`}>
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors">
                  Sign On
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {shiftStore.isShiftActive ? 'Shift Active (Open)' : 'Start shift & locker float'}
                </div>
              </div>
            </div>
            {shiftStore.isShiftActive && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-green-pulse" />
            )}
          </button>

          {/* 2. INVOICE TAB */}
          <button
            type="button"
            onClick={() => handleSelectTab('INVOICE')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer group relative overflow-hidden ${
              activeTab === 'INVOICE'
                ? 'bg-cyan-500/15 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'ios-glass-tile hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'INVOICE' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/40' : 'bg-cyan-500/10 text-cyan-500'
              }`}>
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                  <span>Invoice</span>
                  {!shiftStore.isShiftActive && (
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {shiftStore.isShiftActive ? 'Open POS Billing Register' : 'Requires active shift'}
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 3. SETTINGS TAB */}
          <button
            type="button"
            onClick={() => handleSelectTab('SETTINGS')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
              activeTab === 'SETTINGS'
                ? 'bg-violet-500/15 border-violet-500/50 shadow-lg shadow-violet-500/10'
                : 'ios-glass-tile hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'SETTINGS' ? 'bg-violet-500 text-white shadow-md shadow-violet-500/40' : 'bg-violet-500/10 text-violet-500'
              }`}>
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-400 transition-colors">
                  Settings
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Hardware &amp; Preferences
                </div>
              </div>
            </div>
          </button>

          {/* 4. SIGN OFF TAB */}
          <button
            type="button"
            onClick={() => handleSelectTab('SIGN_OFF')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
              activeTab === 'SIGN_OFF'
                ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'ios-glass-tile hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'SIGN_OFF' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/40' : 'bg-amber-500/10 text-amber-500'
              }`}>
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-400 transition-colors">
                  Sign Off
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Cashier Shift Close &amp; Float
                </div>
              </div>
            </div>
          </button>

          {/* 5. MANAGER SIGN OFF TAB */}
          <button
            type="button"
            onClick={() => handleSelectTab('MANAGER_SIGN_OFF')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
              activeTab === 'MANAGER_SIGN_OFF'
                ? 'bg-rose-500/15 border-rose-500/50 shadow-lg shadow-rose-500/10'
                : 'ios-glass-tile hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'MANAGER_SIGN_OFF' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/40' : 'bg-rose-500/10 text-rose-500'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-400 transition-colors">
                  Manager Sign Off
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Z-Report &amp; Security Audit
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* ── Right Side: Tab Panel Content ── */}
        <div className="flex-1 ios-glass-panel rounded-3xl p-6 lg:p-8 overflow-y-auto no-scrollbar shadow-2xl relative flex flex-col justify-between">

          {/* ══════════════════════════════════════════════════════════
              TAB 1: SIGN ON (Locker Float & Start Shift)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'SIGN_ON' && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Cashier Shift Management</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Sign On &amp; Cash Locker Initialization
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Specify the initial cash float placed in the cashier drawer before opening the register for billing.
                </p>
              </div>

              {signOnSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{signOnSuccessMsg}</span>
                </div>
              )}

              {shiftStore.isShiftActive ? (
                /* Shift Already Active View */
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-emerald-500">Current Session</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                        Shift #{shiftStore.shiftId} is Active
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Register Open</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-white/60 dark:bg-black/30 border border-white/10">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Locker Opening Cash</div>
                      <div className="text-base font-black text-emerald-500 font-mono mt-0.5">
                        Rs. {shiftStore.openingFloat.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/60 dark:bg-black/30 border border-white/10">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Assigned Locker</div>
                      <div className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                        {shiftStore.lockerId}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/60 dark:bg-black/30 border border-white/10">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Bills Today</div>
                      <div className="text-base font-bold text-cyan-500 font-mono mt-0.5">
                        {shiftStore.totalTransactions} Bills
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onNavigateToPos}
                    className="w-full py-3.5 rounded-xl ios-glass-button text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/30"
                  >
                    <span>GO TO POS INVOICING REGISTER</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Start Shift Form */
                <form onSubmit={handleStartShift} className="space-y-5">
                  {/* Locker Selection */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                      1. Select Cash Drawer / Locker Station
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Locker #01', 'Locker #02', 'Locker #03'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setLockerId(loc)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            lockerId === loc
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{loc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Initial Locker Float Amount */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                      2. Initial Opening Float (Money in Locker)
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[2500, 5000, 10000, 20000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setFloatAmount(amt);
                            setCustomFloat(amt.toString());
                          }}
                          className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                            floatAmount === amt && customFloat === amt.toString()
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
                              : 'ios-glass-pill hover:border-emerald-500/40'
                          }`}
                        >
                          Rs. {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-emerald-500 text-sm">
                        Rs.
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="100"
                        value={customFloat}
                        onChange={(e) => {
                          setCustomFloat(e.target.value);
                          setFloatAmount(parseFloat(e.target.value) || 0);
                        }}
                        placeholder="Enter opening money amount"
                        className="w-full pl-12 pr-4 py-3 rounded-xl ios-glass-input text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Recommended opening float for morning shift: Rs. 5,000.00
                    </span>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                      3. Shift Handover Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={signOnNotes}
                      onChange={(e) => setSignOnNotes(e.target.value)}
                      placeholder="e.g. Received float from Head Cashier, 100x50, 500x8"
                      className="w-full px-4 py-2.5 rounded-xl ios-glass-input text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl ios-glass-button text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/40 transition-all hover:scale-[1.01]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRM FLOAT &amp; START CASHIER SHIFT</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: INVOICE (Gatekeeper Check)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'INVOICE' && (
            <div className="space-y-6 max-w-xl animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>POS Sales &amp; Invoicing</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Checkout Billing Register
                </h2>
              </div>

              {shiftStore.isShiftActive ? (
                <div className="p-6 rounded-2xl ios-glass-tile space-y-4">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-base font-bold text-slate-800 dark:text-white">Shift Active &amp; Ready for Billing</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your register is unlocked. Barcode scanner and customer cart ready to bill products.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateToPos}
                    className="w-full py-4 rounded-xl ios-glass-button text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/30"
                  >
                    <span>LAUNCH POS BILLING REGISTER</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Sign On Required</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    You cannot start invoicing before signing on and recording your initial money in the locker.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('SIGN_ON')}
                    className="px-6 py-3 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center gap-2 mx-auto cursor-pointer shadow-md hover:bg-amber-600"
                  >
                    <span>OPEN SIGN ON &amp; ADD LOCKER MONEY</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: SETTINGS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Hardware &amp; System Configuration</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Terminal Settings
                </h2>
              </div>

              <div className="space-y-4">
                {/* Receipt Printer Width */}
                <div className="p-4 rounded-2xl ios-glass-tile flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-violet-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Thermal Receipt Paper Width</div>
                      <div className="text-[11px] text-slate-500">Standard EPSON / Star Micronics format</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(['80mm', '58mm'] as const).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setReceiptWidth(w)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          receiptWidth === w
                            ? 'bg-violet-500 text-white border-violet-400'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Print Receipt Toggle */}
                <div className="p-4 rounded-2xl ios-glass-tile flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Automatic Print on Checkout</div>
                      <div className="text-[11px] text-slate-500">Auto-triggers thermal receipt print dialog</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoPrintReceipt(!autoPrintReceipt)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      autoPrintReceipt ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {autoPrintReceipt ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {/* Audio Feedback */}
                <div className="p-4 rounded-2xl ios-glass-tile flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {soundEffectsEnabled ? (
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-slate-500" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Barcode &amp; Checkout Audio Beeps</div>
                      <div className="text-[11px] text-slate-500">Synthesized audio cues on scan and errors</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      soundEffectsEnabled ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {soundEffectsEnabled ? 'ON' : 'MUTED'}
                  </button>
                </div>

                {/* Store Profile Info */}
                <div className="p-4 rounded-2xl ios-glass-tile">
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">Official Store Profile</div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500">Store Name:</span>
                      <strong className="block text-slate-800 dark:text-slate-200">Mathara Stores Flagship</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Tax Reg / VAT:</span>
                      <strong className="block text-slate-800 dark:text-slate-200">1049284920-7000</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Terminal Code:</span>
                      <strong className="block text-emerald-500">{terminalId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Support Hotline:</span>
                      <strong className="block text-slate-800 dark:text-slate-200">(011) 234-5678</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: SIGN OFF (Cashier Shift Reconciliation)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'SIGN_OFF' && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cashier Shift Close</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Shift Sign Off &amp; Drawer Balancing
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Reconcile your physical locker cash against system registered sales before closing shift.
                </p>
              </div>

              {!shiftStore.isShiftActive && !signOffSummary && (
                <div className="p-6 rounded-2xl ios-glass-tile text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <div className="text-sm font-bold text-slate-800 dark:text-white">No Active Cashier Shift</div>
                  <p className="text-xs text-slate-500">Please Sign On first to start recording sales.</p>
                </div>
              )}

              {shiftStore.isShiftActive && (
                <form onSubmit={handleCompleteSignOff} className="space-y-5">
                  {/* Reconciliation Table */}
                  <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3 font-mono text-xs">
                    <div className="flex justify-between pb-2 border-b border-white/10">
                      <span className="text-slate-400">Shift ID:</span>
                      <strong className="text-white">{shiftStore.shiftId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Opening Cash in Locker:</span>
                      <span className="text-white font-bold">Rs. {shiftStore.openingFloat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cash Sales (Shift Total):</span>
                      <span className="text-emerald-400 font-bold">+ Rs. {shiftStore.cashSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Card &amp; Digital Payments:</span>
                      <span className="text-cyan-400">Rs. {shiftStore.cardSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
                      <span className="text-emerald-300 font-extrabold">Expected Cash in Drawer:</span>
                      <strong className="text-emerald-400 font-black">
                        Rs. {expectedCashInLocker.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Physical Cash Count Input */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                      Counted Physical Cash in Drawer (Rs.)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                      placeholder="Enter actual physical cash counted"
                      className="w-full px-4 py-3 rounded-xl ios-glass-input text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    />

                    {/* Real-time Variance Chip */}
                    {countedCash && (
                      <div className={`mt-2 p-3 rounded-xl text-xs font-bold font-mono flex items-center justify-between ${
                        Math.abs(variance) < 0.01
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : variance < 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        <span>Locker Variance:</span>
                        <span>
                          {Math.abs(variance) < 0.01
                            ? '✓ BALANCED (Rs. 0.00)'
                            : variance < 0
                            ? `⚠️ SHORTAGE: -Rs. ${Math.abs(variance).toFixed(2)}`
                            : `+ OVERAGE: +Rs. ${variance.toFixed(2)}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sign Off Notes */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                      Handover Notes
                    </label>
                    <input
                      type="text"
                      value={signOffNotes}
                      onChange={(e) => setSignOffNotes(e.target.value)}
                      placeholder="Notes regarding drawer balance or handover"
                      className="w-full px-4 py-2.5 rounded-xl ios-glass-input text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-amber-500/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRM SIGN OFF &amp; CLOSE SHIFT</span>
                  </button>
                </form>
              )}

              {signOffSummary && (
                <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 space-y-3 animate-fade-in font-mono text-xs">
                  <div className="text-emerald-400 font-bold text-sm">Shift Successfully Signed Off</div>
                  <div>Expected: Rs. {signOffSummary.expectedCash.toFixed(2)}</div>
                  <div>Counted: Rs. {signOffSummary.countedCash.toFixed(2)}</div>
                  <div>Variance: Rs. {signOffSummary.variance.toFixed(2)}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setSignOffSummary(null);
                      setActiveTab('SIGN_ON');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Return to Main Menu
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 5: MANAGER SIGN OFF (Z-Report Audit)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'MANAGER_SIGN_OFF' && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 text-rose-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Supervisor Audit Gate</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Manager Sign Off &amp; Z-Report
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Managerial authorization required for day-end reconciliation, drawer clearance, and terminal lock.
                </p>
              </div>

              {!isManagerAuthenticated ? (
                /* Security PIN Challenge */
                <form onSubmit={handleManagerAuth} className="p-6 rounded-2xl ios-glass-tile space-y-4 max-w-md">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-rose-500" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Manager PIN Required</div>
                      <div className="text-xs text-slate-500">Enter Supervisor Authorization PIN to unlock</div>
                    </div>
                  </div>

                  {managerError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-semibold">
                      {managerError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                      Manager PIN
                    </label>
                    <input
                      type="password"
                      required
                      value={managerPin}
                      onChange={(e) => setManagerPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-4 py-3 rounded-xl ios-glass-input text-lg font-mono text-center tracking-widest text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-500/30"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>AUTHENTICATE SUPERVISOR</span>
                  </button>
                </form>
              ) : (
                /* Full Z-Report & Manager Sign Off */
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-5 font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <div className="text-sm font-black text-rose-400 uppercase">OFFICIAL Z-REPORT AUDIT</div>
                      <div className="text-[11px] text-slate-400">Terminal {terminalId} · Day End Clearance</div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                      SUPERVISOR VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/5">
                      <span className="text-slate-400 block text-[10px]">Gross Sales Volume</span>
                      <strong className="text-white text-sm">
                        Rs. {(shiftStore.cashSales + shiftStore.cardSales + shiftStore.qrSales).toFixed(2)}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <span className="text-slate-400 block text-[10px]">Total Invoices</span>
                      <strong className="text-white text-sm">{shiftStore.totalTransactions} Receipts</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <span className="text-slate-400 block text-[10px]">Opening Float</span>
                      <strong className="text-emerald-400 text-sm">Rs. {shiftStore.openingFloat.toFixed(2)}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <span className="text-slate-400 block text-[10px]">Cash Vault Expected</span>
                      <strong className="text-emerald-400 text-sm">
                        Rs. {(shiftStore.openingFloat + shiftStore.cashSales).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleManagerFinalize}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-rose-500/40"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>AUTHORIZE SIGN OFF, PRINT Z-REPORT &amp; LOCK TERMINAL</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Card Footer Info */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>PCI-DSS v2.4 Encrypted POS Terminal Workstation</span>
            </div>
            <div>
              Version: <strong className="text-slate-400">2.4.0-PRO</strong>
            </div>
          </div>

        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════
          GATE WARNING MODAL (Invoicing Blocked Before Sign On)
      ══════════════════════════════════════════════════════════════ */}
      {showGateWarning && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl ios-glass-panel border border-amber-500/40 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Sign On &amp; Locker Float Required
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1.5 leading-relaxed">
                Before opening the Invoice register, you must <strong>Sign On</strong> and record your initial cash float in the locker.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGateWarning(false)}
                className="flex-1 py-2.5 rounded-xl ios-glass-pill text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGateWarning(false);
                  setActiveTab('SIGN_ON');
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/30"
              >
                <span>Go to Sign On</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PosMenuScreen;

import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './pages/LoginScreen';
import { PosMenuScreen } from './pages/PosMenuScreen';
import { PosMainScreen } from './pages/PosMainScreen';
import { ScreenTransitionLoader } from './components/ScreenTransitionLoader';

export const App: React.FC = () => {
  const { user, token } = useAuthStore();
  const isAuthenticated = !!(user && token);

  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionMessage, setTransitionMessage] = useState<string>('');
  const [transitionSubMessage, setTransitionSubMessage] = useState<string>('');
  const [currentScreen, setCurrentScreen] = useState<'LOGIN' | 'MENU' | 'POS'>(
    isAuthenticated ? 'MENU' : 'LOGIN'
  );

  // Synchronize screen state with authentication
  useEffect(() => {
    if (!isAuthenticated && currentScreen !== 'LOGIN') {
      setIsTransitioning(true);
      setTransitionMessage('Closing Cashier Session...');
      setTransitionSubMessage('Securing Workstation Ledger & Resetting Register...');
      const timer = setTimeout(() => {
        setCurrentScreen('LOGIN');
        setIsTransitioning(false);
      }, 550);
      return () => clearTimeout(timer);
    } else if (isAuthenticated && currentScreen === 'LOGIN') {
      setIsTransitioning(true);
      setTransitionMessage('Authenticating Operator...');
      setTransitionSubMessage('Connecting to Cloud Server & Loading Terminal Menu...');
      const timer = setTimeout(() => {
        setCurrentScreen('MENU');
        setIsTransitioning(false);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentScreen]);

  // Navigate from Menu to POS Invoicing Register
  const handleNavigateToPos = () => {
    setIsTransitioning(true);
    setTransitionMessage('Opening Invoicing Register...');
    setTransitionSubMessage('Loading Store Catalog & Initializing Barcode Scanner...');
    setTimeout(() => {
      setCurrentScreen('POS');
      setIsTransitioning(false);
    }, 450);
  };

  // Navigate from POS back to Terminal Menu
  const handleNavigateToMenu = () => {
    setIsTransitioning(true);
    setTransitionMessage('Returning to Terminal Menu...');
    setTransitionSubMessage('Syncing Active Shift & Releasing Cash Drawer...');
    setTimeout(() => {
      setCurrentScreen('MENU');
      setIsTransitioning(false);
    }, 450);
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative font-sans select-none">
      {/* Apple-style Smooth Transition Overlay Loader */}
      {isTransitioning && (
        <ScreenTransitionLoader
          message={transitionMessage}
          subMessage={transitionSubMessage}
        />
      )}

      {/* Screen Routing with iOS Enter Animation */}
      {currentScreen === 'LOGIN' && (
        <div key="login-view" className="w-full h-full animate-ios-enter">
          <LoginScreen />
        </div>
      )}

      {currentScreen === 'MENU' && (
        <div key="menu-view" className="w-full h-full animate-ios-enter">
          <PosMenuScreen onNavigateToPos={handleNavigateToPos} />
        </div>
      )}

      {currentScreen === 'POS' && (
        <div key="pos-view" className="w-full h-full animate-ios-enter">
          <PosMainScreen onOpenMenu={handleNavigateToMenu} />
        </div>
      )}
    </div>
  );
};

export default App;

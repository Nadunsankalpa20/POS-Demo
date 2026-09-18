import React, { useState } from 'react';
import { useAuthStore } from './store/authStore';
import { BackOfficeLogin } from './pages/BackOfficeLogin';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { StockPage } from './pages/StockPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

export type PageKey = 'dashboard' | 'products' | 'stock' | 'reports' | 'users' | 'audit';

const App: React.FC = () => {
  const { user, token } = useAuthStore();
  const [activePage, setActivePage] = useState<PageKey>('dashboard');

  if (!user || !token) {
    return <BackOfficeLogin />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'products':  return <ProductsPage />;
      case 'stock':     return <StockPage />;
      case 'reports':   return <ReportsPage />;
      case 'users':     return <UsersPage />;
      case 'audit':     return <AuditLogPage />;
      default:          return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activePage={activePage} user={user} />
        <main className="flex-1 overflow-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;

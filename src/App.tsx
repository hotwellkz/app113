import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Feed } from './pages/Feed';
import { DailyReport } from './pages/DailyReport';
import { Clients } from './pages/Clients';
import { ContractTemplates } from './pages/ContractTemplates';
import { Products } from './pages/Products';
import { Transactions } from './pages/Transactions';
import { WarehouseProducts } from './pages/warehouse/products/WarehouseProducts';
import { EmployeesProtected } from './pages/EmployeesProtected';
import { FolderProducts } from './pages/warehouse/products/FolderProducts';
import { Projects } from './pages/Projects';
import { ProductDetails } from './pages/warehouse/products/ProductDetails';
import { Calculator } from './pages/Calculator';
import { Chat } from './pages/Chat';
import { Warehouse } from './pages/Warehouse';
import { NewExpense } from './pages/warehouse/NewExpense';
import { NewIncome } from './pages/warehouse/NewIncome';
import { Dashboard } from './pages/Dashboard';
import { useStats } from './hooks/useStats';
import { LoadingSpinner } from './components/LoadingSpinner';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

type Page = 'dashboard' | 'transactions' | 'feed' | 'daily-report' | 'clients' | 'templates' | 'products' | 'employees' | 'projects' | 'calculator' | 'chat' | 'warehouse';

const AppContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('transactions');
  const { stats, loading: statsLoading, error: statsError } = useStats();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'categories'));
        console.log('Firebase connected, documents count:', snapshot.size);
        setIsLoading(false);
      } catch (error) {
        console.error('Firebase initialization error:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading || statsLoading) {
    return <LoadingSpinner />;
  }

  if (statsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-xl text-red-500 p-4 bg-white rounded-lg shadow">
          Ошибка загрузки данных: {statsError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onPageChange={setCurrentPage} currentPage={currentPage} />
      <div className="lg:pl-64">
        <Header 
          stats={stats} 
          onPageChange={(page) => {
            navigate(`/${page}`);
            setCurrentPage(page as Page);
          }} 
        />
        <Routes>
          <Route path="/" element={<Transactions />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/daily-report" element={<DailyReport />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/templates" element={<ContractTemplates />} />
          <Route path="/products" element={<Products />} />
          <Route path="/warehouse/products" element={<WarehouseProducts />} />
          <Route path="/warehouse/products/:id" element={<ProductDetails />} />
          <Route path="/warehouse/folders/:folderId" element={<FolderProducts />} />
          <Route path="/employees" element={<EmployeesProtected />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/warehouse" element={<Warehouse onPageChange={setCurrentPage} />} />
          <Route path="/warehouse/expense/new" element={<NewExpense />} />
          <Route path="/warehouse/income/new" element={<NewIncome />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
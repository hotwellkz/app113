import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, BarChart2, Scan, PackagePlus, PackageMinus, Settings, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { WarehouseCard } from '../components/warehouse/WarehouseCard';

interface MenuCard {
  icon: React.ReactNode;
  title: string;
  count?: number;
  onClick: () => void;
  color: string;
}

export const Warehouse: React.FC<{ onPageChange: (page: string) => void }> = ({ onPageChange }) => {
  const navigate = useNavigate();
  const [productsCount, setProductsCount] = useState(0);

  useEffect(() => {
    const fetchProductsCount = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        setProductsCount(snapshot.size);
      } catch (error) {
        console.error('Error fetching products count:', error);
      }
    };

    fetchProductsCount();
  }, []);
  const menuCards: MenuCard[] = [
    {
      icon: <Package className="w-8 h-8 text-white" />,
      title: 'Товары',
      count: productsCount,
      onClick: () => navigate('/warehouse/products'),
      color: 'bg-gradient-to-br from-emerald-400 to-emerald-600'
    },
    {
      icon: <FileText className="w-8 h-8 text-white" />,
      title: 'Документы',
      count: 7,
      onClick: () => console.log('Документы'),
      color: 'bg-gradient-to-br from-blue-400 to-blue-600'
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-white" />,
      title: 'Отчеты',
      onClick: () => console.log('Отчеты'),
      color: 'bg-gradient-to-br from-amber-400 to-amber-600'
    },
    {
      icon: <Scan className="w-8 h-8 text-white" />,
      title: 'Сканировать',
      onClick: () => console.log('Сканировать'),
      color: 'bg-gradient-to-br from-purple-400 to-purple-600'
    },
    {
      icon: <PackagePlus className="w-8 h-8 text-white" />,
      title: 'Новый Приход',
      onClick: () => navigate('/warehouse/income/new'),
      color: 'bg-gradient-to-br from-green-400 to-green-600'
    },
    {
      icon: <PackageMinus className="w-8 h-8 text-white" />,
      title: 'Новый Расход',
      onClick: () => navigate('/warehouse/expense/new'),
      color: 'bg-gradient-to-br from-red-400 to-red-600'
    },
    {
      icon: <Settings className="w-8 h-8 text-white" />,
      title: 'Настройки',
      onClick: () => console.log('Настройки'),
      color: 'bg-gradient-to-br from-gray-400 to-gray-600'
    },
    {
      icon: <ClipboardCheck className="w-8 h-8 text-white" />,
      title: 'Инвентаризация',
      onClick: () => console.log('Инвентаризация'),
      color: 'bg-gradient-to-br from-indigo-400 to-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Новая шапка */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16">
            <button onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Учёт Товаров</h1>
              <p className="text-sm text-gray-500">Основной склад</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <DashboardStats />
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {menuCards.map((card, index) => (
            <WarehouseCard
              key={index}
              icon={card.icon}
              title={card.title}
              count={card.count}
              onClick={card.onClick}
              color={card.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { Package, DollarSign, AlertTriangle, Boxes } from 'lucide-react';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    categoriesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Получаем все товары
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const products = productsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));

        // Считаем общую стоимость
        const totalValue = products.reduce((sum, product) => 
          sum + (product.quantity * product.averagePurchasePrice), 0);

        // Считаем товары с низким остатком
        const lowStockCount = products.filter(product => 
          product.quantity <= product.minQuantity).length;

        // Получаем количество категорий
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));

        setStats({
          totalProducts: products.length,
          totalValue,
          lowStockCount,
          categoriesCount: categoriesSnapshot.size
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-12 bg-gray-200 rounded-full w-12 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-emerald-100">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <p className="text-gray-500 text-xs">Всего товаров</p>
            <p className="text-lg font-semibold text-gray-900">{stats.totalProducts}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-amber-100">
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <p className="text-gray-500 text-xs">Общая стоимость</p>
            <p className="text-lg font-semibold text-gray-900">{stats.totalValue.toLocaleString()} ₸</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-red-100">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <p className="text-gray-500 text-xs">Мало на складе</p>
            <p className="text-lg font-semibold text-gray-900">{stats.lowStockCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-purple-100">
            <Boxes className="w-5 h-5 text-purple-600" />
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <p className="text-gray-500 text-xs">Категорий</p>
            <p className="text-lg font-semibold text-gray-900">{stats.categoriesCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
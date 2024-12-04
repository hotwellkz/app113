import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Barcode, Paperclip, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, doc, updateDoc, serverTimestamp, writeBatch, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useCategories } from '../../hooks/useCategories';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { Product } from '../../types/warehouse';

const INCOME_ITEMS_KEY = 'income_items';
const INCOME_SUPPLIER_KEY = 'income_supplier';

interface IncomeItem {
  product: Product;
  quantity: number;
  price: number;
}

export const NewIncome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentNumber, setDocumentNumber] = useState('000012');
  const [supplier, setSupplier] = useState(() => {
    // Сначала проверяем state, затем localStorage
    const state = location.state as { selectedEmployee?: string };
    return state?.selectedEmployee || localStorage.getItem(INCOME_SUPPLIER_KEY) || '';
  });
  const [note, setNote] = useState('');
  const [items, setItems] = useState<IncomeItem[]>(() => {
    const savedItems = localStorage.getItem(INCOME_ITEMS_KEY);
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories, loading: categoriesLoading } = useCategories();

  // Фильтруем только категории сотрудников (row === 2)
  const employeeCategories = categories.filter(c => c.row === 2 && c.isVisible !== false);

  // Сохраняем supplier в localStorage при изменении
  useEffect(() => {
    if (supplier) {
      localStorage.setItem(INCOME_SUPPLIER_KEY, supplier);
    }
  }, [supplier]);

  useEffect(() => {
    localStorage.setItem(INCOME_ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  // Добавляем товар в список
  useEffect(() => {
    const state = location.state as { addedProduct?: { product: Product; quantity: number } };
    if (state?.addedProduct && state.addedProduct.product && state.addedProduct.quantity) {
      const newItem = {
        product: state.addedProduct.product,
        quantity: state.addedProduct.quantity,
        price: state.addedProduct.product.averagePurchasePrice || 0,
      };
      
      setItems(prev => {
        const existingIndex = prev.findIndex(item => item.product.id === newItem.product.id);
        if (existingIndex >= 0) {
          const newItems = [...prev];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItem.quantity
          };
          return newItems;
        }
        return [...prev, newItem];
      });
      
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleUpdateItem = (index: number, field: 'quantity' | 'price', value: number) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return newItems;
    });
  };

  const handleDeleteItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAll = () => {
    if (window.confirm('Вы уверены, что хотите удалить все товары?')) {
      setItems([]);
      localStorage.removeItem(INCOME_ITEMS_KEY);
      localStorage.removeItem(INCOME_SUPPLIER_KEY);
      setSupplier('');
    }
  };

  const handleSubmit = async () => {
    if (!supplier) {
      showErrorNotification('Выберите сотрудника');
      return;
    }

    if (items.length === 0) {
      showErrorNotification('Добавьте товары');
      return;
    }

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);

      // Обновляем количество и цены товаров
      for (const item of items) {
        // Получаем текущие данные о товаре
        const productRef = doc(db, 'products', item.product.id);
        const productDoc = await getDoc(productRef);
        if (!productDoc.exists()) {
          throw new Error(`Товар ${item.product.name} не найден`);
        }
        const currentData = productDoc.data();

        const newQuantity = (item.product.quantity || 0) + item.quantity;
        const newTotalPrice = (item.product.totalPurchasePrice || 0) + (item.quantity * item.price);
        const newAveragePrice = newTotalPrice / newQuantity;

        batch.update(productRef, {
          quantity: newQuantity,
          totalPurchasePrice: newTotalPrice,
          averagePurchasePrice: newAveragePrice,
          updatedAt: serverTimestamp()
        });

        // Добавляем запись в историю движения товара
        const movementRef = doc(collection(db, 'productMovements'));
        batch.set(movementRef, {
          productId: item.product.id,
          type: 'in',
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.quantity * item.price,
          warehouse: 'Основной склад',
          description: `Приход товара от ${supplier}`,
          date: serverTimestamp(), 
          previousQuantity: currentData?.quantity || 0,
          newQuantity: newQuantity,
          previousAveragePrice: currentData?.averagePurchasePrice || 0,
          newAveragePrice: newAveragePrice,
          supplier: supplier
        });
      }

      await batch.commit();
      showSuccessNotification('Товары успешно добавлены на склад');
      setItems([]);
      localStorage.removeItem(INCOME_ITEMS_KEY);
      localStorage.removeItem(INCOME_SUPPLIER_KEY);
      navigate('/warehouse');
    } catch (error) {
      console.error('Error submitting income:', error);
      showErrorNotification(error instanceof Error ? error.message : 'Ошибка при добавлении товаров');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotals = () => {
    return items.reduce((acc, item) => ({
      quantity: acc.quantity + item.quantity,
      amount: acc.amount + (item.quantity * item.price),
      total: acc.total + (item.quantity * item.price)
    }), { quantity: 0, amount: 0, total: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/warehouse')} className="text-gray-600">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Приход новый</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-gray-600">
                <Search className="w-6 h-6" />
              </button>
              <button className="text-gray-600">
                <Barcode className="w-6 h-6" />
              </button>
              <button className="text-gray-600">
                <span className="text-xl">⋮</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Форма */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 space-y-4">
            {/* Дата и номер документа */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата документа
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер документа
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Поставщик */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сотрудник
              </label>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Выберите сотрудника</option>
                {categoriesLoading ? (
                  <option disabled>Загрузка...</option>
                ) : (
                  employeeCategories.map((category) => (
                    <option key={category.id} value={category.title}>
                      {category.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Примечание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Примечание
              </label>
              <div className="relative">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
                <button className="absolute right-2 bottom-2 text-gray-400">
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Список товаров */}
        <div className="mt-8 bg-white rounded-lg shadow-sm">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <div className="text-4xl text-gray-400">📦</div>
              </div>
              <p className="text-gray-500 text-lg">Добавьте товары</p>
            </div>
          ) : (
            <div className="divide-y">
              <div className="p-4 flex justify-end">
                <button
                  onClick={handleDeleteAll}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить все
                </button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Количество:</span>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                          className="w-20 px-2 py-1 border rounded text-right"
                          min="1"
                        />
                        <span className="text-sm text-gray-500">{item.product.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Цена:</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(index, 'price', Number(e.target.value))}
                          className="w-24 px-2 py-1 border rounded text-right"
                          min="0"
                        />
                        <span className="text-sm text-gray-500">₸</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(index)}
                    className="p-2 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Нижняя панель */}
        <div className="fixed bottom-0 inset-x-0 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="grid grid-cols-3 gap-4 text-center flex-1">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totals.quantity}</div>
                  <div className="text-xs text-gray-500">Кол-во</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totals.amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Сумма</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{totals.total.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Итого</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !supplier || items.length === 0}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-gray-300"
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить на склад'}
                </button>
                <button 
                  onClick={() => navigate('/warehouse/products')}
                  className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-emerald-600"
                >
                  <span className="text-2xl">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
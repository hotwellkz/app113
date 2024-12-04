import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, ArrowDownRight, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { formatTime } from '../utils/dateUtils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Transaction {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  description: string;
  date: {
    seconds: number;
    nanoseconds: number;
  };
  type: 'income' | 'expense';
  categoryId: string;
}

interface DailyTotal {
  [key: string]: {
    total: number;
    transactions: Transaction[];
  };
}

export const DailyReport: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [totalAmount, setTotalAmount] = useState(0);
  const [groupedData, setGroupedData] = useState<{
    [key: string]: { transactions: Transaction[], total: number }
  }>({});

  const parseTransactionDate = (timestamp: { seconds: number }) => {
    return new Date(timestamp.seconds * 1000);
  };

  const getDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const isDateAvailable = (date: Date) => 
    transactions.some(t => isSameDay(parseTransactionDate(t.date), date));

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      const thousands = Math.floor(amount / 1000);
      return `${thousands.toLocaleString()} k ₸`;
    }
    return `${amount.toLocaleString()} ₸`;
  };

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsMap = new Map<string, Transaction>();
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data() as Transaction;
        
        // Создаем уникальный ключ, включающий все важные поля
        const key = `${data.fromUser}-${data.toUser}-${data.amount}-${data.date.seconds}-${data.description}`;
        
        // Для каждой пары транзакций оставляем только расход
        if (data.type === 'expense' || !transactionsMap.has(key)) {
          transactionsMap.set(key, {
            id: doc.id,
            ...data
          });
        }
      });

      // Преобразуем Map в массив и сортируем по дате
      const sortedTransactions = Array.from(transactionsMap.values())
        .sort((a, b) => b.date.seconds - a.date.seconds)
        // Фильтруем, оставляя только транзакции с типом 'expense'
        .filter(t => t.type === 'expense');

      const newGroupedData = sortedTransactions.reduce((acc, t) => {
        const dateKey = format(parseTransactionDate(t.date), 'd MMMM yyyy', { locale: ru });
        if (!acc[dateKey]) {
          acc[dateKey] = { transactions: [], total: 0 };
        }
        acc[dateKey].transactions.push(t);
        acc[dateKey].total += Math.abs(t.amount);
        return acc;
      }, {} as { [key: string]: { transactions: Transaction[], total: number } });
      
      const uniqueDates = Object.keys(newGroupedData);
      
      setAvailableDates(uniqueDates);
      setSelectedDate(uniqueDates[0] || '');
      setGroupedData(newGroupedData);
      
      const total = sortedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      setTotalAmount(total);
      
      setTransactions(sortedTransactions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    const date = parseTransactionDate(timestamp);
    const today = new Date();
    const yesterday = new Date(today.setDate(today.getDate() - 1));

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        locale: ru
      });
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (direction === 'prev' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const selectedDayData = groupedData[selectedDate];

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white border-b px-4 sm:px-6 py-3 flex items-center sticky top-0 z-10">
        <div className="flex items-center flex-1">
          <button onClick={() => window.history.back()} className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Отчет по дням</h1>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Общая сумма</div>
          <div className="text-lg font-semibold text-red-600">
            -{formatAmount(totalAmount)}
          </div>
        </div>
      </div>

      {/* Навигация по датам */}
      <div className="bg-white border-b sticky top-[57px] z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDateChange('prev')}
                disabled={availableDates.indexOf(selectedDate) === availableDates.length - 1}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-gray-900">
                  {selectedDate}
                </span>
                <button
                  onClick={() => setShowMonthPicker(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                >
                  <Calendar className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={() => handleDateChange('next')}
                disabled={availableDates.indexOf(selectedDate) === 0}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {selectedDayData && (
              <div className="text-lg font-medium text-red-600">
                -{formatAmount(selectedDayData.total)}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDayData && (
        <div className="divide-y divide-gray-200">
          <div className="bg-white">
            {selectedDayData.transactions.map((transaction) => (
              <div key={transaction.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{transaction.fromUser}</span>
                      <span className="text-sm text-gray-500 mt-1">{transaction.toUser}</span>
                      <span className="text-xs text-gray-400 mt-1">
                        {formatTime(transaction.date)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-base text-red-600">
                      -{Math.abs(transaction.amount) >= 1000000 ? 
                        `${Math.floor(Math.abs(transaction.amount) / 1000).toLocaleString()} k ₸` :
                        `${Math.abs(transaction.amount).toLocaleString()} ₸`}
                    </span>
                    <span className="text-sm text-gray-500 mt-1 text-right">
                      {transaction.description}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="px-4 py-2 bg-gray-50 border-t">
              <div className="flex justify-end">
                <span className="text-sm font-medium text-gray-900">
                  Итого за день: {formatAmount(Math.abs(selectedDayData.total))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно выбора месяца */}
      {showMonthPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Выберите дату</h2>
              <button onClick={() => setShowMonthPicker(false)} className="text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Навигация по месяцам */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setSelectedMonth(prev => {
                  const newDate = new Date(prev);
                  newDate.setMonth(prev.getMonth() - 1);
                  return newDate;
                })}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-lg font-medium">
                {format(selectedMonth, 'LLLL yyyy', { locale: ru })}
              </div>
              <button
                onClick={() => setSelectedMonth(prev => {
                  const newDate = new Date(prev);
                  newDate.setMonth(prev.getMonth() + 1);
                  return newDate;
                })}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Дни недели */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="text-center text-sm text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Календарь */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(selectedMonth).map((date, index) => {
                const isAvailable = isDateAvailable(date);
                const isSelected = selectedDate === format(date, 'd MMMM yyyy', { locale: ru });
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedDate(format(date, 'd MMMM yyyy', { locale: ru }));
                        setShowMonthPicker(false);
                      }
                    }}
                    disabled={!isAvailable}
                    className={`
                      p-2 rounded-lg text-sm
                      ${isSelected ? 'bg-emerald-500 text-white' : ''}
                      ${isAvailable && !isSelected ? 'hover:bg-gray-100' : ''}
                      ${!isAvailable ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}
                    `}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>
            
            {/* Быстрая навигация по месяцам */}
            <div className="mt-6 pt-6 border-t">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Быстрый переход
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedMonth(date)}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      {format(date, 'LLLL', { locale: ru })}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <ArrowDownRight className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">История операций пуста</h3>
          <p className="text-gray-500">Здесь будут отображаться все операции</p>
        </div>
      )}
    </div>
  );
};
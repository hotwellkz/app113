import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/warehouse';
import { format, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSwipeable, SwipeEventData } from 'react-swipeable';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { PasswordPrompt } from '../PasswordPrompt';

interface Movement {
  id: string;
  type: 'in' | 'out';
  quantity: number;
  price: number;
  totalPrice: number;
  date: any;
  description: string;
  warehouse: string;
  previousQuantity: number;
  newQuantity: number;
  previousAveragePrice: number;
  newAveragePrice: number;
  supplier?: string;
}

interface ProductHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ProductHistory: React.FC<ProductHistoryProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [swipedMovementId, setSwipedMovementId] = useState<string | null>(null);

  const handleSwipe = (movementId: string) => {
    if (swipedMovementId === movementId) {
      setSwipedMovementId(null);
    } else {
      setSwipedMovementId(movementId);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData: SwipeEventData) => {
      const element = eventData.event.target as HTMLElement;
      const movementId = element.closest('[data-movement-id]')?.getAttribute('data-movement-id');
      if (movementId) {
        handleSwipe(movementId);
      }
    },
    onSwipedRight: (eventData: SwipeEventData) => {
      const element = eventData.event.target as HTMLElement;
      const movementId = element.closest('[data-movement-id]')?.getAttribute('data-movement-id');
      if (movementId) {
        handleSwipe(movementId);
      }
    },
    trackMouse: true
  });

  useEffect(() => {
    const q = query(
      collection(db, 'productMovements'),
      where('productId', '==', product.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const movementsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date
        })) as Movement[];
        
        // Сортируем локально, так как составной индекс может быть недоступен
        movementsData.sort((a, b) => {
          const dateA = a.date?.seconds || 0;
          const dateB = b.date?.seconds || 0;
          return dateB - dateA;
        });
        
        setMovements(movementsData);
      } catch (error) {
        console.error('Error processing movements:', error);
        setMovements([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error in movements subscription:', error);
      setMovements([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [product.id]);

  if (!isOpen) return null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    if (!isValid(date)) return '';
    try {
      return format(date, 'd MMMM yyyy, HH:mm', { locale: ru });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ru-RU') + ' ₸';
  };

  const handleDelete = async (isAuthenticated: boolean) => {
    if (!isAuthenticated || !selectedMovement) {
      setShowPasswordPrompt(false);
      setSelectedMovement(null);
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // Обновляем количество товара
      const productRef = doc(db, 'products', product.id);
      const newQuantity = selectedMovement.type === 'in' 
        ? selectedMovement.previousQuantity // Возвращаем предыдущее количество при удалении прихода
        : selectedMovement.previousQuantity; // Возвращаем предыдущее количество при удалении расхода

      batch.update(productRef, {
        quantity: newQuantity,
        averagePurchasePrice: selectedMovement.previousAveragePrice
      });

      // Удаляем запись о движении
      const movementRef = doc(db, 'productMovements', selectedMovement.id);
      batch.delete(movementRef);

      await batch.commit();
      showSuccessNotification('Операция успешно удалена');
    } catch (error) {
      console.error('Error deleting movement:', error);
      showErrorNotification('Ошибка при удалении операции');
    } finally {
      setShowPasswordPrompt(false);
      setSelectedMovement(null);
      setSwipedMovementId(null);
    }
  };

  const handleDeleteClick = (movement: Movement) => {
    setSelectedMovement(movement);
    setShowPasswordPrompt(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4" style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">История операций</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 85px)' }}>
          <div className="mb-6">
            <h3 className="font-medium text-gray-900">{product.name}</h3>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Текущий остаток</p>
                <p className="text-lg font-medium text-gray-900">{product.quantity} {product.unit}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Средняя цена</p>
                <p className="text-lg font-medium text-gray-900">{formatAmount(product.averagePurchasePrice || 0)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Общая стоимость</p>
                <p className="text-lg font-medium text-gray-900">{formatAmount((product.quantity || 0) * (product.averagePurchasePrice || 0))}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              История операций пуста
            </div>
          ) : (
            <div className="space-y-4">
              {movements.map((record) => (
                <div className="relative overflow-hidden"
                  key={record.id}
                  {...swipeHandlers}
                  data-movement-id={record.id}
                >
                  <div 
                    className={`absolute inset-y-0 right-0 w-16 bg-red-500 flex items-center justify-center transition-opacity duration-200 ${
                      swipedMovementId === record.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <button
                      onClick={() => handleDeleteClick(record)}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  
                  <div 
                    className={`bg-white border rounded-lg p-4 hover:shadow-sm transition-all transform ${
                      swipedMovementId === record.id ? '-translate-x-16' : 'translate-x-0'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {record.type === 'in' ? 'Приход' : 'Расход'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {record.description}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Склад: {record.warehouse}
                      </p>
                      {record.supplier && (
                        <p className="text-sm text-gray-500 mt-1">
                          Поставщик: {record.supplier}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(record.date)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 bg-gray-50 p-3 rounded-lg">
                      <p className={`font-medium ${
                        record.type === 'in' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {record.type === 'in' ? '+' : '-'} {record.quantity} {product.unit}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatAmount(record.price)} / {product.unit}
                      </p>
                      <p className="text-sm text-gray-600">
                        Итого: {formatAmount(record.totalPrice)}
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Остаток:</p>
                        <p className="text-sm font-medium">
                        Остаток: {record.previousQuantity} → {record.newQuantity} {product.unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Средняя цена:</p>
                        <p className="text-sm font-medium">
                        Средняя цена: {formatAmount(record.previousAveragePrice)} → {formatAmount(record.newAveragePrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {showPasswordPrompt && (
        <PasswordPrompt
          isOpen={showPasswordPrompt}
          onClose={() => {
            setShowPasswordPrompt(false);
            setSelectedMovement(null);
          }}
          onSuccess={() => handleDelete(true)}
        />
      )}
    </div>
  );
};
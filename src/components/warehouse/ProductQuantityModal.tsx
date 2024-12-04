import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Product } from '../../types/product';

interface ProductQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  product: Product;
  mode?: 'income' | 'expense';
}

export const ProductQuantityModal: React.FC<ProductQuantityModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  product,
  mode = 'expense'
}) => {
  const [quantity, setQuantity] = useState('1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = parseInt(quantity);
    if (numQuantity > 0 && (mode === 'income' || numQuantity <= (product.quantity || 0))) {
      onConfirm(numQuantity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xs mx-4 rounded-lg">
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-4">
            {mode === 'expense' && `На складе: ${product.quantity} ${product.unit}`}
          </p>
          
          <div className="relative">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-lg text-center"
              min="1"
              max={mode === 'expense' ? product.quantity : undefined}
              required
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2">
              <Calculator className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600"
            >
              ОТМЕНА
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 text-emerald-600 font-medium"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
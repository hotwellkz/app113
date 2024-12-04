import React, { useState } from 'react';
import { X, FolderInput, Activity, Database, Trash2, PackagePlus, PackageMinus } from 'lucide-react';
import { Product } from '../../types/product';
import { MoveFolderModal } from './MoveFolderModal';
import { ProductMovementModal } from './ProductMovementModal';
import { ProductStockModal } from './ProductStockModal';
import { DeleteProductModal } from './DeleteProductModal';
import { ProductQuantityModal } from './ProductQuantityModal';
import { useNavigate } from 'react-router-dom';

interface ProductActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ProductActionsModal: React.FC<ProductActionsModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const navigate = useNavigate();
  const [showMoveFolder, setShowMoveFolder] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showExpenseQuantity, setShowExpenseQuantity] = useState(false);
  const [showIncomeQuantity, setShowIncomeQuantity] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  if (!isOpen) return null;

  const handleExpenseQuantityConfirm = (quantity: number) => {
    navigate('/warehouse/expense/new', {
      state: {
        addedProduct: {
          product,
          quantity
        }
      }
    });
    onClose();
  };

  const handleIncomeQuantityConfirm = (quantity: number) => {
    navigate('/warehouse/income/new', {
      state: {
        addedProduct: {
          product,
          quantity: quantity
        }
      }
    });
    onClose();
  };

  const actions = [
    {
      icon: <PackageMinus className="w-5 h-5" />,
      label: 'Добавить в расход',
      onClick: () => setShowExpenseQuantity(true),
      color: 'text-red-600'
    },
    {
      icon: <PackagePlus className="w-5 h-5" />,
      label: 'Добавить в приход',
      onClick: () => setShowIncomeQuantity(true),
      color: 'text-emerald-600'
    },
    {
      icon: <FolderInput className="w-5 h-5" />,
      label: 'Переместить в папку',
      onClick: () => setShowMoveFolder(true),
      color: 'text-blue-600'
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: 'Движение товара',
      onClick: () => setShowMovement(true),
      color: 'text-emerald-600'
    },
    {
      icon: <Database className="w-5 h-5" />,
      label: 'Наличие на складах',
      onClick: () => setShowStock(true),
      color: 'text-amber-600'
    },
    {
      icon: <Trash2 className="w-5 h-5" />,
      label: 'Удалить',
      onClick: () => setShowDelete(true),
      color: 'text-red-600'
    }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-sm mx-4">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-medium">{product.name}</h2>
            <button onClick={onClose}>
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-4">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="w-full flex items-center px-4 py-3 hover:bg-gray-50 rounded-lg mb-2 last:mb-0"
              >
                <span className={`${action.color} mr-3`}>{action.icon}</span>
                <span className="text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <MoveFolderModal
        isOpen={showMoveFolder}
        onClose={() => setShowMoveFolder(false)}
        product={product}
      />

      <ProductMovementModal
        isOpen={showMovement}
        onClose={() => setShowMovement(false)}
        product={product}
      />

      <ProductStockModal
        isOpen={showStock}
        onClose={() => setShowStock(false)}
        product={product}
      />

      <DeleteProductModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        product={product}
      />

      <ProductQuantityModal
        isOpen={showExpenseQuantity}
        onClose={() => setShowExpenseQuantity(false)}
        onConfirm={handleExpenseQuantityConfirm}
        product={product}
        mode="expense"
      />

      <ProductQuantityModal
        isOpen={showIncomeQuantity}
        onClose={() => setShowIncomeQuantity(false)}
        onConfirm={handleIncomeQuantityConfirm}
        product={product}
        mode="income"
      />
    </>
  );
};
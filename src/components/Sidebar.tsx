import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  ArrowLeftRight, 
  ScrollText, 
  Receipt, 
  FileText,
  Users,
  Menu,
  X,
  Package,
  Building2,
  Calculator,
  MessageCircle,
  Warehouse
} from 'lucide-react';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive?: boolean;
}

interface SidebarProps {
  onPageChange: (page: 'dashboard' | 'transactions' | 'feed' | 'daily-report' | 'clients' | 'templates' | 'products' | 'employees' | 'projects' | 'calculator' | 'chat' | 'warehouse') => void;
  currentPage: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onPageChange, currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { 
      icon: <ArrowLeftRight className="w-5 h-5" />, 
      label: 'Транзакции', 
      path: '/',
      isActive: location.pathname === '/'
    },
    { 
      icon: <Users className="w-5 h-5" />, 
      label: 'Клиенты', 
      path: '/clients',
      isActive: location.pathname === '/clients'
    },
    { 
      icon: <LayoutDashboard className="w-5 h-5" />, 
      label: 'Панель управления',
      path: '/dashboard',
      isActive: location.pathname === '/dashboard'
    },
    { 
      icon: <FileText className="w-5 h-5" />, 
      label: 'Шаблоны договоров', 
      path: '/templates',
      isActive: location.pathname === '/templates'
    },
    { 
      icon: <Package className="w-5 h-5" />, 
      label: 'Товары и цены', 
      path: '/products',
      isActive: location.pathname === '/products'
    },
    { 
      icon: <Users className="w-5 h-5" />, 
      label: 'Сотрудники', 
      path: '/employees',
      isActive: location.pathname === '/employees'
    },
    { 
      icon: <Building2 className="w-5 h-5" />, 
      label: 'Проекты', 
      path: '/projects',
      isActive: location.pathname === '/projects'
    },
    { 
      icon: <Calculator className="w-5 h-5" />, 
      label: 'Калькулятор', 
      path: '/calculator',
      isActive: location.pathname === '/calculator'
    },
    { 
      icon: <MessageCircle className="w-5 h-5" />, 
      label: 'Чат', 
      path: '/chat',
      isActive: location.pathname === '/chat'
    },
    { 
      icon: <Warehouse className="w-5 h-5" />, 
      label: 'Склад', 
      path: '/warehouse',
      isActive: location.pathname === '/warehouse'
    }
  ];

  const handleMenuItemClick = (item: MenuItem) => {
    navigate(item.path);
    onPageChange(item.path.replace('/', '') || 'dashboard');
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-[60] lg:hidden bg-white p-2 rounded-lg shadow-lg mt-2"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[45] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-[50] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-20 lg:h-0" />
          
          <div className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item)}
                className={`w-full flex items-center px-6 py-3 text-gray-700 transition-colors ${
                  item.isActive 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <span className={item.isActive ? 'text-emerald-600' : 'text-emerald-500'}>
                  {item.icon}
                </span>
                <span className="ml-3 text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
          
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center text-sm text-gray-500">
              <span>
                Сегодня, {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
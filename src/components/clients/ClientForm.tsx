import React from 'react';
import { NewClient } from '../../types/client';

interface ClientFormProps {
  client: NewClient;
  onChange: (updates: Partial<NewClient>) => void;
  yearOptions: number[];
  isEditMode?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onChange,
  yearOptions,
  isEditMode = false
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Статус клиента
          </label>
          <select
            value={client.status}
            onChange={(e) => onChange({ status: e.target.value as 'building' | 'deposit' })}
            className="mt-2 block w-full px-4 py-3 text-base rounded-lg border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white"
          >
            <option value="deposit">Задаток</option>
            <option value="building">Строим</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Имя *
          </label>
          <input
            type="text"
            name="firstName"
            value={client.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="mt-2 block w-full px-4 py-3 text-base rounded-lg border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white"
            placeholder="Введите имя клиента"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название объекта
          </label>
          <input
            type="text"
            name="objectName"
            value={client.objectName}
            onChange={(e) => onChange({ objectName: e.target.value })}
            className="mt-2 block w-full px-4 py-3 text-base rounded-lg border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white"
            placeholder="Введите название объекта (необязательно)"
          />
        </div>
      </div>
    </div>
  );
};
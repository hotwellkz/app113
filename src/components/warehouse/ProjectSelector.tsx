import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Project {
  id: string;
  title: string;
}

interface ProjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ value, onChange }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Сначала получаем все категории проектов
        const q = query(collection(db, 'categories'), where('row', '==', 3));
        
        const snapshot = await getDocs(q);
        const projectsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            title: doc.data().title,
            isVisible: doc.data().isVisible
          }))
          // Фильтруем скрытые проекты на клиенте
          .filter(project => project.isVisible !== false)
          .sort((a, b) => a.title.localeCompare(b.title));
        
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
        loading ? 'bg-gray-50' : 'bg-white'
      }`}
      disabled={loading}
    >
      <option value="">{loading ? 'Загрузка проектов...' : 'Выберите проект'}</option>
      {projects.map(project => (
        <option key={project.id} value={project.id}>
          {project.title}
        </option>
      ))}
    </select>
  );
};
import { useQuery } from 'react-query';
import api from '../services/api';
import { ExternalLink, Plus } from 'lucide-react';
import { useState } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';

const ResourcesPage = () => {
  const user = authService.getCurrentUser();
  const { data, isLoading } = useQuery('resources', async () => {
    const res = await api.get('/resources');
    return res.data.data;
  });

  const canManage = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole);

  const resourceTypes = [
    'Sitemap Documents',
    'Content Folders',
    'Design Assets',
    'Development Handoff Files',
    'QA Checklists',
    'Templates',
    'Libraries',
  ];

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
        {canManage && (
          <button className="btn btn-primary inline-flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Resource
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data && data.length > 0 ? (
          data.map((resource: any) => (
            <div key={resource.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                  {resource.type}
                </span>
              </div>
              {resource.description && (
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
              )}
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Access via Drive
                </a>
              )}
              {resource.project && (
                <p className="text-xs text-gray-500 mt-2">Project: {resource.project.name}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No resources found</p>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;


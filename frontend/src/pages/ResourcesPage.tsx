import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { ExternalLink, Plus, Edit, Trash2, X, Save, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';

const ResourcesPage = () => {
  const user = authService.getCurrentUser();
  const queryClient = useQueryClient();
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  const { data, isLoading } = useQuery('resources', async () => {
    const res = await api.get('/resources');
    return res.data.data;
  });

  const { data: projects } = useQuery('projects-for-resources', async () => {
    const res = await api.get('/projects');
    return res.data.data || [];
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

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/resources/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Resource deleted successfully');
        queryClient.invalidateQueries('resources');
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to delete resource';
        toast.error(errorMessage);
      },
    }
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Resources' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
          <p className="mt-1 text-sm text-gray-500">Access and manage project resources and documents</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditingResource(null);
              setResourceModalOpen(true);
            }}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Resource
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
          <p className="text-gray-500">Loading resources...</p>
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((resource: any) => (
            <div key={resource.id} className="card hover:shadow-lg transition-all duration-200 hover:border-primary-300 relative group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                    {resource.type}
                  </span>
                  {canManage && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingResource(resource);
                          setResourceModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit resource"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Delete Resource',
                            message: `Are you sure you want to delete "${resource.title}"? This action cannot be undone.`,
                            type: 'danger',
                            onConfirm: () => {
                              deleteMutation.mutate(resource.id);
                              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                            },
                          });
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {resource.description && (
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
              )}
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Access Resource
                </a>
              )}
              {resource.project && (
                <p className="text-xs text-gray-500 mt-2">Project: <span className="font-medium">{resource.project.name}</span></p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No resources found</h3>
          <p className="text-sm text-gray-500 mb-6">Get started by adding your first resource</p>
          {canManage && (
            <button
              onClick={() => {
                setEditingResource(null);
                setResourceModalOpen(true);
              }}
              className="btn btn-primary inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Resource
            </button>
          )}
        </div>
      )}

      {resourceModalOpen && (
        <ResourceModal
          resource={editingResource}
          projects={projects}
          resourceTypes={resourceTypes}
          onClose={() => {
            setResourceModalOpen(false);
            setEditingResource(null);
          }}
        />
      )}
    </div>
  );
};

// Resource Modal Component
const ResourceModal = ({ resource, projects, resourceTypes, onClose }: { resource: any; projects: any[]; resourceTypes: string[]; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: resource?.name || '',
    description: resource?.description || '',
    type: resource?.type || resourceTypes[0],
    url: resource?.url || '',
    accessLevel: resource?.accessLevel || 'Team',
    projectId: resource?.projectId || '',
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/resources', data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Resource created successfully');
        queryClient.invalidateQueries('resources');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create resource');
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const res = await api.patch(`/resources/${resource.id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Resource updated successfully');
        queryClient.invalidateQueries('resources');
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to update resource';
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      projectId: formData.projectId || null,
    };
    if (resource) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{resource ? 'Edit Resource' : 'Add New Resource'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
            >
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="input"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="input"
            >
              <option value="">No Project (Global Resource)</option>
              {projects?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
            <select
              value={formData.accessLevel}
              onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
              className="input"
            >
              <option value="Team">Team</option>
              <option value="Public">Public</option>
              <option value="Restricted">Restricted</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : resource ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourcesPage;


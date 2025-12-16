import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Mail,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Search,
  Send,
  FileText,
  Tag,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const EmailMasterPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [testEmailModal, setTestEmailModal] = useState<{ isOpen: boolean; templateId: string | null }>({
    isOpen: false,
    templateId: null,
  });
  const queryClient = useQueryClient();
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

  const { data: templates, isLoading } = useQuery('email-templates', async () => {
    const res = await api.get('/email-templates');
    return res.data.data || [];
  });

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/email-templates/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Email template deleted successfully');
        queryClient.invalidateQueries('email-templates');
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to delete template';
        toast.error(errorMessage);
      },
    }
  );

  const filteredTemplates = templates?.filter((t: any) => {
    const matchesSearch =
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = Array.from(new Set(templates?.map((t: any) => t.category).filter(Boolean) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-6 h-6 text-indigo-600" />
              Email Master
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage all email templates for system notifications and communications
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input pr-8"
              >
                <option value="">All Categories</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Tag className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No email templates found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template: any) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                      {template.category}
                    </span>
                    {template.isActive ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTestEmailModal({ isOpen: true, templateId: template.id });
                    }}
                    className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                    title="Send Test Email"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                    title="Edit Template"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Delete Email Template',
                        message: `Are you sure you want to permanently delete "${template.name}"? This action cannot be undone.`,
                        type: 'danger',
                        onConfirm: () => {
                          deleteMutation.mutate(template.id);
                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        },
                      });
                    }}
                    className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Subject:</p>
                  <p className="text-sm text-gray-600">{template.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Body Preview:</p>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {template.body?.substring(0, 150)}...
                  </p>
                </div>
                {template.variables && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Variables:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.keys(template.variables).map((key) => (
                        <span
                          key={key}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {`{{${key}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Modal */}
      {isModalOpen && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Test Email Modal */}
      {testEmailModal.isOpen && (
        <TestEmailModal
          templateId={testEmailModal.templateId}
          onClose={() => setTestEmailModal({ isOpen: false, templateId: null })}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

// Template Modal Component
const TemplateModal = ({ template, onClose }: { template: any; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    body: template?.body || '',
    bodyHtml: template?.bodyHtml || '',
    category: template?.category || '',
    variables: template?.variables ? JSON.stringify(template.variables, null, 2) : '',
    isActive: template?.isActive !== undefined ? template.isActive : true,
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/email-templates', data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Email template created successfully');
        queryClient.invalidateQueries('email-templates');
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to create template';
        toast.error(errorMessage);
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const res = await api.patch(`/email-templates/${template.id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Email template updated successfully');
        queryClient.invalidateQueries('email-templates');
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to update template';
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let variables = null;
    if (formData.variables.trim()) {
      try {
        variables = JSON.parse(formData.variables);
      } catch (error) {
        toast.error('Invalid JSON format for variables');
        return;
      }
    }

    const submitData = {
      ...formData,
      variables,
    };

    if (template) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {template ? 'Edit Email Template' : 'Add New Email Template'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Welcome Email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                placeholder="e.g., WELCOME, TIMESHEET_APPROVED"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="input"
              placeholder="Email subject line"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body (Text) <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="input"
              rows={6}
              placeholder="Plain text email body. Use {{variableName}} for variables."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body (HTML) <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <textarea
              value={formData.bodyHtml}
              onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
              className="input font-mono text-sm"
              rows={8}
              placeholder="HTML email body. Use {{variableName}} for variables."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variables (JSON) <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <textarea
              value={formData.variables}
              onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
              className="input font-mono text-sm"
              rows={4}
              placeholder='{"userName": "User Name", "projectName": "Project Name"}'
            />
            <p className="mt-1 text-xs text-gray-500">
              Define available variables as JSON. Use these variables in the body with {'{{variableName}}'} syntax.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.isActive ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              className="input"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
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
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : template ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Test Email Modal Component
const TestEmailModal = ({ templateId, onClose }: { templateId: string | null; onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [variables, setVariables] = useState('');
  const queryClient = useQueryClient();

  const { data: template } = useQuery(
    ['email-template', templateId],
    async () => {
      if (!templateId) return null;
      const res = await api.get(`/email-templates/${templateId}`);
      return res.data.data;
    },
    { enabled: !!templateId }
  );

  const sendTestMutation = useMutation(
    async (data: any) => {
      const res = await api.post(`/email-templates/${templateId}/send-test`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Test email sent successfully');
        queryClient.invalidateQueries('email-templates');
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to send test email';
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let vars = {};
    if (variables.trim()) {
      try {
        vars = JSON.parse(variables);
      } catch (error) {
        toast.error('Invalid JSON format for variables');
        return;
      }
    }

    sendTestMutation.mutate({
      to: email,
      variables: vars,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Send Test Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template
            </label>
            <input
              type="text"
              value={template?.name || ''}
              disabled
              className="input bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variables (JSON) <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <textarea
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              className="input font-mono text-sm"
              rows={6}
              placeholder='{"userName": "John Doe", "projectName": "Project Alpha"}'
            />
            {template?.variables && (
              <p className="mt-1 text-xs text-gray-500">
                Available variables: {Object.keys(template.variables).join(', ')}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
              disabled={sendTestMutation.isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendTestMutation.isLoading ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailMasterPage;



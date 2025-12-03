import { useQuery } from 'react-query';
import api from '../services/api';
import { Plus, Clock } from 'lucide-react';
import { useState } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';
import toast from 'react-hot-toast';

const TimesheetsPage = () => {
  const user = authService.getCurrentUser();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
  });

  const { data, refetch } = useQuery('timesheets', async () => {
    const res = await api.get('/timesheets');
    return res.data.data;
  });

  const { data: projectsData } = useQuery('projects-for-timesheets', async () => {
    const res = await api.get('/projects');
    return res.data.data;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/timesheets', {
        ...formData,
        hours: parseFloat(formData.hours),
      });
      toast.success('Timesheet created successfully');
      setShowModal(false);
      setFormData({
        projectId: '',
        date: new Date().toISOString().split('T')[0],
        hours: '',
        description: '',
      });
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create timesheet');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/timesheets/${id}/approve`);
      toast.success('Timesheet approved');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve timesheet');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      try {
        await api.post(`/timesheets/${id}/reject`, { reason });
        toast.success('Timesheet rejected');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to reject timesheet');
      }
    }
  };

  const canApprove = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Timesheets</h1>
        {user?.role !== UserRole.CLIENT && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary inline-flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Log Time
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Log Time</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  required
                  className="input"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                >
                  <option value="">Select project</option>
                  {projectsData?.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  className="input"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        {data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  {canApprove && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((timesheet: any) => (
                  <tr key={timesheet.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(timesheet.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timesheet.project?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{timesheet.hours}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${timesheet.cost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          timesheet.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : timesheet.status === 'SUBMITTED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : timesheet.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {timesheet.status}
                      </span>
                    </td>
                    {canApprove && timesheet.status === 'SUBMITTED' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleApprove(timesheet.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(timesheet.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Reject
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No timesheets found</p>
        )}
      </div>
    </div>
  );
};

export default TimesheetsPage;


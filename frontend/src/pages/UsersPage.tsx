import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, ExternalLink } from 'lucide-react';
import { roleLabels } from '../utils/roles';
import { useState } from 'react';

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery('users', async () => {
    const res = await api.get('/users');
    return res.data.data;
  });

  const filteredUsers = data?.filter((user: any) => {
    const matchesSearch = !searchTerm || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage users. Use Master Management for full CRUD operations.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/master-management?tab=employees"
            className="btn btn-secondary inline-flex items-center text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Master Management
          </Link>
          <Link
            to="/master-management?tab=employees"
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            New User
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            className="input w-full sm:w-48"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="TEAM_MEMBER">Team Member</option>
            <option value="CLIENT">Client</option>
          </select>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.department?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to="/master-management?tab=employees"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length < (data?.length || 0) && (
              <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                Showing {filteredUsers.length} of {data?.length || 0} users
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm || roleFilter ? 'No users match your filters' : 'No users found'}
            </p>
            {searchTerm || roleFilter && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                }}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;


import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const DepartmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading } = useQuery('departments', async () => {
    const res = await api.get('/departments');
    return res.data.data;
  });

  const filteredDepartments = data?.filter((dept: any) =>
    !searchTerm || dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">View departments. Use Master Management for full CRUD operations.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/master-management?tab=departments"
            className="btn btn-secondary inline-flex items-center text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Master Management
          </Link>
          <Link
            to="/master-management?tab=departments"
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Department
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Loading departments...</p>
          </div>
        ) : filteredDepartments.length > 0 ? (
          filteredDepartments.map((department: any) => (
            <div key={department.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                <Link
                  to="/master-management?tab=departments"
                  className="text-indigo-600 hover:text-indigo-900 text-sm"
                >
                  Manage →
                </Link>
              </div>
              {department.head && (
                <p className="text-sm text-gray-600 mb-2">
                  Head: {department.head.firstName} {department.head.lastName}
                </p>
              )}
              <div className="flex gap-4 text-sm text-gray-500 mt-2">
                <span>{department._count?.members || 0} members</span>
                <span>{department._count?.projects || 0} projects</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'No departments match your search' : 'No departments found'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
      {filteredDepartments.length < (data?.length || 0) && filteredDepartments.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredDepartments.length} of {data?.length || 0} departments
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;


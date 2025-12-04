import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Search, ExternalLink, Building, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';

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
      <Breadcrumbs items={[{ label: 'Departments' }]} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">
            View departments. For full management (create, edit, delete), use{' '}
            <Link to="/master-management?tab=departments" className="text-primary-600 hover:text-primary-700 font-medium underline">
              Master Management
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/master-management?tab=departments"
            className="btn btn-primary inline-flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Manage Departments
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
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
            <p className="text-gray-500">Loading departments...</p>
          </div>
        ) : filteredDepartments.length > 0 ? (
          filteredDepartments.map((department: any) => (
            <div key={department.id} className="card hover:shadow-lg transition-all duration-200 hover:border-primary-300">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                <Link
                  to="/master-management?tab=departments"
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Manage →
                </Link>
              </div>
              {department.head && (
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Head:</span> {department.head.firstName} {department.head.lastName}
                </p>
              )}
              <div className="flex gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-gray-700">{department._count?.members || 0}</span>
                  <span>members</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium text-gray-700">{department._count?.projects || 0}</span>
                  <span>projects</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {searchTerm ? 'No departments match your search' : 'No departments found'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search criteria' 
                : 'Get started by creating a new department'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="btn btn-secondary text-sm"
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


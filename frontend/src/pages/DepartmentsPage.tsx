import { useQuery } from 'react-query';
import api from '../services/api';
import { Plus } from 'lucide-react';

const DepartmentsPage = () => {
  const { data, isLoading } = useQuery('departments', async () => {
    const res = await api.get('/departments');
    return res.data.data;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
        <button className="btn btn-primary inline-flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          New Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : data && data.length > 0 ? (
          data.map((department: any) => (
            <div key={department.id} className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{department.name}</h3>
              {department.head && (
                <p className="text-sm text-gray-600">
                  Head: {department.head.firstName} {department.head.lastName}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {department._count?.members || 0} members, {department._count?.projects || 0} projects
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No departments found</p>
        )}
      </div>
    </div>
  );
};

export default DepartmentsPage;


import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../services/api';
import { BarChart3 } from 'lucide-react';

const ReportsPage = () => {
  const [reportType, setReportType] = useState<'budget' | 'department'>('budget');

  const { data: budgetReport } = useQuery(
    'budget-report',
    async () => {
      const res = await api.get('/reports/budget');
      return res.data.data;
    },
    { enabled: reportType === 'budget' }
  );

  const { data: departmentReport } = useQuery(
    'department-report',
    async () => {
      const res = await api.get('/reports/department');
      return res.data.data;
    },
    { enabled: reportType === 'department' }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Reports</h1>

      <div className="card">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setReportType('budget')}
            className={`btn ${reportType === 'budget' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Budget Report
          </button>
          <button
            onClick={() => setReportType('department')}
            className={`btn ${reportType === 'department' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Department Report
          </button>
        </div>

        {reportType === 'budget' && budgetReport && (
          <div>
            <h2 className="text-xl font-bold mb-4">Budget Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-2xl font-bold">${budgetReport.summary.totalBudget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold">${budgetReport.summary.totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Over Budget</p>
                <p className="text-2xl font-bold text-red-600">{budgetReport.summary.overBudgetCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">At Risk</p>
                <p className="text-2xl font-bold text-yellow-600">{budgetReport.summary.atRiskCount}</p>
              </div>
            </div>
          </div>
        )}

        {reportType === 'department' && departmentReport && (
          <div>
            <h2 className="text-xl font-bold mb-4">Department Overview</h2>
            <p className="text-gray-500">Department report data will be displayed here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;


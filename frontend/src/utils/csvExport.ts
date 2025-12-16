/**
 * CSV Export Utility
 * Helper functions to export data to CSV format
 */

export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from data if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV content
  let csvContent = csvHeaders.join(',') + '\n';

  data.forEach((row) => {
    const values = csvHeaders.map((header) => {
      const value = row[header];
      // Handle nested objects and arrays
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value);
      return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
        ? `"${stringValue.replace(/"/g, '""')}"`
        : stringValue;
    });
    csvContent += values.join(',') + '\n';
  });

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportReportsToCSV(reportData: any, reportType: string) {
  if (!reportData) {
    alert('No report data available');
    return;
  }

  let data: any[] = [];
  let filename = '';

  if (reportType === 'budget' && reportData.projects) {
    data = reportData.projects.map((project: any) => ({
      'Project Code': project.code,
      'Project Name': project.name,
      'Budget': project.budget || 0,
      'Spent': project.totalCost || 0,
      'Remaining': (project.budget || 0) - (project.totalCost || 0),
      'Utilization %': project.budget ? (((project.totalCost || 0) / project.budget) * 100).toFixed(2) : 0,
      'Status': project.status,
      'Customer': project.customer?.name || 'N/A',
    }));
    filename = 'budget_report';
  } else if (reportType === 'department' && reportData.departments) {
    data = reportData.departments.map((dept: any) => ({
      'Department': dept.name,
      'Total Projects': dept.projectCount || 0,
      'Total Budget': dept.totalBudget || 0,
      'Total Spent': dept.totalSpent || 0,
      'Head': dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : 'N/A',
    }));
    filename = 'department_report';
  }

  if (data.length > 0) {
    exportToCSV(data, filename);
  }
}





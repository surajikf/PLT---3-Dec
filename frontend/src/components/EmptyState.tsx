import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

const EmptyState = ({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <Icon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className="btn btn-primary inline-flex items-center"
          >
            {action.icon && <action.icon className="w-4 h-4 mr-2" />}
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;






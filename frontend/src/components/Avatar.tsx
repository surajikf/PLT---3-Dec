import { User } from 'lucide-react';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  profilePicture?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const Avatar = ({ 
  firstName = '', 
  lastName = '', 
  profilePicture, 
  size = 'md',
  className = '',
  showTooltip = false
}: AvatarProps) => {
  const getInitials = () => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  const getBackgroundColor = () => {
    // Generate consistent color based on name
    const name = `${firstName}${lastName}`;
    if (!name) return 'bg-gray-400';
    
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const sizeClass = sizeClasses[size];
  const bgColor = getBackgroundColor();
  const initials = getInitials();
  const hasPicture = profilePicture && profilePicture.trim() !== '';

  const avatarContent = hasPicture ? (
    <img
      src={profilePicture || undefined}
      alt={`${firstName} ${lastName}`}
      className="w-full h-full object-cover rounded-full"
      onError={(e) => {
        // Fallback to initials if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = `<span class="flex items-center justify-center w-full h-full font-semibold text-white">${initials}</span>`;
        }
      }}
    />
  ) : (
    <span className={`flex items-center justify-center w-full h-full font-semibold text-white ${bgColor}`}>
      {initials}
    </span>
  );

  const tooltipText = showTooltip ? `${firstName} ${lastName}` : undefined;

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
      title={tooltipText}
    >
      {avatarContent}
    </div>
  );
};

export default Avatar;




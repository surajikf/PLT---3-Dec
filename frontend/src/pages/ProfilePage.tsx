import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { authService } from '../services/authService';
import { User, Lock, Save, X, Eye, EyeOff, Camera, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Avatar from '../components/Avatar';

const ProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch current user data
  const { data: userData, isLoading } = useQuery(
    'currentUser',
    async () => {
      const res = await api.get('/auth/me');
      return res.data.data;
    },
    {
      enabled: !!currentUser,
    }
  );

  // Profile update mutation
  const profileUpdateMutation = useMutation(
    async (data: { firstName: string; lastName: string; profilePicture?: string | null }) => {
      const res = await api.patch('/users/profile', data);
      return res.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Profile updated successfully');
        // Update local storage
        const updatedUser = { ...currentUser, ...data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        queryClient.invalidateQueries('currentUser');
        // Refresh page to update user in header
        window.location.reload();
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Failed to update profile';
        toast.error(errorMessage);
      },
    }
  );

  // Password change mutation
  const passwordChangeMutation = useMutation(
    async (data: { currentPassword: string; newPassword: string }) => {
      const res = await api.post('/users/change-password', data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        // Reset form
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Failed to change password';
        toast.error(errorMessage);
      },
    }
  );

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    profilePicture: null as string | null,
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update profile form when user data loads
  useEffect(() => {
    if (userData) {
      setProfileForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        profilePicture: userData.profilePicture || null,
      });
      setProfilePicturePreview(userData.profilePicture || null);
    }
  }, [userData]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    profileUpdateMutation.mutate({
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      profilePicture: profileForm.profilePicture,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileForm({ ...profileForm, profilePicture: base64String });
      setProfilePicturePreview(base64String);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () => {
    setProfileForm({ ...profileForm, profilePicture: null });
    setProfilePicturePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    passwordChangeMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Profile' }]} />
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Profile' }]} />
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile information and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 text-primary-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              <p className="text-sm text-gray-500">Update your personal information</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar
                    firstName={profileForm.firstName || userData?.firstName}
                    lastName={profileForm.lastName || userData?.lastName}
                    profilePicture={profilePicturePreview}
                    size="xl"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
                    title="Upload photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary text-sm inline-flex items-center justify-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {profilePicturePreview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {profilePicturePreview && (
                      <button
                        type="button"
                        onClick={handleRemovePicture}
                        className="btn btn-ghost text-sm text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove Photo
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG or GIF. Max size 5MB
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={userData?.email || ''}
                disabled
                className="input bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                required
                minLength={2}
                maxLength={100}
                className="input"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                required
                minLength={2}
                maxLength={100}
                className="input"
                placeholder="Enter your last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={userData?.role || ''}
                disabled
                className="input bg-gray-50 cursor-not-allowed"
              />
            </div>

            {userData?.department && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={userData.department.name}
                  disabled
                  className="input bg-gray-50 cursor-not-allowed"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={profileUpdateMutation.isLoading}
                className="btn btn-primary inline-flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {profileUpdateMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileForm({
                    firstName: userData?.firstName || '',
                    lastName: userData?.lastName || '',
                    profilePicture: userData?.profilePicture || null,
                  });
                  setProfilePicturePreview(userData?.profilePicture || null);
                }}
                className="btn btn-secondary inline-flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  className="input pr-10"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  className="input pr-10"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  className="input pr-10"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={passwordChangeMutation.isLoading}
                className="btn btn-primary inline-flex items-center"
              >
                <Lock className="w-4 h-4 mr-2" />
                {passwordChangeMutation.isLoading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                className="btn btn-secondary inline-flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;


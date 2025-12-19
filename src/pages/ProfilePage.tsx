import { useUser } from '@clerk/clerk-react';
import { useProfile, useUpdateProfile, useDatabaseUser } from '@/hooks';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user } = useUser();
  const { data: profile, isLoading } = useProfile();
  const { data: dbUser, isLoading: dbLoading } = useDatabaseUser();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(profile?.bio || '');

  const handleSave = async () => {
    if (!user) return;

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        data: { bio },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (isLoading || dbLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-40 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>

          {/* Profile Info */}
          <CardContent className="px-8 pb-8">
            {/* Avatar */}
            <div className="flex items-end -mt-20 mb-6">
              <Avatar className="w-40 h-40 border-8 border-white shadow-2xl">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User'} />
                <AvatarFallback className="text-4xl">{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="ml-8 mb-4">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {user?.fullName || 'User Name'}
                </h1>
                <p className="text-xl text-gray-600 mb-2">{user?.primaryEmailAddress?.emailAddress}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Active Member</Badge>
                </div>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-4 gap-6 py-6 bg-gray-50 rounded-xl">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">24</p>
                <p className="text-sm text-gray-600 font-medium">Projects</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">156</p>
                <p className="text-sm text-gray-600 font-medium">Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">89%</p>
                <p className="text-sm text-gray-600 font-medium">Completion</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">4.8</p>
                <p className="text-sm text-gray-600 font-medium">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Account Information</CardTitle>
            <CardDescription>Your account details and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <InfoRow label="User ID" value={user?.id || 'N/A'} />
              <InfoRow
                label="Email Address"
                value={user?.primaryEmailAddress?.emailAddress || 'N/A'}
              />
              <InfoRow
                label="Member Since"
                value={
                  user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'
                }
              />
              <InfoRow
                label="Last Sign In"
                value={
                  user?.lastSignInAt
                    ? new Date(user.lastSignInAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Bio Section */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row justify-between items-center space-y-0">
            <div>
              <CardTitle className="text-2xl">Professional Bio</CardTitle>
              <CardDescription>Tell others about your experience and expertise</CardDescription>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'secondary' : 'default'}
              size="sm"
            >
              {isEditing ? 'Cancel' : 'Edit Bio'}
            </Button>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={bio}
                  onChange={(flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Share your professional background, skills, and experience..."
                />
                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                    size="sm"
                  >
                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="min-h-[120px] flex items-center">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {profile?.bio || 'No bio added yet. Click "Edit Bio" to share your professional background and expertise.'}
                </p>
              </div>
            )}
          </CardContent>
        </Cardiv>
        </div>

        {/* Security Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-100">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-xl">
              🔐
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Enterprise-Grade Security
              </h3>
              <p className="text-gray-700 mb-4">
                Your account is protected by industry-leading security measures and authentication protocols.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Clerk Authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">JWT Token Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Session Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">API Protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-600 font-medium text-sm uppercase tracking-wide">{label}</span>
      <span className="text-gray-900 font-semibold text-right">{value}</span>
    </div>
  );
}

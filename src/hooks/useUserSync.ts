import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/client';

export interface DatabaseUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Hook to sync user to database after login
export const useUserSync = () => {
  const { user, isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const hasAttemptedSync = React.useRef(false);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/sync-user', {
        user: {
          id: user!.id,
          email_addresses: user!.emailAddresses,
          first_name: user!.firstName,
          last_name: user!.lastName,
          image_url: user!.imageUrl,
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ User synced to database:', data);
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('❌ Failed to sync user:', error);
      // Reset the flag on error so it can try again later if needed
      hasAttemptedSync.current = false;
    },
  });

  // Auto-sync when user signs in - only once per session
  React.useEffect(() => {
    if (isSignedIn && user && !hasAttemptedSync.current) {
      // Check if we already have user data in cache
      const cachedUser = queryClient.getQueryData(['user']);
      if (!cachedUser) {
        console.log('🔄 Auto-syncing user to database...');
        hasAttemptedSync.current = true;
        syncMutation.mutate();
      } else {
        // If we have cached user, mark as attempted to prevent future calls
        hasAttemptedSync.current = true;
      }
    }
  }, [isSignedIn, user?.id]); // Only depend on isSignedIn and user.id

  return {
    syncUser: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
  };
};

// Hook to get current user from database
export const useDatabaseUser = () => {
  const { user, isSignedIn } = useUser();

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await apiClient.post('/auth/me', {
        userId: user?.id
      });
      return response.data.user as DatabaseUser;
    },
    enabled: isSignedIn && !!user, // Only fetch if user is signed in
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
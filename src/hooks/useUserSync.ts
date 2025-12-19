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

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/sync-user');
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ User synced to database:', data);
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('❌ Failed to sync user:', error);
    },
  });

  // Auto-sync when user signs in
  React.useEffect(() => {
    if (isSignedIn && user && !syncMutation.isPending) {
      // Check if we already have user data in cache
      const cachedUser = queryClient.getQueryData(['user']);
      if (!cachedUser) {
        console.log('🔄 Auto-syncing user to database...');
        syncMutation.mutate();
      }
    }
  }, [isSignedIn, user, syncMutation, queryClient]);

  return {
    syncUser: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
  };
};

// Hook to get current user from database
export const useDatabaseUser = () => {
  const { isSignedIn } = useUser();

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data.user as DatabaseUser;
    },
    enabled: isSignedIn, // Only fetch if user is signed in
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
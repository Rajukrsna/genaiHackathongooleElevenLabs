import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import { ClerkProvider } from '@clerk/clerk-react';
// import { QueryClientProvider } from '@tanstack/react-query';
// import { queryClient } from './lib/queryClient';
import App from './App';
import './index.css';

// // Get Clerk publishable key from environment
// const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// if (!CLERK_PUBLISHABLE_KEY) {
//   throw new Error('Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file');
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}> */}
        <App />
      {/* </QueryClientProvider>
    </ClerkProvider> */}
  </StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: process.env.NODE_ENV === 'development' ? 0 : 5 * 60 * 1000, // 0 in dev, 5 minutes in production
      cacheTime: process.env.NODE_ENV === 'development' ? 0 : 10 * 60 * 1000, // 0 in dev, 10 minutes in production
      refetchOnWindowFocus: process.env.NODE_ENV === 'development' ? true : false, // Refetch on focus in dev
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 3, // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      networkMode: 'online', // Only retry when online
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        // Global error handling for mutations
        console.error('Mutation error:', error);
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>
);


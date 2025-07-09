/**
 * OAuth error page
 * Displayed when Google Calendar authentication fails
 */

'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'oauth_error':
        return 'There was an error with Google authentication. Please try again.';
      case 'missing_code':
        return 'Missing authorization code. Please restart the authentication process.';
      case 'token_exchange_failed':
        return 'Failed to exchange authorization code for access tokens.';
      default:
        return 'An unknown error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mb-4">
            <svg 
              className="mx-auto h-12 w-12 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Failed
          </h1>
          
          <p className="text-gray-600 mb-6">
            {getErrorMessage(error)}
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>Error Code:</strong> {error || 'unknown'}
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/api/auth/google'}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            
            <button 
              onClick={() => window.close()}
              className="w-full bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
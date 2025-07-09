/**
 * Calendar setup page
 * Allows admin to connect Google Calendar
 */

'use client';

import { useState, useEffect } from 'react';

export default function CalendarSetupPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check connection status on page load
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status');
      const data = await response.json();
      setConnectionStatus(data.connected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Google Calendar Setup
          </h1>
          
          {/* Connection Status */}
          <div className="mb-8">
            {connectionStatus === 'connected' ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-green-900">Google Calendar Connected!</span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Your WhatsApp AI can now book appointments directly in your calendar.
                </p>
              </div>
            ) : connectionStatus === 'disconnected' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-yellow-900">Calendar Not Connected</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  Connect your Google Calendar to enable automatic booking.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-semibold text-gray-900">Checking Connection...</span>
                </div>
              </div>
            )}

            <p className="text-gray-600 mb-4">
              Connect your Google Calendar to enable automatic booking from the WhatsApp AI system.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Automatic calendar event creation</li>
                <li>• Meeting link generation</li>
                <li>• Email invitations to customers</li>
                <li>• Time slot availability checking</li>
              </ul>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Before you start:</h3>
            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. Make sure you have a Google account</li>
              <li>2. Ensure you have calendar access permissions</li>
              <li>3. You&apos;ll be redirected to Google to authorize access</li>
            </ol>
          </div>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting || connectionStatus === 'connected'}
            className={`w-full flex items-center justify-center px-6 py-3 rounded-md text-white font-medium transition-colors ${
              isConnecting || connectionStatus === 'connected'
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {connectionStatus === 'connected' ? (
              'Already Connected'
            ) : isConnecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              'Connect Google Calendar'
            )}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By connecting, you authorize the WhatsApp AI to create calendar events on your behalf.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * OAuth success page
 * Displayed after successful Google Calendar authentication
 */

'use client';

export default function AuthSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mb-4">
            <svg 
              className="mx-auto h-12 w-12 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Calendar Connected!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your Google Calendar has been successfully connected to the WhatsApp AI system. 
            The AI can now book appointments directly in your calendar.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Next steps:</strong>
              <br />
              • Your WhatsApp AI can now book appointments
              • Customers will receive calendar invitations
              • Meeting links will be automatically generated
            </p>
          </div>
          
          <button 
            onClick={() => window.close()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
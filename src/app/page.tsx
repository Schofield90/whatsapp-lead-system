export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            WhatsApp Lead System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered WhatsApp lead qualification system using Supabase, Twilio, and Anthropic Claude
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">AI Training Center</h2>
              <p className="text-gray-700 mb-4">
                Train your AI with sales-focused questions. The AI asks you questions about sales techniques and learns from your expert answers.
              </p>
              <a 
                href="/train"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                🎓 Start Sales Training
              </a>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">SOP Management</h2>
              <p className="text-gray-700 mb-4">
                Add and manage your Standard Operating Procedures, sales scripts, and business processes directly.
              </p>
              <a 
                href="/sops"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
              >
                📋 Manage SOPs
              </a>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">WhatsApp Integration</span>
                <span className="text-green-600 font-medium">✅ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Knowledge Base</span>
                <span className="text-green-600 font-medium">✅ Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">AI Training</span>
                <span className="text-blue-600 font-medium">🎓 Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
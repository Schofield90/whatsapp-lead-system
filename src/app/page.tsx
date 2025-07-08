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
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">AI Training Center</h2>
            <p className="text-gray-700 mb-4">
              Train your WhatsApp AI by answering questions about your gym business. 
              The AI will ask you questions and learn from your expert answers.
            </p>
            <a 
              href="/train"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              🎓 Start Training Session
            </a>
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
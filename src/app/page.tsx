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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="text-gray-700">
              This is a fresh Next.js 15 project ready for development. 
              Configure your environment variables and start building your WhatsApp AI sales agent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
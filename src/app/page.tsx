export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Simple WhatsApp AI Bot</h1>
        <p className="text-gray-600 mb-8">Phase 1: Basic AI responses only</p>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-green-800">✅ Webhook endpoint: /api/simple-chatbot</p>
          <p className="text-green-800">✅ No authentication required</p>
          <p className="text-green-800">✅ Simple AI responses</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

export default function FixCalendarPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const createCalendarTable = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-calendar-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Fix Calendar Database</h1>
      
      <button
        onClick={createCalendarTable}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Calendar Config Table'}
      </button>

      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
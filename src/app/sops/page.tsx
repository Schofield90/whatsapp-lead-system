'use client';

import { useState, useEffect } from 'react';

interface SOPEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export default function SOPsPage() {
  // State management
  const [sops, setSops] = useState<SOPEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  // Form state
  const [newSOP, setNewSOP] = useState({
    title: '',
    content: '',
    category: 'sop'
  });

  // SOP categories
  const categories = [
    { value: 'sop', label: 'Standard Operating Procedure' },
    { value: 'sales', label: 'Sales Process' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'policies', label: 'Policies & Rules' },
    { value: 'training', label: 'Training Materials' }
  ];

  // Load existing SOPs
  const loadSOPs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/knowledge?type=sop,sales,policies');
      const data = await response.json();
      
      if (data.success) {
        // Format SOPs for display
        const formattedSOPs = data.data.map((item: any) => ({
          id: item.id,
          title: extractTitle(item.content),
          content: item.content,
          category: item.type,
          created_at: item.created_at
        }));
        setSops(formattedSOPs);
      }
    } catch (error) {
      console.error('Error loading SOPs:', error);
      setFeedback('Error loading SOPs. Please refresh the page.');
    }
    setIsLoading(false);
  };

  // Extract title from content (first line or first sentence)
  const extractTitle = (content: string): string => {
    const firstLine = content.split('\n')[0];
    if (firstLine.length > 60) {
      return firstLine.substring(0, 60) + '...';
    }
    return firstLine || 'Untitled SOP';
  };

  // Add new SOP
  const addSOP = async () => {
    if (!newSOP.title.trim() || !newSOP.content.trim()) {
      setFeedback('Please provide both title and content for the SOP.');
      return;
    }

    setIsLoading(true);
    setFeedback('');

    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newSOP.category,
          content: `${newSOP.title}\n\n${newSOP.content}`
        })
      });

      const data = await response.json();

      if (data.success) {
        setFeedback('✅ SOP added successfully!');
        setNewSOP({ title: '', content: '', category: 'sop' });
        setShowAddForm(false);
        loadSOPs(); // Reload the list
      } else {
        // Display detailed error information
        console.error('API Error Response:', data);
        
        let errorMessage = `Error adding SOP: ${data.error}`;
        
        if (data.details) {
          // Add specific error details if available
          if (data.details.message) {
            errorMessage += `\n${data.details.message}`;
          }
          if (data.details.hint) {
            errorMessage += `\n\nHint: ${data.details.hint}`;
          }
          if (data.details.type === 'INVALID_ENV_VARS') {
            errorMessage += '\n\n⚠️ Your environment variables contain placeholder values. Please update your .env.local file with actual Supabase credentials.';
          }
          if (data.details.missing) {
            errorMessage += `\n\nMissing: ${data.details.missing.join(', ')}`;
          }
        }
        
        setFeedback(errorMessage);
      }
    } catch (error) {
      setFeedback('Network error. Please try again.');
      console.error('Error adding SOP:', error);
    }

    setIsLoading(false);
  };

  // Load SOPs on component mount
  useEffect(() => {
    loadSOPs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📋 SOP Management
            </h1>
            <p className="text-xl text-gray-600">
              Manage your Standard Operating Procedures and Sales Processes
            </p>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            {showAddForm ? 'Cancel' : '+ Add SOP'}
          </button>
        </div>

        {/* Add SOP Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Add New SOP</h2>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  SOP Title:
                </label>
                <input
                  id="title"
                  type="text"
                  value={newSOP.title}
                  onChange={(e) => setNewSOP({...newSOP, title: e.target.value})}
                  placeholder="e.g., Lead Qualification Process, Price Objection Handling..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category:
                </label>
                <select
                  id="category"
                  value={newSOP.category}
                  onChange={(e) => setNewSOP({...newSOP, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  SOP Content:
                </label>
                <textarea
                  id="content"
                  value={newSOP.content}
                  onChange={(e) => setNewSOP({...newSOP, content: e.target.value})}
                  placeholder="Enter your step-by-step process, sales script, or procedure details..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  rows={8}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={addSOP}
                  disabled={isLoading}
                  className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save SOP'}
                </button>
                
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`p-4 rounded-md mb-6 ${
            feedback.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {feedback}
          </div>
        )}

        {/* SOPs List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your SOPs ({sops.length})
            </h2>
          </div>

          {isLoading && sops.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading SOPs...</p>
            </div>
          ) : sops.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">No SOPs found</p>
              <p>Click "Add SOP" to create your first Standard Operating Procedure</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sops.map((sop) => (
                <div key={sop.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{sop.title}</h3>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {categories.find(c => c.value === sop.category)?.label || sop.category}
                    </span>
                  </div>
                  
                  <div className="text-gray-700 mb-3">
                    {sop.content.length > 200 
                      ? sop.content.substring(0, 200) + '...' 
                      : sop.content
                    }
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Added: {new Date(sop.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">SOP Management Tips</h3>
          <ul className="text-blue-800 space-y-2">
            <li>• <strong>Sales Processes:</strong> Step-by-step sales conversations and closing techniques</li>
            <li>• <strong>Objection Handling:</strong> Scripts for common objections (price, time, competition)</li>
            <li>• <strong>Lead Qualification:</strong> Questions to identify serious prospects</li>
            <li>• <strong>Customer Service:</strong> How to handle complaints and member satisfaction</li>
            <li>• <strong>Policies:</strong> Membership rules, cancellation procedures, and guidelines</li>
            <li>• Your AI will automatically use these SOPs when responding to customers</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
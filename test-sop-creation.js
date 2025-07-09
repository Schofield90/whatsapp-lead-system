// Test script to verify SOP creation works
// Run with: node test-sop-creation.js

const fetch = require('node-fetch');

async function testSOPCreation() {
  try {
    console.log('Testing SOP creation...');
    
    // Test data
    const testSOP = {
      type: 'sop',
      content: 'Test SOP: This is a test standard operating procedure to verify the system is working correctly.'
    };
    
    // Make request to local API
    const response = await fetch('http://localhost:3000/api/knowledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSOP)
    });
    
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ SOP creation successful!');
      console.log('Created SOP ID:', result.data.id);
    } else {
      console.log('❌ SOP creation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing SOP creation:', error.message);
  }
}

// Run the test
testSOPCreation();
const { google } = require('googleapis');
const readline = require('readline');

// Replace these with your actual credentials
const CLIENT_ID = '1071902930073-63omtd7hr6a9biefu31vtjsflu5qv4fa.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate the url that will be used for authorization
const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar'],
  prompt: 'consent' // Force to show consent screen to get refresh token
});

console.log('🔗 Authorize this app by visiting this url:');
console.log(authorizeUrl);
console.log('\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n✅ Success! Here are your tokens:\n');
    console.log('Access Token:', tokens.access_token);
    console.log('\n');
    console.log('🔑 Refresh Token:', tokens.refresh_token);
    console.log('\n');
    console.log('Copy the refresh token above and add it to your Calendar Setup page!');
    
    rl.close();
  } catch (error) {
    console.error('❌ Error retrieving tokens:', error.message);
    rl.close();
  }
});
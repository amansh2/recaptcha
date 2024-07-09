const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const credentialsPath = path.join(__dirname, 'auth.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Create an OAuth2 client
const { client_secret, client_id, redirect_uris } = credentials.web;
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Generate the URL for the authorization page
const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: 'https://www.googleapis.com/auth/cloud-platform',
});

// Endpoint to start OAuth2 flow
app.get('/auth', (req, res) => {
  res.redirect(authorizeUrl)  
});

// OAuth2 callback endpoint
app.get('/oauthcallback', async (req, res) => {
  const code = req.query.code;
  try{
    const { tokens } = await oauth2Client.getToken(code);
    // oauth2Client.setCredentials(tokens);
    oauth2Client.setCredentials(
      {
        access_token: tokens.access_token
      }
    );
    console.log('Tokens:', tokens);
    res.redirect('/');
  } catch (error) {
    console.error('Error retrieving access token', error);
    res.send('Error retrieving access token');
  }
});

const projectID = 'utopian-medium-426906-a2'; // Replace with your project ID
const recaptchaSiteKey = '6LewDfwpAAAAALzKidAJ_z4FeNKCgzKJGerAMwyW'; // Replace with your site key

// Function to verify reCAPTCHA token
async function verifyRecaptchaToken(token) {
  const recaptchaenterprise = google.recaptchaenterprise({
    version: 'v1',
    auth: oauth2Client,
  });

  const request = {
    parent: `projects/${projectID}`,
    requestBody: {
      event: {
        token: token,
        siteKey: recaptchaSiteKey,
        expectedAction: 'submit',
      },
    },
  };

  const response = await recaptchaenterprise.projects.assessments.create(request);
  return response;
}

// Verify reCAPTCHA token endpoint
app.post('/verify-recaptcha', async (req, res) => {
  try {
    const token = req.body.token;
    const assessment = await verifyRecaptchaToken(token);
    // console.log(assessment)
    // Get the risk analysis score (0.0-1.0)
    const score = assessment.data.riskAnalysis.score;
    console.log(score)
    if (score >= 0.5) {
      // Score indicates the token is likely legitimate
      res.json({ success: true })
    } else {
      // Score indicates the token is likely fraudulent
      res.json({ success: false });
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    res.status(500).json({ success: false });
  }
});

// Serve the index HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});































// Set up Google Auth client
// const { GoogleAuth } = require('google-auth-library');
// const auth = new GoogleAuth({
//   keyFile: 'C:/Users/hp/practice/recaptcha/serviceAcc.json', // Replace with the path to your service account key file
//   scopes: 'https://www.googleapis.com/auth/cloud-platform',
// });

// const projectID = 'utopian-medium-426906-a2'; // Replace with your project ID
// const recaptchaSiteKey = '6LewDfwpAAAAALzKidAJ_z4FeNKCgzKJGerAMwyW'; // Replace with your site key

// // Function to verify reCAPTCHA token
// async function verifyRecaptchaToken(token) {
//   const client = await auth.getClient();
 
//   const recaptchaenterprise = google.recaptchaenterprise({
//     version: 'v1',
//     auth: client,
//   });

//   const request = {
//     parent: `projects/${projectID}`,
//     requestBody: {
//       event: {
//         token: token,
//         siteKey: recaptchaSiteKey,
//         expectedAction: 'submit',
//       }
//     }
//   };

//   const [response] = await recaptchaenterprise.projects.assessments.create(request)
//   return [response];
// }

// app.post('/verify-recaptcha', async (req, res) => {
 
//   try {
//     const token = req.body.token;
//     const assessment = await verifyRecaptchaToken(token);
   
//     // Get the risk analysis score (0.0-1.0)
//     const score = assessment.riskAnalysis.score;

//     if (score >= 0.5) {
//       // Score indicates the token is likely legitimate
//       res.json({ success: true });
//     } else {
//       // Score indicates the token is likely fraudulent
//       res.json({ success: false });
//     }
//   } catch (error) {
//     console.error('Error verifying reCAPTCHA:', error);
// //     res.status(500).json({ success: false });
//   }
// });
// app.get('/',(req,res)=>{
//     res.sendFile(path.join(__dirname, '/public/index.html'));
// })
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

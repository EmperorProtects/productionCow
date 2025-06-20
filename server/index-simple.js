const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample data (embedded for simplicity)
const sampleCows = [
  {
    cowId: "COW001",
    name: "Bessie",
    breed: "Holstein",
    age: 4,
    weight: 650,
    region: "North Farm",
    healthStatus: "healthy",
    nfcChipId: "NFC001",
    lastInspection: "2024-06-01T00:00:00.000Z",
    vaccinations: [
      {
        name: "Foot and Mouth Disease",
        date: "2024-01-15T00:00:00.000Z",
        nextDue: "2025-01-15T00:00:00.000Z"
      },
      {
        name: "Bovine Respiratory Disease",
        date: "2024-03-10T00:00:00.000Z",
        nextDue: "2025-03-10T00:00:00.000Z"
      }
    ],
    medicalHistory: [
      {
        date: "2024-02-01T00:00:00.000Z",
        diagnosis: "Minor cut on leg",
        treatment: "Cleaned and bandaged wound",
        veterinarian: "Dr. Smith"
      }
    ]
  },
  {
    cowId: "COW002",
    name: "Daisy",
    breed: "Jersey",
    age: 3,
    weight: 450,
    region: "South Farm",
    healthStatus: "under_treatment",
    nfcChipId: "NFC002",
    lastInspection: "2024-05-20T00:00:00.000Z",
    vaccinations: [
      {
        name: "Brucellosis",
        date: "2024-01-20T00:00:00.000Z",
        nextDue: "2025-01-20T00:00:00.000Z"
      }
    ],
    medicalHistory: [
      {
        date: "2024-05-15T00:00:00.000Z",
        diagnosis: "Mild respiratory infection",
        treatment: "Antibiotics prescribed",
        veterinarian: "Dr. Johnson"
      }
    ]
  },
  {
    cowId: "COW003",
    name: "Moo-bert",
    breed: "Angus",
    age: 5,
    weight: 720,
    region: "East Farm",
    healthStatus: "healthy",
    nfcChipId: "NFC003",
    lastInspection: "2024-06-01T00:00:00.000Z",
    vaccinations: [
      {
        name: "Clostridial Disease",
        date: "2024-04-01T00:00:00.000Z",
        nextDue: "2025-04-01T00:00:00.000Z"
      }
    ]
  }
];

// Google Form URL (replace with your actual Google Form URL)
const GOOGLE_FORM_URL = process.env.GOOGLE_FORM_URL || 'https://docs.google.com/forms/d/e/1FAIpQLSf_YourActualFormIdHere/viewform';

// Function to find cow by ID
function findCowById(id) {
  return sampleCows.find(cow => 
    cow.cowId === id || cow.nfcChipId === id
  );
}

// Function to generate HTML response
function generateCowHTML(cow) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cow Information - ${cow.name}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
        }
        .header::before {
            content: '🐄';
            font-size: 4em;
            position: absolute;
            top: 20px;
            right: 30px;
            opacity: 0.3;
        }
        .header h1 {
            margin: 0;
            font-size: 3em;
            font-weight: 300;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        .info-card {
            background: linear-gradient(145deg, #f8f9fa, #e9ecef);
            padding: 25px;
            border-radius: 15px;
            border-left: 5px solid #4CAF50;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .info-card:hover {
            transform: translateY(-5px);
        }
        .info-card h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 1.2em;
            font-weight: 600;
        }
        .info-card p {
            margin: 0;
            font-size: 1.4em;
            font-weight: bold;
            color: #555;
        }
        .status {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 1em;
            letter-spacing: 1px;
        }
        .status.healthy {
            background: linear-gradient(45deg, #d4edda, #c3e6cb);
            color: #155724;
            border: 2px solid #b8dacc;
        }
        .status.sick {
            background: linear-gradient(45deg, #f8d7da, #f5c6cb);
            color: #721c24;
            border: 2px solid #f1b0b7;
        }
        .status.under_treatment {
            background: linear-gradient(45deg, #fff3cd, #ffeaa7);
            color: #856404;
            border: 2px solid #fad5a5;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 15px;
            margin-bottom: 25px;
            font-size: 1.8em;
            font-weight: 600;
        }
        .timeline {
            border-left: 4px solid #4CAF50;
            padding-left: 30px;
            margin-left: 15px;
        }
        .timeline-item {
            background: linear-gradient(145deg, #f8f9fa, #e9ecef);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            position: relative;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        .timeline-item:before {
            content: '';
            position: absolute;
            left: -37px;
            top: 25px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #4CAF50;
            border: 4px solid white;
            box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
        }
        .date {
            color: #666;
            font-size: 1em;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .back-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 20px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: bold;
            box-shadow: 0 5px 20px rgba(76, 175, 80, 0.4);
            transition: all 0.3s ease;
        }
        .back-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.6);
        }
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            .container {
                margin: 10px;
                border-radius: 15px;
            }
            .header {
                padding: 30px 20px;
            }
            .content {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${cow.name}</h1>
            <p>Cow ID: ${cow.cowId} ${cow.nfcChipId ? `| NFC: ${cow.nfcChipId}` : ''}</p>
        </div>
        <div class="content">
            <div class="info-grid">
                <div class="info-card">
                    <h3>🐮 Breed</h3>
                    <p>${cow.breed}</p>
                </div>
                <div class="info-card">
                    <h3>🎂 Age</h3>
                    <p>${cow.age} years</p>
                </div>
                <div class="info-card">
                    <h3>⚖️ Weight</h3>
                    <p>${cow.weight} kg</p>
                </div>
                <div class="info-card">
                    <h3>📍 Region</h3>
                    <p>${cow.region}</p>
                </div>
                <div class="info-card">
                    <h3>💚 Health Status</h3>
                    <p><span class="status ${cow.healthStatus}">${cow.healthStatus.replace('_', ' ')}</span></p>
                </div>
                <div class="info-card">
                    <h3>🔍 Last Inspection</h3>
                    <p>${new Date(cow.lastInspection).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                </div>
            </div>

            ${cow.vaccinations && cow.vaccinations.length > 0 ? `
            <div class="section">
                <h2>💉 Vaccination History</h2>
                <div class="timeline">
                    ${cow.vaccinations.map(vac => `
                        <div class="timeline-item">
                            <div class="date">📅 ${new Date(vac.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</div>
                            <strong>${vac.name}</strong>
                            ${vac.nextDue ? `<br><small style="color: #666;">⏰ Next due: ${new Date(vac.nextDue).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${cow.medicalHistory && cow.medicalHistory.length > 0 ? `
            <div class="section">
                <h2>🏥 Medical History</h2>
                <div class="timeline">
                    ${cow.medicalHistory.map(record => `
                        <div class="timeline-item">
                            <div class="date">📅 ${new Date(record.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</div>
                            <strong>🩺 Diagnosis:</strong> ${record.diagnosis}<br>
                            <strong>💊 Treatment:</strong> ${record.treatment}<br>
                            <strong>👨‍⚕️ Veterinarian:</strong> ${record.veterinarian}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    </div>
    
    <a href="#" onclick="history.back()" class="back-btn">← Back</a>
</body>
</html>
  `;
}

// Function to generate Google Form HTML
function generateGoogleFormHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cow Not Found - Register New Cow</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 600px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            text-align: center;
        }
        .header {
            background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
            color: white;
            padding: 50px 30px;
        }
        .header .icon {
            font-size: 5em;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .content {
            padding: 50px 30px;
        }
        .message {
            font-size: 1.3em;
            color: #666;
            margin-bottom: 40px;
            line-height: 1.6;
        }
        .form-button {
            display: inline-block;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 20px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.2em;
            font-weight: bold;
            transition: all 0.3s ease;
            box-shadow: 0 5px 20px rgba(76, 175, 80, 0.4);
        }
        .form-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.6);
        }
        .info-box {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
            border-left: 5px solid #4CAF50;
        }
        .info-box h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .info-box p {
            margin: 0;
            color: #666;
            font-size: 0.95em;
            line-height: 1.4;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 15px;
            }
            .header {
                padding: 40px 20px;
            }
            .content {
                padding: 40px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">🐄❓</div>
            <h1>Cow Not Found</h1>
        </div>
        <div class="content">
            <p class="message">
                The cow ID you're looking for doesn't exist in our database. 
                This could be a new cow that needs to be registered in our system.
            </p>
            
            <div class="info-box">
                <h3>📝 What happens next?</h3>
                <p>Click the button below to open our cow registration form. You'll be able to add all the necessary information about the new cow, including health records, vaccinations, and basic details.</p>
            </div>
            
            <a href="${GOOGLE_FORM_URL}" target="_blank" class="form-button">
                📝 Register New Cow
            </a>
            
            <div style="margin-top: 30px; font-size: 0.9em; color: #888;">
                <p>Need help? Contact the veterinary office</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Main endpoint to get cow information by ID
app.get('/cow/:id', async (req, res) => {
  try {
    const cowId = req.params.id;
    console.log(`🔍 Looking for cow with ID: ${cowId}`);
    
    // Find the cow by cowId or nfcChipId
    const cow = findCowById(cowId);

    if (cow) {
      console.log(`✅ Found cow: ${cow.name}`);
      // Return cow information as HTML
      const html = generateCowHTML(cow);
      res.send(html);
    } else {
      console.log(`❌ Cow not found with ID: ${cowId}`);
      // Return Google Form HTML
      const html = generateGoogleFormHTML();
      res.send(html);
    }
  } catch (error) {
    console.error('Error fetching cow:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa;">
          <h1 style="color: #dc3545;">🐄 Oops! Something went wrong</h1>
          <p style="font-size: 1.2em; color: #666;">We encountered an error while fetching the cow information.</p>
          <p style="color: #666;">Please try again later or contact support.</p>
          <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 10px; display: inline-block;">
            <strong>Error:</strong> ${error.message}
          </div>
        </body>
      </html>
    `);
  }
});

// API endpoint to get cow data as JSON (optional)
app.get('/api/cow/:id', async (req, res) => {
  try {
    const cowId = req.params.id;
    console.log(`🔍 API request for cow ID: ${cowId}`);
    
    const cow = findCowById(cowId);

    if (cow) {
      res.json({ 
        success: true, 
        cow,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Cow not found',
        googleFormUrl: GOOGLE_FORM_URL,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching cow:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint to list all cows (for testing)
app.get('/api/cows', (req, res) => {
  res.json({
    success: true,
    cows: sampleCows,
    count: sampleCows.length,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'In-Memory JSON'
  });
});

// Root endpoint with instructions
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>🐄 Cow Inspection Service</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; background: #f8f9fa; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
          h1 { color: #4CAF50; text-align: center; }
          .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #4CAF50; }
          .method { color: #007bff; font-weight: bold; }
          a { color: #4CAF50; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🐄 Cow Inspection Service API</h1>
          <p>Welcome to the Cow Inspection Service! This API provides access to cow information and health records.</p>
          
          <h2>📋 Available Endpoints:</h2>
          
          <div class="endpoint">
            <div class="method">GET</div>
            <strong>/cow/{id}</strong> - Get cow information as HTML page
            <br><small>Returns beautiful HTML page with cow details, or Google Form if not found</small>
          </div>
          
          <div class="endpoint">
            <div class="method">GET</div>
            <strong>/api/cow/{id}</strong> - Get cow information as JSON
            <br><small>Returns JSON data for API integration</small>
          </div>
          
          <div class="endpoint">
            <div class="method">GET</div>
            <strong>/api/cows</strong> - List all cows
            <br><small>Returns all cows in the database</small>
          </div>
          
          <div class="endpoint">
            <div class="method">GET</div>
            <strong>/health</strong> - Health check
            <br><small>Returns server status</small>
          </div>
          
          <h2>🧪 Test Links:</h2>
          <ul>
            <li><a href="/cow/COW001">Cow COW001 (Bessie)</a></li>
            <li><a href="/cow/NFC002">NFC Chip NFC002 (Daisy)</a></li>
            <li><a href="/cow/COW003">Cow COW003 (Moo-bert)</a></li>
            <li><a href="/cow/NOTFOUND">Non-existent cow (Google Form)</a></li>
            <li><a href="/api/cows">All cows (JSON)</a></li>
            <li><a href="/health">Health check</a></li>
          </ul>
          
          <p style="text-align: center; margin-top: 40px; color: #666;">
            <small>Cow Inspection Service v1.0.0</small>
          </p>
        </div>
      </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🐄 Cow Inspection Server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} for instructions`);
  console.log(`🔗 Test endpoints:`);
  console.log(`   - http://localhost:${PORT}/cow/COW001`);
  console.log(`   - http://localhost:${PORT}/cow/NFC002`);
  console.log(`   - http://localhost:${PORT}/cow/NOTFOUND`);
  console.log(`   - http://localhost:${PORT}/api/cows`);
});

module.exports = app;

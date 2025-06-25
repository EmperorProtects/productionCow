const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-eval'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       imgSrc: ["'self'", "data:", "https:"],
//       connectSrc: ["'self'"],
//       fontSrc: ["'self'"],
//       objectSrc: ["'none'"],
//       mediaSrc: ["'self'"],
//       frameSrc: ["'none'"],
//     },
//   },
// }));
app.use(cookieParser());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory with proper MIME types
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cow_inspection_db';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Vet Schema
const vetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
vetSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
vetSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Vet = mongoose.model('Vet', vetSchema);

// Cow Schema
const cowSchema = new mongoose.Schema({
  cowId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  breed: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  healthStatus: {
    type: String,
    enum: ['healthy', 'sick', 'under_treatment'],
    default: 'healthy'
  },
  lastInspection: {
    type: Date,
    default: Date.now
  },
  vaccinations: [{
    name: String,
    date: Date,
    nextDue: Date
  }],
  medicalHistory: [{
    date: Date,
    diagnosis: String,
    treatment: String,
    veterinarian: String
  }]
}, {
  timestamps: true
});

const Cow = mongoose.model('Cow', cowSchema);

// Authentication Middleware
// const authenticateVet = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
//
//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'Access denied. No token provided.'
//       });
//     }
//
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const vet = await Vet.findById(decoded.vetId).select('-password');
//     // console.log(vet)
//
//     if (!vet || !vet.isActive) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid token or vet account inactive.'
//       });
//     }
//     req.vet = vet;
//     next();
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       message: 'Invalid token.'
//     });
//   }
// };

const authenticateVet = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.redirect(`/login.html?redirect=${encodeURIComponent(req.originalUrl)}`);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const vet = await Vet.findById(decoded.vetId).select('-password');

    if (!vet || !vet.isActive) {
      return res.redirect(`/login.html?redirect=${encodeURIComponent(req.originalUrl)}`);
    }

    req.vet = vet;
    next();
  } catch (error) {
    return res.redirect(`/login.html?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
};

// Region Authorization Middleware
const authorizeRegion = (req, res, next) => {
  const vetRegion = req.vet.region;
  const requestedRegion = req.cowRegion; // Will be set by the route handler

  if (vetRegion !== requestedRegion) {
    return res.status(403).json({
      success: false,
      message: `Access denied. You can only access cows in your region (${vetRegion}).`
    });
  }

  next();
};

// Region Authorization Middleware for Cows
const authorizeCowRegion = async (req, res, next) => {
  try {
    const cowId = req.params.id;
    const vetRegion = req.vet.region;

    // Find the cow to get its region
    const cow = await Cow.findOne({
      $or: [
        { cowId: cowId }
      ]
    });

    if (!cow) {
      // If cow doesn't exist, we'll let the route handler deal with it
      return next();
    }

    if (vetRegion !== cow.region) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only access cows in your region (${vetRegion}). This cow is in region: ${cow.region}`
      });
    }

    // Store cow in request for later use to avoid duplicate queries
    req.cow = cow;
    next();
  } catch (error) {
    console.error('Error in region authorization:', error);
    res.status(500).json({ success: false, message: 'Authorization error' });
  }
};
// Google Form URL (replace with your actual Google Form URL)
const GOOGLE_FORM_URL = process.env.GOOGLE_FORM_URL;

// Authentication Endpoints

// Vet Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, region, licenseNumber } = req.body;

    // Check if vet already exists
    const existingVet = await Vet.findOne({
      $or: [{ email }, { licenseNumber }]
    });

    if (existingVet) {
      return res.status(400).json({
        success: false,
        message: 'Vet with this email or license number already exists'
      });
    }

    // Create new vet
    const vet = new Vet({
      email,
      password,
      name,
      region,
      licenseNumber
    });

    await vet.save();

    // Generate JWT token
    const token = jwt.sign(
      { vetId: vet._id, email: vet.email, region: vet.region },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Vet Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find vet by email
    const vet = await Vet.findOne({ email: email.toLowerCase() });

    if (!vet || !vet.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account inactive'
      });
    }

    // Check password
    const isPasswordValid = await vet.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { vetId: vet._id, email: vet.email, region: vet.region },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ success: true });

    // res.json({
    //   success: true,
    //   message: 'Login successful',
    //   token,
    //   vet: {
    //     id: vet._id,
    //     email: vet.email,
    //     name: vet.name,
    //     region: vet.region,
    //     licenseNumber: vet.licenseNumber
    //   }
    // });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Get Current Vet Profile
app.get('/api/auth/profile', authenticateVet, (req, res) => {
  res.json({
    success: true,
    vet: {
      id: req.vet._id,
      email: req.vet.email,
      name: req.vet.name,
      region: req.vet.region,
      licenseNumber: req.vet.licenseNumber
    }
  });
});
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
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .content {
            padding: 30px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #4CAF50;
        }
        .info-card h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 1.1em;
        }
        .info-card p {
            margin: 0;
            font-size: 1.2em;
            font-weight: bold;
            color: #666;
        }
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.9em;
        }
        .status.healthy {
            background: #d4edda;
            color: #155724;
        }
        .status.sick {
            background: #f8d7da;
            color: #721c24;
        }
        .status.under_treatment {
            background: #fff3cd;
            color: #856404;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .timeline {
            border-left: 3px solid #4CAF50;
            padding-left: 20px;
            margin-left: 10px;
        }
        .timeline-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
            position: relative;
        }
        .timeline-item:before {
            content: '';
            position: absolute;
            left: -28px;
            top: 20px;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: #4CAF50;
        }
        .date {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 5px;
        }        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Vaccination Form Styles */
        .vaccination-form {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border: 2px solid #e9ecef;
            margin-top: 20px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-group label {
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }

        .form-group input,
        .form-group select {
            padding: 12px;
            border: 2px solid #ced4da;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: #4CAF50;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }

        .submit-btn {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }

        .message {
            margin-top: 15px;
            padding: 12px;
            border-radius: 6px;
            font-weight: 500;
        }

        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        @media (max-width: 600px) {
            .form-row {
                grid-template-columns: 1fr;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐄 ${cow.name}</h1>
            <p>Cow ID: ${cow.cowId}</p>
        </div>
        <div class="content">
            <div class="info-grid">
                <div class="info-card">
                    <h3>Breed</h3>
                    <p>${cow.breed}</p>
                </div>
                <div class="info-card">
                    <h3>Age</h3>
                    <p>${cow.age} years</p>
                </div>
                <div class="info-card">
                    <h3>Weight</h3>
                    <p>${cow.weight} kg</p>
                </div>
                <div class="info-card">
                    <h3>Region</h3>
                    <p>${cow.region}</p>
                </div>
                <div class="info-card">
                    <h3>Health Status</h3>
                    <p><span class="status ${cow.healthStatus}">${cow.healthStatus}</span></p>
                </div>
                <div class="info-card">
                    <h3>Last Inspection</h3>
                    <p>${new Date(cow.lastInspection).toLocaleDateString()}</p>
                </div>
            </div>

            ${cow.vaccinations && cow.vaccinations.length > 0 ? `
            <div class="section">
                <h2>Vaccination History</h2>
                <div class="timeline">
                    ${cow.vaccinations.map(vac => `
                        <div class="timeline-item">
                            <div class="date">${new Date(vac.date).toLocaleDateString()}</div>
                            <strong>${vac.name}</strong>
                            ${vac.nextDue ? `<br><small>Next due: ${new Date(vac.nextDue).toLocaleDateString()}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}            ${cow.medicalHistory && cow.medicalHistory.length > 0 ? `
            <div class="section">
                <h2>Medical History</h2>
                <div class="timeline">
                    ${cow.medicalHistory.map(record => `
                        <div class="timeline-item">
                            <div class="date">${new Date(record.date).toLocaleDateString()}</div>
                            <strong>Diagnosis:</strong> ${record.diagnosis}<br>
                            <strong>Treatment:</strong> ${record.treatment}<br>
                            <strong>Veterinarian:</strong> ${record.veterinarian}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Add New Vaccination Section -->
            <div class="section">
                <h2>Add New Vaccination</h2>
                <form id="vaccinationForm" class="vaccination-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vaccinationName">Vaccination Name:</label>
                            <select id="vaccinationName" required>
                                <option value="">Select vaccination type</option>
                                <option value="Foot and Mouth Disease">Foot and Mouth Disease</option>
                                <option value="Bovine Respiratory Disease">Bovine Respiratory Disease</option>
                                <option value="Brucellosis">Brucellosis</option>
                                <option value="Anthrax">Anthrax</option>
                                <option value="Clostridial Disease">Clostridial Disease</option>
                                <option value="Infectious Bovine Keratoconjunctivitis">Infectious Bovine Keratoconjunctivitis</option>
                                <option value="Bovine Viral Diarrhea">Bovine Viral Diarrhea</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group" id="customVaccinationGroup" style="display: none;">
                            <label for="customVaccinationName">Custom Vaccination Name:</label>
                            <input type="text" id="customVaccinationName" placeholder="Enter vaccination name">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vaccinationDate">Vaccination Date:</label>
                            <input type="date" id="vaccinationDate" required>
                        </div>
                        <div class="form-group">
                            <label for="nextDueDate">Next Due Date (optional):</label>
                            <input type="date" id="nextDueDate">
                        </div>
                    </div>
                    <button type="submit" class="submit-btn">Add Vaccination</button>
                    <div id="vaccineMessage" class="message" style="display: none;"></div>
                </form>
            </div>
        </div>
    </div>

    <script>
        // Set default date to today
        document.getElementById('vaccinationDate').value = new Date().toISOString().split('T')[0];

        // Handle custom vaccination name
        document.getElementById('vaccinationName').addEventListener('change', function(e) {
            const customGroup = document.getElementById('customVaccinationGroup');
            if (e.target.value === 'Other') {
                customGroup.style.display = 'block';
                document.getElementById('customVaccinationName').required = true;
            } else {
                customGroup.style.display = 'none';
                document.getElementById('customVaccinationName').required = false;
            }
        });

        // Handle form submission
        document.getElementById('vaccinationForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const vaccinationName = document.getElementById('vaccinationName').value;
            const customVaccinationName = document.getElementById('customVaccinationName').value;
            const vaccinationDate = document.getElementById('vaccinationDate').value;
            const nextDueDate = document.getElementById('nextDueDate').value;
            const messageDiv = document.getElementById('vaccineMessage');

            const name = vaccinationName === 'Other' ? customVaccinationName : vaccinationName;

            if (!name || !vaccinationDate) {
                showMessage('Please fill in all required fields', 'error');
                return;
            }

            try {
                const response = await fetch('/api/cow/${cow.cowId}/vaccination', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        date: vaccinationDate,
                        nextDue: nextDueDate || null
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showMessage('Vaccination added successfully! Refreshing page...', 'success');
                    // Reset form
                    document.getElementById('vaccinationForm').reset();
                    document.getElementById('customVaccinationGroup').style.display = 'none';
                    // Refresh page to show new vaccination
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    showMessage('Error: ' + data.message, 'error');
                }
            } catch (error) {
                showMessage('Failed to add vaccination: ' + error.message, 'error');
            }
        });

        function showMessage(message, type) {
            const messageDiv = document.getElementById('vaccineMessage');
            messageDiv.textContent = message;
            messageDiv.className = 'message ' + type;
            messageDiv.style.display = 'block';

            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    </script>
</body>
</html>
  `;
}



// Main endpoint to get cow information by ID
app.get('/cow/:id', authenticateVet, authorizeCowRegion, async (req, res) => {
  try {
    const cowId = req.params.id;

    // Use cow from middleware if available, otherwise try to find it
    let cow = req.cow;
    if (!cow) {
      const data = await Cow.find({ cowId: cowId });
      cow = data[0];
    }    if (cow) {
      // Return cow information as HTML
      const html = generateCowHTML(cow);
      res.send(html);
    } else {
      // Return Cow Registration HTML with the requested cow ID
      // const html = generateCowRegistrationHTML(cowId);
      // res.send(html);
      return res.redirect(`/cow-registration.html?cowId=${encodeURIComponent(cowId)}`);

    }
  } catch (error) {
    console.error('Error fetching cow:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>🐄 Oops! Something went wrong</h1>
          <p>We encountered an error while fetching the cow information.</p>
          <p>Please try again later.</p>
        </body>
      </html>
    `);
  }
});

// API endpoint to get cow data as JSON (optional)
app.get('/api/cow/:id', authenticateVet, authorizeCowRegion, async (req, res) => {
  try {
    const cowId = req.params.id;

    // Use cow from middleware if available, otherwise try to find it
    let cow = req.cow;
    if (!cow) {
      cow = await Cow.findOne({
        $or: [
          { cowId: cowId }
        ]
      });
    }

    if (cow) {
      res.json({ success: true, cow });    } else {
      res.status(404).json({
        success: false,
        message: 'Cow not found',
        registrationUrl: `/cow/${cowId}`
      });
    }
  } catch (error) {
    console.error('Error fetching cow:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Endpoint to add a new cow (for testing purposes)
app.post('/api/cow', authenticateVet, async (req, res) => {
  try {
    const vetRegion = req.vet.region;

    // Ensure the cow is being created in the vet's region
    if (req.body.region && req.body.region !== vetRegion) {
      return res.status(403).json({
        success: false,
        message: `You can only create cows in your region (${vetRegion})`
      });
    }

    // Set the region to vet's region if not specified
    req.body.region = vetRegion;

    const cow = new Cow(req.body);
    await cow.save();
    res.status(201).json({ success: true, cow });
  } catch (error) {
    console.error('Error creating cow:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Add vaccination to a cow
app.post('/api/cow/:id/vaccination', authenticateVet, authorizeCowRegion, async (req, res) => {
  try {
    const cowId = req.params.id;
    const { name, date, nextDue } = req.body;

    // Validate required fields
    if (!name || !date) {
      return res.status(400).json({
        success: false,
        message: 'Vaccination name and date are required'
      });
    }

    // Use cow from middleware if available, otherwise find it
    let cow = req.cow;
    if (!cow) {
      cow = await Cow.findOne({ cowId: cowId });
    }

    if (!cow) {
      return res.status(404).json({
        success: false,
        message: 'Cow not found'
      });
    }

    // Create vaccination record
    const vaccination = {
      name,
      date: new Date(date),
      nextDue: nextDue ? new Date(nextDue) : null
    };

    // Add vaccination to cow's vaccination array
    cow.vaccinations.push(vaccination);
    await cow.save();

    res.json({
      success: true,
      message: 'Vaccination added successfully',
      vaccination,
      cow: {
        cowId: cow.cowId,
        name: cow.name,
        vaccinations: cow.vaccinations
      }
    });

  } catch (error) {
    console.error('Error adding vaccination:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add vaccination'
    });
  }
});

// Get cow vaccinations
app.get('/api/cow/:id/vaccinations', authenticateVet, authorizeCowRegion, async (req, res) => {
  try {
    const cowId = req.params.id;

    // Use cow from middleware if available, otherwise find it
    let cow = req.cow;
    if (!cow) {
      cow = await Cow.findOne({ cowId: cowId });
    }

    if (!cow) {
      return res.status(404).json({
        success: false,
        message: 'Cow not found'
      });
    }

    res.json({
      success: true,
      cowId: cow.cowId,
      cowName: cow.name,
      vaccinations: cow.vaccinations || []
    });

  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vaccinations'
    });
  }
});

// Dashboard Metrics Endpoints

// Get dashboard statistics
app.get('/api/dashboard/stats', authenticateVet, async (req, res) => {
  try {
    const vetRegion = req.vet.region;
    
    // Get total cows in vet's region
    const totalCows = await Cow.countDocuments({ region: vetRegion });
    
    // Get cows by health status
    const healthyCount = await Cow.countDocuments({ 
      region: vetRegion, 
      healthStatus: 'healthy' 
    });
    const sickCount = await Cow.countDocuments({ 
      region: vetRegion, 
      healthStatus: 'sick' 
    });
    const underTreatmentCount = await Cow.countDocuments({ 
      region: vetRegion, 
      healthStatus: 'under_treatment' 
    });
    
    // Get breed distribution
    const breedStats = await Cow.aggregate([
      { $match: { region: vetRegion } },
      { $group: { _id: '$breed', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get age distribution
    const ageStats = await Cow.aggregate([
      { $match: { region: vetRegion } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 2] }, then: '0-2 years' },
                { case: { $lt: ['$age', 5] }, then: '2-5 years' },
                { case: { $lt: ['$age', 8] }, then: '5-8 years' },
                { case: { $gte: ['$age', 8] }, then: '8+ years' }
              ],
              default: 'Unknown'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get recent inspections (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentInspections = await Cow.countDocuments({
      region: vetRegion,
      lastInspection: { $gte: thirtyDaysAgo }
    });
    
    // Get overdue inspections (more than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const overdueInspections = await Cow.countDocuments({
      region: vetRegion,
      lastInspection: { $lt: ninetyDaysAgo }
    });
    
    // Get average weight by breed
    const weightStats = await Cow.aggregate([
      { $match: { region: vetRegion } },
      {
        $group: {
          _id: '$breed',
          avgWeight: { $avg: '$weight' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgWeight: -1 } }
    ]);
    
    // Get vaccination status
    const vaccinationStats = await Cow.aggregate([
      { $match: { region: vetRegion } },
      {
        $project: {
          hasVaccinations: { $gt: [{ $size: { $ifNull: ['$vaccinations', []] } }, 0] }
        }
      },
      {
        $group: {
          _id: '$hasVaccinations',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const vaccinatedCount = vaccinationStats.find(stat => stat._id === true)?.count || 0;
    const unvaccinatedCount = vaccinationStats.find(stat => stat._id === false)?.count || 0;
    
    res.json({
      success: true,
      stats: {
        totalCows,
        healthStats: {
          healthy: healthyCount,
          sick: sickCount,
          underTreatment: underTreatmentCount
        },
        breedStats,
        ageStats,
        inspectionStats: {
          recent: recentInspections,
          overdue: overdueInspections
        },
        weightStats,
        vaccinationStats: {
          vaccinated: vaccinatedCount,
          unvaccinated: unvaccinatedCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
  }
});

// Get timeline data for charts
app.get('/api/dashboard/timeline', authenticateVet, async (req, res) => {
  try {
    const vetRegion = req.vet.region;
    const days = parseInt(req.query.days) || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get daily inspection counts
    const inspectionTimeline = await Cow.aggregate([
      {
        $match: {
          region: vetRegion,
          lastInspection: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$lastInspection'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get health status changes over time (if we had a history)
    // For now, we'll simulate with current data
    const healthTimeline = await Cow.aggregate([
      { $match: { region: vetRegion } },
      {
        $group: {
          _id: '$healthStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      timeline: {
        inspections: inspectionTimeline,
        healthStatus: healthTimeline
      }
    });
  } catch (error) {
    console.error('Error fetching timeline data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timeline data' });
  }
});

// Get list of cows with basic info for the dashboard
app.get('/api/dashboard/cows', authenticateVet, async (req, res) => {
  try {
    const vetRegion = req.vet.region;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const cows = await Cow.find({ region: vetRegion })
      .select('cowId name breed age weight healthStatus lastInspection')
      .sort({ lastInspection: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Cow.countDocuments({ region: vetRegion });
    
    res.json({
      success: true,
      cows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching cows list:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cows list' });
  }
});

// Direct route for cow registration page
app.get('/cow-registration', authenticateVet, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cow-registration.html'));
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🐄 Cow Inspection Server running on port ${PORT}`);
  console.log(`🌐 Access cow info at: http://localhost:${PORT}/cow/{id}`);
});

module.exports = app;

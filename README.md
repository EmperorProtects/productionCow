# Cow Inspection Service

# Cow Inspection Service

A comprehensive web service for managing cow health inspections, veterinary records, and NFC chip scanning. The system provides a backend API that returns cow information in HTML format, with automatic Google Form integration for unknown cow IDs.

## 🚀 Quick Start

1. **Navigate to server directory**:
   ```powershell
   cd server
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Start the server**:
   ```powershell
   npm run simple
   ```

4. **Open in browser**:
   - Homepage: http://localhost:5000
   - Test cow: http://localhost:5000/cow/COW001
   - Unknown cow: http://localhost:5000/cow/UNKNOWN

## Features

- **🐄 NFC Chip Integration**: Scan NFC chips to view cow data or add new cows via Google Forms
- **📱 Beautiful HTML Interface**: Responsive design with detailed cow information
- **📝 Google Form Integration**: Automatic redirect for unknown cow IDs
- **🔍 Flexible Search**: Supports both cow IDs and NFC chip IDs
- **⚡ JSON API**: RESTful endpoints for integration
- **🏥 Medical Records**: Track health inspections, vaccinations, and treatments
- **🎨 Modern UI**: Professional styling with animations and responsive design

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cow/{id}` | **Main endpoint** - Returns HTML page with cow info or Google Form |
| GET | `/api/cow/{id}` | Returns JSON data for API integration |
| GET | `/api/cows` | Lists all cows in JSON format |
| GET | `/health` | Server health check |

## Sample Data

The system includes test data:
- **COW001** (Bessie) - Holstein, healthy
- **COW002** (Daisy) - Jersey, under treatment
- **COW003** (Moo-bert) - Angus, healthy
- **NFC001-003** - NFC chip IDs

## Configuration

### Google Form Setup
1. Create a Google Form for cow registration
2. Update `GOOGLE_FORM_URL` in `server/.env`
3. Form will be shown when cow ID is not found

### Database Options
- **Simple**: In-memory JSON (default, no setup required)
- **MongoDB**: Full database support (requires MongoDB installation)

## Project Structure

```
cow-inspection-service/
├── 📁 server/                 # Backend API
│   ├── 📄 index-simple.js     # Simple server (recommended)
│   ├── 📄 index.js            # MongoDB version
│   ├── 📄 package.json        # Dependencies
│   ├── 📄 .env                # Configuration
│   └── 📄 README.md           # Server documentation
├── 📄 package.json            # Root package
└── 📄 README.md               # This file
```

## Technology Stack

**Backend:**
- Node.js with Express.js
- In-memory JSON database (or MongoDB)
- RESTful API design
- Security middleware (Helmet, CORS)

**Frontend:**
- Server-side HTML generation
- Responsive CSS with animations
- Mobile-friendly design
- Professional UI/UX

## Getting Started

### Prerequisites
- Node.js (v14+)
- NPM or Yarn

### Installation
1. Clone the repository
2. Install backend dependencies:
   ```powershell
   cd server
   npm install
   ```

### Running the Server
```powershell
# Simple version (recommended for testing)
npm run simple

# MongoDB version (requires MongoDB)
npm start

# Development mode with auto-reload
npm run dev-simple
```

## Usage Examples

### 1. Existing Cow
**URL**: `/cow/COW001`
**Result**: Beautiful HTML page with:
- Cow information (name, breed, age, weight)
- Health status with color coding
- Vaccination timeline
- Medical history

### 2. Unknown Cow
**URL**: `/cow/UNKNOWN123`
**Result**: Registration page with:
- "Cow Not Found" message
- Google Form link
- Instructions for registration

### 3. NFC Chip
**URL**: `/cow/NFC002`
**Result**: Same as existing cow (finds by NFC ID)

### 4. JSON API
**URL**: `/api/cow/COW001`
**Result**: JSON response for integration:
```json
{
  "success": true,
  "cow": {
    "cowId": "COW001",
    "name": "Bessie",
    "breed": "Holstein",
    "healthStatus": "healthy",
    "vaccinations": [...],
    "medicalHistory": [...]
  }
}
```

## Customization

### Adding New Cows
Edit `sampleCows` array in `server/index-simple.js` or use MongoDB version with API endpoints.

### Styling
HTML templates include embedded CSS that can be customized for your organization.

### Google Form
Replace the form URL in `.env` with your organization's cow registration form.

## Deployment

### Development
```powershell
cd server
npm run dev-simple
```

### Production
1. Use MongoDB for persistence
2. Set environment variables
3. Configure HTTPS
4. Add authentication if needed

## Troubleshooting

### Port Issues
```powershell
# Use different port
$env:PORT=3001; npm run simple
```

### MongoDB Connection
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Use simple version for testing

## Support

For issues:
1. Check server logs
2. Verify dependencies are installed
3. Test with provided sample data
4. Ensure Google Form URL is accessible

## License

MIT License - see LICENSE file for details.

### Configuration

1. Create a `.env` file in the server directory with the following:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/cow_inspection
   JWT_SECRET=your_secret_key
   GOOGLE_FORM_URL=https://forms.google.com/your-form-id
   ```

### Running the Application

1. Start the backend server:
   ```
   cd server
   npm run dev
   ```
2. Start the frontend development server:
   ```
   cd client
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

### Cows
- `GET /api/cows` - Get all cows (filtered by user's region)
- `GET /api/cows/:id` - Get cow by ID
- `GET /api/cows/nfc/:nfcId` - Get cow by NFC ID (scan)
- `POST /api/cows` - Create a new cow
- `PUT /api/cows/:id` - Update cow information
- `POST /api/cows/:id/medical` - Add medical record
- `POST /api/cows/:id/vaccination` - Add vaccination

## NFC Chip Integration

The system integrates with NFC chips by:
1. Reading the ID from the chip
2. Looking up the ID in the database
3. Displaying cow information if found
4. Redirecting to a Google Form if not found

## License

MIT License

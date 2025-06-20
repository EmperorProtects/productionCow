# Cow Inspection Service - Backend

A Node.js/Express backend service that provides cow information through web endpoints. When a cow ID is found in the database, it returns a beautiful HTML page with detailed information. When the ID is not found, it displays a Google Form for registering new cows.

## Features

- 🐄 **Cow Information Display**: Beautiful HTML pages with cow details including health status, vaccinations, and medical history
- 📝 **Google Form Integration**: Automatic redirect to registration form for unknown cow IDs
- 🔍 **Flexible ID Search**: Supports both cow IDs and NFC chip IDs
- 📱 **Responsive Design**: Mobile-friendly interface
- 🔗 **JSON API**: RESTful API endpoints for programmatic access
- ⚡ **Fast & Lightweight**: In-memory database for quick responses

## Installation

1. **Navigate to the server directory**:
   ```powershell
   cd server
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Configure environment variables** (optional):
   Edit `.env` file to customize:
   ```
   PORT=3001
   GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform
   ```

## Usage

### Start the Server

```powershell
# Start with default settings
npm start

# Or start with custom port
$env:PORT=3001; node index-simple.js
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Homepage with API documentation |
| GET | `/cow/{id}` | Get cow information as HTML |
| GET | `/api/cow/{id}` | Get cow information as JSON |
| GET | `/api/cows` | List all cows as JSON |
| GET | `/health` | Health check endpoint |

### Sample Data

The system includes sample data for testing:

- **COW001** (Bessie) - Holstein cow, healthy
- **COW002** (Daisy) - Jersey cow, under treatment  
- **COW003** (Moo-bert) - Angus cow, healthy
- **NFC001, NFC002, NFC003** - Corresponding NFC chip IDs

## Testing

### Test URLs

Once the server is running (default port 3001):

- **Homepage**: http://localhost:3001
- **Existing cow**: http://localhost:3001/cow/COW001
- **NFC chip**: http://localhost:3001/cow/NFC002
- **Unknown cow**: http://localhost:3001/cow/UNKNOWN
- **All cows JSON**: http://localhost:3001/api/cows

### Example Responses

**Existing Cow (HTML)**:
Beautiful responsive page with:
- Cow basic information (name, breed, age, weight)
- Health status with color coding
- Vaccination history timeline
- Medical history with veterinarian notes

**Unknown Cow (HTML)**:
Registration page with:
- "Cow Not Found" message
- Link to Google Form for registration
- Instructions for next steps

**JSON API Response**:
```json
{
  "success": true,
  "cow": {
    "cowId": "COW001",
    "name": "Bessie",
    "breed": "Holstein",
    "age": 4,
    "weight": 650,
    "region": "North Farm",
    "healthStatus": "healthy",
    "nfcChipId": "NFC001",
    "lastInspection": "2024-06-01T00:00:00.000Z",
    "vaccinations": [...],
    "medicalHistory": [...]
  },
  "timestamp": "2025-06-06T..."
}
```

## Google Form Integration

To set up your own Google Form:

1. Create a new Google Form for cow registration
2. Add fields for: Cow ID, Name, Breed, Age, Weight, Region, etc.
3. Get the form's shareable link
4. Update the `GOOGLE_FORM_URL` in your `.env` file

## Database Options

### Current: In-Memory JSON
- ✅ Fast startup and testing
- ✅ No external dependencies
- ❌ Data doesn't persist between restarts

### MongoDB Integration (Optional)
The system includes MongoDB support. To use:

1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGODB_URI` in `.env`
3. Use `index.js` instead of `index-simple.js`
4. Run the seed script: `node seed.js`

## Architecture

```
📂 server/
├── 📄 index-simple.js     # Main server (in-memory data)
├── 📄 index.js            # MongoDB version
├── 📄 seed.js             # Database seeding
├── 📄 package.json        # Dependencies
├── 📄 .env                # Environment variables
└── 📄 README.md           # This file
```

## Dependencies

- **express**: Web server framework
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **compression**: Response compression
- **dotenv**: Environment variable management
- **mongoose**: MongoDB ODM (for MongoDB version)

## Customization

### Adding New Cows
Edit the `sampleCows` array in `index-simple.js` or use the MongoDB version with the API endpoints.

### Styling
The HTML templates include embedded CSS that can be customized for your organization's branding.

### Error Handling
The system includes comprehensive error handling with user-friendly error pages.

## Troubleshooting

### Port Already in Use
```powershell
# Use a different port
$env:PORT=3002; node index-simple.js
```

### Cannot Connect to MongoDB
- Make sure MongoDB is running locally
- Check the `MONGODB_URI` in your `.env` file
- Use `index-simple.js` for testing without MongoDB

### Google Form Not Loading
- Verify the `GOOGLE_FORM_URL` is correct
- Ensure the form is set to public access
- Check for any CORS restrictions

## Production Deployment

For production use:
1. Use MongoDB for data persistence
2. Set up proper environment variables
3. Configure HTTPS
4. Add authentication if needed
5. Set up monitoring and logging

## Support

For issues and questions:
- Check the server logs for error messages
- Verify all dependencies are installed
- Test with the provided sample data first
- Ensure your Google Form URL is accessible

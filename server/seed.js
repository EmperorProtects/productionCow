const mongoose = require('mongoose');

// Define the Cow schema here for seeding
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
  }],
  nfcChipId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

const Cow = mongoose.model('Cow', cowSchema);

// Sample data for testing
const sampleCows = [
  {
    cowId: 'COW001',
    name: 'Bessie',
    breed: 'Holstein',
    age: 4,
    weight: 650,
    region: 'North',
    healthStatus: 'healthy',
    vaccinations: [
      {
        name: 'Foot and Mouth Disease',
        date: new Date('2024-01-15'),
        nextDue: new Date('2025-01-15')
      },
      {
        name: 'Bovine Respiratory Disease',
        date: new Date('2024-03-10'),
        nextDue: new Date('2025-03-10')
      }
    ],
    medicalHistory: [
      {
        date: new Date('2024-02-01'),
        diagnosis: 'Minor cut on leg',
        treatment: 'Cleaned and bandaged wound',
        veterinarian: 'Dr. Smith'
      }
    ]
  },
  {
    cowId: 'COW002',
    name: 'Daisy',
    breed: 'Jersey',
    age: 3,
    weight: 450,
    region: 'South',
    healthStatus: 'under_treatment',
    vaccinations: [
      {
        name: 'Brucellosis',
        date: new Date('2024-01-20'),
        nextDue: new Date('2025-01-20')
      }
    ],
    medicalHistory: [
      {
        date: new Date('2024-05-15'),
        diagnosis: 'Mild respiratory infection',
        treatment: 'Antibiotics prescribed',
        veterinarian: 'Dr. Johnson'
      }
    ]
  },
  {
    cowId: 'COW003',
    name: 'Moo-bert',
    breed: 'Angus',
    age: 5,
    weight: 720,
    region: 'East',
    healthStatus: 'healthy',
    vaccinations: [
      {
        name: 'Clostridial Disease',
        date: new Date('2024-04-01'),
        nextDue: new Date('2025-04-01')
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cow_inspection_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Cow.deleteMany({});
    console.log('Cleared existing cow data');

    // Insert sample data
    await Cow.insertMany(sampleCows);
    console.log('Sample cow data inserted successfully');

    console.log('\n🐄 Sample Cows Added:');
    sampleCows.forEach(cow => {
      console.log(`- ${cow.name} (ID: ${cow.cowId}, NFC: ${cow.nfcChipId})`);
    });

    console.log('\n📝 Test URLs:');
    console.log(`http://localhost:5000/cow/COW001`);
    console.log(`http://localhost:5000/cow/NFC002`);
    console.log(`http://localhost:5000/cow/NONEXISTENT`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase seeding completed');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  seedDatabase();
}

module.exports = { seedDatabase, sampleCows };

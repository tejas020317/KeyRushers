// backend/scripts/migrate-users.js
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
   
    // Add missing fields to existing users
    const result = await User.updateMany(
      { 
        $or: [
          { matchesPlayed: { $exists: false } },
          { totalWpm: { $exists: false } }
        ]
      },
      {
        $set: {
          matchesPlayed: 0,
          highestAccuracy: 0,
          totalWpm: 0,
          bestScores: {
            '15s': { wpm: 0, accuracy: 0 },
            '30s': { wpm: 0, accuracy: 0 },
            '60s': { wpm: 0, accuracy: 0 },
            '120s': { wpm: 0, accuracy: 0 }
          }
        }
      }
    );
   
    console.log(`✅ Migration complete! Updated ${result.modifiedCount} users.`);
    
    // Optionally: Recalculate totalWpm from existing scores
    console.log('📊 Recalculating totalWpm from existing scores...');
    const Score = require('../models/Score');
    
    const users = await User.find({});
    for (const user of users) {
      const userScores = await Score.find({ uid: user.uid });
      const totalWpm = userScores.reduce((sum, score) => sum + score.wpm, 0);
      const matchesPlayed = userScores.length;
      
      await User.updateOne(
        { uid: user.uid },
        { $set: { totalWpm, matchesPlayed } }
      );
    }
    
    console.log('✅ Recalculation complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();

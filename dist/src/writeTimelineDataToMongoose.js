const { PlayerStat, Round } = require('./models');
const fs = require('fs');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/scoringTimeline', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Adjust timeout settings
  connectTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 60000, // 60 seconds
});

const data = fs.readFileSync('timelineData1.json', 'utf-8');
const jsonData = JSON.parse(data);

async function insertData(data) {
  for (const round in data) {
    const timelineData = data[round].map(item => ({ ...item, round }));

    // Split the data into smaller batches
    const batchSize = 25; // Adjust batch size
    for (let i = 0; i < timelineData.length; i += batchSize) {
      const batch = timelineData.slice(i, i + batchSize);

      await retryInsert(batch, round);
    }
  }
}

async function retryInsert(batch, round, retries = 3, delay = 1000) {
  try {
    // Insert data into the "rounds" collection
    await Round.findOneAndUpdate(
      { round }, // Filter by round
      { $addToSet: { stats: { $each: batch } } }, // Add each item of the batch to the "stats" array if it does not exist
      { upsert: true, new: true }
    );
    console.log(`Data for ${round} inserted successfully`);
  } catch (err) {
    console.error(`Error inserting data for ${round}:`, err);
    if (retries > 0) {
      console.log(`Retrying insertion for ${round} in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      // Exponential backoff: increase delay exponentially
      await retryInsert(batch, round, retries - 1, delay * 2);
    } else {
      console.error(`Maximum retries exceeded for ${round}`);
    }
  }
}

// Call the function to insert data
insertData(jsonData);

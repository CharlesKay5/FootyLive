const fs = require('fs').promises;
const BSON = require('bson');

async function convertJsonToBson() {
    try {
        // Step 1: Read the existing JSON file
        const jsonData = await fs.readFile('timelineData.json', 'utf8');
        const data = JSON.parse(jsonData);

        // Step 2: Serialize data to BSON format
        const bsonData = BSON.serialize(data);

        // Step 3: Write BSON data to a new file
        await fs.writeFile('timelineData.bson', bsonData);
        console.log('Successfully converted JSON to BSON and saved to timelineData.bson');

        // Optionally, you can delete the old JSON file if you no longer need it
        // await fs.unlink('timelineData.json');
    } catch (error) {
        console.error('Error converting JSON to BSON:', error);
    }
}

convertJsonToBson();

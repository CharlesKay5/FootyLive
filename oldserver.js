const express = require('express');
const puppeteerCrawl = require('./crawlerAPI.js'); // Importing your logic file
const fixtureCrawl = require('./fixtureAPI.js'); // Importing your logic file
const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const compression = require('compression');

const app = express();
const port = 5000;

// Serve static files including CSS
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(compression());

const fixtureURL = "https://www.afl.com.au/fixture";
const baseURL = "https://www.afl.com.au/afl/matches/5975"

let fixture = { games: [] }; // Initialize fixture data

// Function to update fixture data
async function updateFixtureData() {
    try {
        const data = { games: [] };
        await fixtureCrawl(fixtureURL, data);
        fixture = data; // Update fixture data
        //console.log('Updated fixture data:', fixture);
    } catch (error) {
        console.error('Error fetching fixture data:', error);
    }
}

// Update fixture data every minute
updateFixtureData();
setInterval(updateFixtureData, 60000);

// Route for serving fixture HTML
app.get('/fixture', (req, res) => {
    const fixturePath = path.join(__dirname, 'public', 'fixture.html');
    res.sendFile(fixturePath);
});

// Route for serving fixture data
app.get('/fixture-data', (req, res) => {
    res.json(fixture);
});

let links = [];
app.get('/fixture-links', (req, res) => {
    
    fixture.games.forEach(game => {
        links.push(game.link.split("/").pop());
    });
    res.json(links);
}); // Add missing semicolon and closing parenthesis

////////////////////////////////////////////

// Serve index.html when root URL is accessed
app.get('/game', async (req, res) => {
    try {
        // Fetch player data from /player-stats endpoint using axios
        const response = await axios.get('http://localhost:5000/player-stats');
        if (!response.data) {
            throw new Error('Failed to fetch player data');
        }
        const data = response.data;

        // Read index.html file
        const indexPath = path.join(__dirname, 'public', 'index.html');
        let indexHtml = fs.readFileSync(indexPath, 'utf-8');

        // Replace placeholder in index.html with player data
        indexHtml = indexHtml.replace('<!-- {{playerData}} -->', JSON.stringify(data));

        // Send modified index.html with player data
        res.send(indexHtml);
    } catch (error) {
        console.error('Error fetching player data:', error);
        res.status(500).send('Internal Server Error');
    }
});


let playerStats = {}; // This will hold the latest player stats

// Function to update player stats
async function updatePlayerStats(baseURL) {
    
    try {
        const data = {
            players: []
        };
        playerStats = await puppeteerCrawl(baseURL, data);
    } catch (error) {
        console.error('Error fetching player stats:', error);
    }
}

// Update player stats every 10 seconds
//setInterval(updatePlayerStats(baseURL), 10000);
updatePlayerStats(baseURL);
setInterval(() => updatePlayerStats(baseURL), 10000);

app.get('/player-stats', (req, res) => {
    res.json(playerStats);
});

// Route for serving player images
app.get('/player-image/:playerId', async (req, res) => {
    const playerId = req.params.playerId;
    try {
        // Fetch player data including the image URL
        const playerData = await puppeteerCrawl.getPlayerData(playerId); // Implement this function in puppeteerCrawl.js
        const imageUrl = playerData.photo; // Assuming the player data includes a 'photo' field with the image URL

        // Fetch the image content
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.buffer();

        // Set appropriate response headers
        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache the image for one year (adjust as needed)

        // Send the image content as the response
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error fetching player image:', error);
        res.status(500).send('Error fetching player image');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

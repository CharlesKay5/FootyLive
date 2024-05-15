const express = require('express');
const puppeteerCrawl = require('./crawlerAPI.js'); // Importing your logic file
const fixtureCrawl = require('./fixtureAPI.js'); // Importing your logic file
const randomUsername = require('./public/randomUsername.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const compression = require('compression');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const uuid = require('uuid');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 5000;
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', ws => {
    ws.on('message', message => {
        // Broadcast the message to all clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

// Serve static files including CSS
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(compression());
app.use(bodyParser.json());
app.use((req, res, next) => {
    // Assign a unique identifier to each user session    
    req.userId = uuid.v4();
    next();
});

const serverStartTime = Date.now();
app.get('/server-start-time', (req, res) => {
    res.json({ serverStartTime });
});


app.get('/new-user-id', (req, res) => {
    const userId = randomUsername.getRandomUsername();
    res.json({ userId });
});

let usernames = {};

// Route to check if a username is taken
app.get('/check-username/:username', (req, res) => {
    const username = req.params.username;
    const isTaken = usernames.hasOwnProperty(username) && usernames[username].isTaken;
    res.json({ isTaken });
});

// Route to update the username
app.post('/update-username', (req, res) => {
    const { userId, newUsername } = req.body;
    if (usernames.hasOwnProperty(newUsername) && usernames[newUsername].isTaken) {
        res.json({ success: false });
    } else {
        // Remove the old username
        Object.keys(usernames).forEach(id => {

            if (usernames[userId]) {
                usernames[userId].isTaken = false;
            }
        });
        // Add the new username
        usernames[newUsername] = { userId, isTaken: true };
        res.json({ success: true });
    }
});

let chats = {};

app.post('/update-chat', (req, res) => {
    const { link, message } = req.body;
    if (!chats[link]) {
        chats[link] = [];
    }
    if (chats[link].length > 100) {
        chats[link].shift();

    }
    chats[link].push(message);

    res.json({ status: 'success' });
});

app.get('/get-all-chats', (req, res) => {
    res.json(chats);
});

//const fixtureURL = "https://www.afl.com.au/fixture";
const fixtureURL = "https://www.afl.com.au/fixture?Competition=1&Season=62&Round=963";


let fixture = { games: [] }; // Initialize fixture data
let links = []; // Array to store links
let link = '';
const baseURL = `https://www.afl.com.au/afl/matches/${link}`;


async function updateFixtureData() {
    try {
        const data = { games: [] };
        await fixtureCrawl(fixtureURL, data);
        fixture = data; // Update fixture data
        links = fixture.games.map(game => game.link);
        links.forEach(link => updatePlayerStats(link));
    } catch (error) {
        console.error('Error fetching fixture data:', error);
    }
}
//setInterval(updateFixtureData, 30000);


app.post('/game-link', (req, res) => {
    link = req.body.link; // Store the received value in the link variable

    updatePlayerStats(link);
    res.json({ status: 'success' });
});




app.get('/trimmedLink', (req, res) => {
    res.json(link.split("/").pop());
});



app.get('/fixture/:link', async (req, res) => {
    const link = req.params.link;
    const trimmedLink = link.split("/").pop();

    try {
        // Fetch player data from /player-stats endpoint using axios
        const response = await axios.get(`http://localhost:5000/${trimmedLink}/player-stats`);
        if (!response.data) {
            throw new Error('Failed to fetch player data');
        }
        const playerData = response.data; // Use a local variable instead of a global one

        // Read index.html file
        const indexPath = path.join(__dirname, 'public', 'index.html');
        let indexHtml = fs.readFileSync(indexPath, 'utf-8');

        // Replace placeholder in index.html with player data
        indexHtml = indexHtml.replace('<!-- {{playerData}} -->', JSON.stringify(playerData));
        indexHtml = indexHtml.replace('{{trimmedLink}}', trimmedLink);

        // Send modified index.html with player data
        res.send(indexHtml);
    } catch (error) {
        console.error('Error fetching player data:', error);
        res.status(500).send('Internal Server Error');
    }
});

updateFixtureData();
//setInterval(updateFixtureData, 60000);

app.get('/fixture', (req, res) => {
    const fixturePath = path.join(__dirname, 'public', 'fixture.html');
    res.sendFile(fixturePath);
});

app.get('/fixture-data', (req, res) => {
    res.json(fixture);
});

app.get('/fixture-links', (req, res) => {
    res.json(links);
});

let playerStats = {}; // Change this to an object

async function updatePlayerStats(url) {
    try {
        const data = {
            players: []
        };

        const stats = await puppeteerCrawl(url, data);
        const link = url.split("/").pop(); // Extract the link from the url
        playerStats[link] = stats; // Store the stats under the link key
    } catch (error) {
        console.error('Error fetching player stats:', error);
    }
}

app.get('/:link/player-stats', (req, res) => {
    const link = req.params.link;
    if (playerStats[link]) {
        res.json(playerStats[link]); // Send the stats for the specific link
    } else {
        res.status(500).json({ error: 'Player stats not found for this link' });
    }
});

// Update player stats every 10 seconds
//setInterval(updatePlayerStats(baseURL), 10000);
//updatePlayerStats(baseURL);
//setInterval(() => updatePlayerStats(baseURL), 10000);

let iconsState = {};

app.post('/update-icon', (req, res) => {
    const { playerId, icon } = req.body;
    iconsState[playerId] = icon;

    res.json({ status: 'success' });
});

app.get('/get-all-icons', (req, res) => {
    res.json(iconsState);
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

const express = require('express');
const puppeteerCrawl = require('./crawlerAPI.js');
// const fetchStats = require('./fetchStats.js');
// const fetchFixture = require('./fetchFixture.js');
const fixtureCrawl = require('./fixtureAPI.js');
const randomUsername = require('./randomUsername.js');
const dtliveChat = require('./dtliveChatAPI.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const compression = require('compression');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const uuid = require('uuid');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/scoringTimeline');
// mongoose.connect('mongodb+srv://charleskay5:aJ9o4v7pDkiGp7sW@scoringtimelinecluster.fgr38ho.mongodb.net/?retryWrites=true&w=majority&appName=ScoringTimelineCluster');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Connected to MongoDB');
});

const app = express();
const port = process.env.PORT || 5000;



// Correct way to initialize WebSocket server listening on a specific port
const wss = new WebSocket.Server({ port: process.env.WS_PORT || 8080 });

wss.on('connection', (ws, request) => {

    const ip = request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];

    // Log the device information
    console.log(`New connection from ${ip}, User-Agent: ${userAgent}`);

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
app.use(express.static(path.join(__dirname, '..', '/public-puppeteer-method'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public-puppeteer-method, no-store'); // Cache for 5 days
        } else if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.gif')) {
            // Cache images for 5 days
            res.setHeader('Cache-Control', 'public-puppeteer-method, max-age=432000');
        }
        res.setHeader('ETag', true); // Enable ETag
        res.setHeader('Last-Modified', true); // Enable Last-Modified
    }
}));

app.use(compression());
app.use(bodyParser.json());
app.use((req, res, next) => {
    // Assign a unique identifier to each user session    
    req.userId = uuid.v4();
    next();
});
app.use((req, res, next) => {
    if (req.path.substr(-1) === '/' && req.path.length > 1) {
        const query = req.url.slice(req.path.length);
        res.redirect(301, req.path.slice(0, -1) + query);
    } else {
        next();
    }
});

// app.get('/', (req, res) => {
//     res.redirect('/fixture');
// });


const serverStartTime = Date.now();
app.get('/server-start-time', (req, res) => {
    res.json({ serverStartTime });
});

app.get('/new-user-id', (req, res) => {
    const userId = randomUsername.getRandomUsername();
    res.json({ userId });
});

let usernames = new Map();

// Route to check if a username is taken
app.get('/check-username/:username', (req, res) => {
    const username = req.params.username;
    fs.readFile('usernames.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'An error occurred while reading the file.' });
            return;
        }
        usernames = new Map(Object.entries(JSON.parse(data)));
    });
    const isTaken = usernames.has(username) && usernames.get(username).isTaken;
    res.json({ isTaken });
});

// Route to update the username
app.post('/update-username', (req, res) => {
    const { userId, newUsername } = req.body;
    const filteredUsername = filterProfanity(newUsername);

    if (filteredUsername.includes('*')) {
        return res.json({ success: false, message: 'Username contains profanity.' });
    }

    if (usernames.has(filteredUsername) && usernames.get(filteredUsername).isTaken) {
        res.json({ success: false });
    } else {
        // Remove the old username
        for (let [username, user] of usernames) {
            if (user.userId === userId) {
                user.isTaken = false;
            }
        }
        // Add the new username
        usernames.set(filteredUsername, { userId, isTaken: true });

        fs.promises.writeFile('usernames.json', JSON.stringify(Object.fromEntries(usernames)), (err) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'An error occurred while writing to the file.' });
                return;
            }
        });
        res.json({ success: true });
    }
});

let chats = {};


// Route to update the chat
app.post('/update-chat', (req, res) => {
    const { link, message } = req.body;
    const filteredMessage = filterProfanity(message);

    if (!chats[link]) {
        chats[link] = [];
    }
    if (chats[link].length > 100) {
        chats[link].shift();
    }
    chats[link].push(filteredMessage);

    res.json({ status: 'success' });
});

// Route to get all chats
app.get('/get-all-chats', (req, res) => {
    res.json(chats);
});

/////////////////


app.get('/dtlive-chat/:link', async (req, res) => {
    const trimmedLink = req.params.link;
    try {
        const response = await fetch(`https://dtlive.com.au/afl/xml/G${trimmedLink - 3032}-CG1Chat.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const cleanedData = data.map(({ UserName, ChatText, ChatID }) => ({
            UserName: filterProfanity(UserName),
            ChatText: filterProfanity(ChatText),
            ChatID
        }));

        res.set('Cache-Control', 'no-store');
        res.json(cleanedData);
    } catch (error) {
        console.error('Error fetching or processing chat data:', error);
        res.status(500).send('Internal Server Error');
    }
});











////////////////

const fixtureURL = "https://www.afl.com.au/fixture";
// 964 = round 10
// const fixtureURL = "https://www.afl.com.au/fixture?Competition=1&Season=62&Round=964";

let fixture = { games: [] }; // Initialize fixture data
let links = []; // Array to store links
let link = '';
let scoringTimeline = {}; // Declare scoringTimeline here

async function updateFixtureData() {
    try {
        const data = { games: [] };
        await fixtureCrawl(fixtureURL, data);

        // const data = await fetchFixture();

        fixture = data; // Update fixture data
        
        // Puppeteer setup
        for (const game of fixture.games.filter(game => game.live == 0)) {
            await updatePlayerStats(game.link);
        }
        // Fetch setup
        // for (const game of fixture.games) {
        //     if (game.live === 0) {
        //         console.log("Updating stats for " + game.link);
        //         await updatePlayerStats(game.link);
        //     }
        // }
        // Call broadcastMessage after all player stats have been updated
        broadcastMessage('playerDataChanged');
    } catch (error) {
        console.error('Error fetching fixture data:', error);
    }
}
setInterval(updateFixtureData, 1200000);

async function updateLiveFixtureData() {
    console.log("UPDATING LIVE FIXTURES")
    // Filter live games
    const liveGames = fixture.games.filter(game => game.live == 1);

    // If no live games, return early
    if (liveGames.length === 0) {
        console.log("No live games at the moment.");
        return;
    }

    try {
        // Use the fixture data that was already fetched by updateFixtureData
        const updatePromises = liveGames.map(game => updatePlayerStats(game.link));

        await Promise.all(updatePromises);
        broadcastMessage("playerDataChanged");
    }
    catch (error) {
        console.error('Error updating live fixture data:', error);
    }
}
setInterval(updateLiveFixtureData, 45000);

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
        const filePath = path.join(matchesFolderPath, `${trimmedLink}.json`);
        if (!fs.existsSync(filePath)) {
            throw new Error('Player stats file not found');
        }
        const playerData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));


        // Read index.html file
        const indexPath = path.join(__dirname, '..', 'public-puppeteer-method', 'index.html');
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

app.get('/fixture', (req, res) => {
    const fixturePath = path.join(__dirname, 'fixture.html');
    res.sendFile(fixturePath);
});

app.get('/fixture-data', (req, res) => {
    res.json(fixture);
});

app.get('/fixture-links', (req, res) => {
    res.json(links);
});

app.get('/previous-fixtures', (req, res) => {
    const matchesFolderPath = path.join(__dirname, 'matches');

    fs.readdir(matchesFolderPath, (err, files) => {
        if (err) {
            console.error('Error reading matches folder:', err);
            res.status(500).json({ error: 'Error reading matches folder' });
            return;
        }

        const fixtureData = [];
        files.forEach(file => {
            const filePath = path.join(matchesFolderPath, file);
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                fixtureData.push(data);
            } catch (error) {
                console.error('Error reading fixture file:', error);
            }
        });

        res.json(fixtureData);
    });
});



let playerStats = {};

const matchesFolderPath = path.join(__dirname, 'matches');

if (!fs.existsSync(matchesFolderPath)) {
    fs.mkdirSync(matchesFolderPath);
}
// async function updatePlayerStats(trimmedLink) {
async function updatePlayerStats(url) {
    try {
        const data = {
            players: []
        };

        const stats = await puppeteerCrawl(url, data);

        // console.log("Fetching stats...");
        // // const stats = await fetchStats(trimmedLink);

        // console.log("Stats fetched!");
        
        const link = url.split("/").pop();

        // const link = trimmedLink;
        if (!playerStats[link]) {
            playerStats[link] = { players: [] };
        }

        const newPlayerData = stats.players;
        // Puppeteer setup
        const newPlayerIds = newPlayerData.map(p => `${p.name}-${p.number}`);
        playerStats[link].players = playerStats[link].players.filter(p => newPlayerIds.includes(`${p.name}-${p.number}`));

        // Fetch setup 
        // const newPlayerIds = newPlayerData.map(p => p.playerID);
        // // Filter out players from the existing player data that are not present in the new data
        // playerStats[link].players = playerStats[link].players.filter(p => newPlayerIds.includes(p.playerID));


        await Promise.all(newPlayerData.map(async (newPlayer) => {
            const playerId = `${newPlayer.name}-${newPlayer.number}`;
            const oldPlayer = playerStats[link].players.find(p => `${p.name}-${p.number}` === playerId);

            const differences = calculateDifferences(newPlayer, oldPlayer);
            const timelineUpdates = updateScoringTimeline(newPlayer, differences);

            if (!scoringTimeline[playerId]) {
                scoringTimeline[playerId] = [];
            }
            scoringTimeline[playerId] = scoringTimeline[playerId].concat(timelineUpdates);

            // Update player data
            const playerIndex = playerStats[link].players.findIndex(p => `${p.name}-${p.number}` === playerId);
            if (playerIndex > -1) {
                playerStats[link].players[playerIndex] = newPlayer;
            } else {
                playerStats[link].players.push(newPlayer);
            }

            const filePath = path.join(matchesFolderPath, `${link}.json`);
            await fs.promises.writeFile(filePath, JSON.stringify(stats));
        }));

    } catch (error) {
        console.error('Error fetching player stats:', error);
    }
}

function broadcastMessage(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function calculateDifferences(newPlayer, oldPlayer) {
    const differences = {};

    if (oldPlayer) {
        const keys = ['goals', 'behinds', 'kicks', 'handballs', 'marks', 'tackles', 'hitouts', 'fantasy', 'freesfor', 'freesagainst'];
        keys.forEach(key => {
            differences[key] = newPlayer[key] - oldPlayer[key];
        });
    } else {
        Object.keys(newPlayer).forEach(key => {
            differences[key] = 0;
        });
    }

    return differences;
}

let existingData = {};
const { PlayerStat, Round } = require('./models.js');

async function updateScoringTimeline(newPlayer, differences) {
    const scoringTimeline = [];
    const playerId = `${newPlayer.name}-${newPlayer.number}`;

    for (const [key, value] of Object.entries(differences)) {
        if (value !== 0 && key !== 'fantasy' && Number.isInteger(value)) {
            let fantasy = 0;
            let keyShorthand;
            const timeArray = newPlayer.time.split(' ');
            let quarter = timeArray[1][1];
            switch (timeArray[0]) {
                case 'QTR': quarter = 1; break;
                case '3QT': quarter = 3; break;
                case 'Full': quarter = 4; break;
                case 'Half': quarter = 2; break;
            }
            switch (quarter) {
                case 'A': quarter = 2; break;
                case 'T': quarter = 1; break;
            }

            const time = timeArray[2];
            if (time == "TIME") {
                time == "30:00";
            }
            if (!time) continue;

            switch (key) {
                case "goals": fantasy += (value * 6); keyShorthand = 'g'; break;
                case "behinds": fantasy += (value * 1); keyShorthand = 'b'; break;
                case "kicks": fantasy += (value * 3); keyShorthand = 'k'; break;
                case "handballs": fantasy += (value * 2); keyShorthand = 'h'; break;
                case "marks": fantasy += (value * 3); keyShorthand = 'm'; break;
                case "tackles": fantasy += (value * 4); keyShorthand = 't'; break;
                case "hitouts": fantasy += (value * 1); keyShorthand = 'ho'; break;
                case "freesfor": fantasy += (value * 1); keyShorthand = 'ff'; break;
                case "freesagainst": fantasy -= (value * 3); keyShorthand = 'fa'; break;
                default:
                    continue;
            }

            scoringTimeline.push({
                playerId,
                quarter,
                time,
                stat: keyShorthand,
                difference: value,
                fantasy,
            });
        }
    }

    const round = newPlayer.round;

    for (const item of scoringTimeline) {
        await Round.findOneAndUpdate(
            { round },
            { $push: { stats: item } },
            { upsert: true, new: true }
        );
    }

    return scoringTimeline;
}

app.get('/player-stats/:link', (req, res) => {
    const link = req.params.link;
    if (playerStats[link]) {
        // Send the stats from memory
        res.json(playerStats[link]);
    } else {
        // Fallback to reading the stats from the file in the matches folder
        const filePath = path.join(matchesFolderPath, `${link}.json`);
        if (fs.existsSync(filePath)) {
            try {
                const playerData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                res.json(playerData);
            } catch (error) {
                console.error('Error reading player stats from file:', error);
                res.status(500).json({ error: 'Error reading player stats from file' });
            }
        } else {
            res.status(404).json({ error: 'Player stats not found for this link' });
        }
    }
});


app.get('/scoringTimeline/:playerId/:round', async (req, res) => {
    const playerId = req.params.playerId;
    const round = req.params.round;

    try {
        const roundData = await Round.findOne({ round }).lean();
        if (!roundData) {
            return res.json([]);
        }

        const playerData = roundData.stats.filter(player => player.playerId === playerId);
        if (!playerData.length) {
            return res.status(404).json({ error: `No data found for player ${playerId} in round ${round}` });
        }

        res.json(playerData);
    } catch (error) {
        console.error('Error fetching timeline data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Route for serving player images
app.get('/player-image/:playerId', (req, res) => {
    const playerId = req.params.playerId;
    const imagePath = path.join(__dirname, 'images', `${playerId}.png`);

    fs.readFile(imagePath, (err, data) => {
        if (err) {
            console.error('Error fetching player image:', err);
            res.status(500).send('Error fetching player image');
            return;
        }

        // Set appropriate response headers
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public-puppeteer-method, max-age=432000'); // Cache the image for 5 days

        // Send the image content as the response
        res.send(data);
    });
});

// app.get('/player-image/:playerId', async (req, res) => {
//     const playerId = req.params.playerId;
//     try {
//         // Fetch player data including the image URL
//         const playerData = await puppeteerCrawl.getPlayerData(playerId); // Implement this function in puppeteerCrawl.js
//         const imageUrl = playerData.photo; // Assuming the player data includes a 'photo' field with the image URL

//         // Fetch the image content
//         const imageResponse = await fetch(imageUrl);
//         const imageBuffer = await imageResponse.buffer();

//         // Set appropriate response headers
//         res.set('Content-Type', 'image/jpeg');
//         res.set('Cache-Control', 'public-puppeteer-method, max-age=432000'); // Cache the image for 5 days

//         // Send the image content as the response
//         res.send(imageBuffer);
//     } catch (error) {
//         console.error('Error fetching player image:', error);
//         res.status(500).send('Error fetching player image');
//     }
// });



let iconsState = {};

app.post('/update-icon', (req, res) => {
    const { playerId, icon } = req.body;
    iconsState[playerId] = icon;

    res.json({ status: 'success' });
});

app.post('/remove-icon', (req, res) => {
    const playerId = req.body.playerId;
    delete iconsState[playerId];

    res.sendStatus(200);
});

app.get('/get-all-icons', (req, res) => {
    res.json(iconsState);
});

const profanityList = require('./BannedList.js');

const letterSubstitutions = {
    '3': ['e'],
    '4': ['a'],
    '@': ['a'],
    '5': ['s'],
    '1': ['l', 'i'],
    '7': ['t'],
    '8': ['b'],
    '9': ['g'],
    '0': ['o'],
    '2': ['z']
};

function applySubstitutions(word) {
    let substitutedWord = '';
    for (const letter of word.toLowerCase()) {
        if (letterSubstitutions.hasOwnProperty(letter)) {
            const substitutions = letterSubstitutions[letter];
            substitutedWord += substitutions[Math.floor(Math.random() * substitutions.length)];
        } else {
            substitutedWord += letter;
        }
    }
    return substitutedWord;
}

function normalizeMessage(message) {
    return message.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function isProfanitySubstitute(word) {
    const substitutedWord = applySubstitutions(word);
    const normalizedWord = normalizeMessage(substitutedWord);
    for (const profanity of profanityList) {
        if (normalizedWord.includes(profanity)) {
            return true;
        }
    }
    return false;
}

function filterProfanity(message) {
    let words = message.split(' ');
    for (let i = 0; i < words.length; i++) {
        if (isProfanitySubstitute(words[i])) {
            words[i] = '*'.repeat(words[i].length);
        }
    }

    // Check the entire message for spaced out profanity
    const normalizedMessage = normalizeMessage(message);
    for (const profanity of profanityList) {
        if (normalizedMessage.includes(profanity)) {
            return '*'.repeat(message.length);
        }
    }

    return words.join(' ');
}

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});
const fs = require("fs");
const path = require('path');
const xml2js = require('xml2js');
const { response } = require("express");

const data = {
    players: []
};

// Dtlive gameID = AFL gameID - 3032
async function getLiveChat(AFLgameID) {
    const gameID = AFLgameID - 3032;
    try {
        const response = await fetch(`https://dtlive.com.au/afl/xml/G${gameID}-CG1Chat.json`, {
            headers: {
                "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "Referer": `https://dtlive.com.au/afl/livescores.php?GameID=${gameID}`,
            },
            method: "GET"
        });
        const fetchedData = await response.text();
        return fetchedData;
    } catch (error) {
        console.error('Error fetching or writing data:', error);
    }
}

async function logLiveChat() {
    try {
        const chatData = await getLiveChat(6001);
        // Assuming chatData is a JSON string with an array of messages
        const parsedData = JSON.parse(chatData);
        const filteredData = parsedData.map(({ UserName, ChatText, ChatID }) => ({
            UserName,
            ChatText,
            ChatID
        }));

        // Define the path for the output file
        const outputPath = path.join(__dirname, 'chatData.json');

        // Write the filtered chat data to a file
        fs.writeFile(outputPath, JSON.stringify(filteredData, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('Filtered chat data successfully written to chatData.json');
            }
        });
    } catch (error) {
        console.error('Error logging data:', error);
    }
}

logLiveChat();
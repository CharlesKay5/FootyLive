const fs = require("fs");
const path = require('path');

const playerData = {
    players: []
};

const positionMapping = {
    1: 'def',
    2: 'mid',
    3: 'ruc',
    4: 'fwd',
};

const teamMapping = {
    10: 'Adelaide',
    20: 'Brisbane',
    30: 'Carlton',
    40: 'Collingwood',
    50: 'Essendon',
    60: 'Freemantle',
    70: 'Geelong',
    1000: 'GoldCoast',
    1010: 'GWSGiants',
    80: 'Hawthorn',
    90: 'Melbourne',
    100: 'NorthMelbourne',
    110: 'PortAdelaide',
    120: 'Richmond',
    130: 'StKilda',
    160: 'Sydney',
    150: 'WestCoast',
    140: 'WesternBulldogs',
};
const specialNames = {
    "M.O'Connor" : "M.OConnor",
    "S.De Koning" : "S.Koning",
    "J.Kolodjashnij" : "J.K-jashnij",
    "W.Hoskin-Elliott" : "W.H-Elliott",
    "J.van Rooyen" : "J.Rooyen",
    "J.O'Donnell" : "J.ODonnell",
    "M.D'Ambrosio" : "M.DAmbrosio",
    "X.O'Halloran" : "X.OHalloran",
    "J.O'Meara" : "J.OMeara",
  };

function fetchData(player) {
    return {
        name: specialNames[player.first_name[0] + '.' + player.last_name] || player.first_name[0] + '.' + player.last_name,
        team: teamMapping[player.squad_id],
        fantasyAvg: player.avg_points,
        price: `${player.cost}`,
        position: player.positions.map(pos => positionMapping[pos]).join('/').toUpperCase(),
    };
}

async function fetchPlayerData() {
    try {
        const response = await fetch(`https://fantasy.afl.com.au/data/afl/players.json`, {
            headers: {
                "Content-Type": "application/json"
            },
            method: "GET"
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.map(player => fetchData(player));
    } catch (error) {
        console.error(error);
    }
}

// fetchPlayerData();
module.exports = fetchPlayerData;

const fs = require("fs");
const path = require('path');
// const fetch = require('node-fetch');

const playerData = {
    players: []
};

// let trimmedLink = 2970;

function fetchData(players, teamName, teamType, gameDetails, trimmedLink) {
    return Object.values(players).map(player => ({
        playerID: `${player.name}-${player.jumperNumber}`,
        number: player.jumperNumber,
        name: player.name,
        goals: player.goal,
        behinds: player.behind,
        kicks: player.kick,
        handballs: player.handball,
        marks: player.mark,
        tackles: player.tackle,
        hitouts: player.hitOut,
        tog: player.eTOGPercentage,
        fantasy: player.aflFantasy,
        fantasyAvg: player.aflFantasyAverage,
        team: teamType,
        teamName: teamName,
        url: null,
        teamScore: `${gameDetails[`${teamType ? 'away' : 'home'}TeamGoal`]}.${gameDetails[`${teamType ? 'away' : 'home'}TeamBehind`]}`,
        teamScoreTotal: parseInt(gameDetails[`${teamType ? 'away' : 'home'}TeamGoal`]) * 6 + parseInt(gameDetails[`${teamType ? 'away' : 'home'}TeamBehind`]),
        time: gameDetails.currentTime,
        sub: player.selection === "SUB" ? 1 : 0,
        breakeven: player.aflFantasyBreakEven,
        price: `${player.aflFantasyPrice},000`,
        position: player.aflFantasyPosition,
        benched: player.currentBench === "N" ? 0 : 1,
        injured: player.iconImage === "redcross.png" ? 1 : 0,
        subbedout: player.iconImage === "redvest.png" ? 1 : 0,
        tagged: player.iconImage === "padlock.png" ? 1 : 0,
        tagger: player.iconImage === "tag.png" ? 1 : 0,
        freesfor: player.freeFor,
        freesagainst: player.freeAgainst,
        round: gameDetails.round,
        date: 0, // Unsure how to find
        trimmedLink: trimmedLink,
    }));
};



function fetchPlayerData(trimmedLink) {
    return fetch(`https://new.dtlive.com.au/storage/games/${trimmedLink}.json`, {
        headers: {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "Referer": `https://new.dtlive.com.au/games/${trimmedLink}`,
        },
        body: null,
        method: "GET"
    })
    .then(response => response.text())
    .then(async data => {
        // console.log(data);
        const jData = JSON.parse(data);
    
        const homePlayers = fetchData(jData.home.players, jData.gameDetails.homeTeamName, 0, jData.gameDetails, trimmedLink);
        const awayPlayers = fetchData(jData.away.players, jData.gameDetails.awayTeamName, 1, jData.gameDetails, trimmedLink);
        
        
        playerData.players = [...homePlayers, ...awayPlayers];
        // console.log(playerData);
        return playerData;
    
        // await fs.promises.writeFile('fetchedStats.json', JSON.stringify(playerData));
    })
    .catch(error => {
        console.error(error);
    });
}

fetchPlayerData(2863);
module.exports = fetchPlayerData;

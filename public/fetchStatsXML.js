const fs = require("fs");
const path = require('path');
const xml2js = require('xml2js')
const parser = new xml2js.Parser();
// const fetch = require('node-fetch');

const playerData = {
    players: []
};

// let trimmedLink = 2970;

function fetchData(players, teamName, teamType, gameDetails, trimmedLink) {
    return Object.values(players).map(player => ({
        playerID: `${player.Name[0]}-${player.JumperNumber[0]}`,
        number: player.JumperNumber[0],
        name: player.Name[0],
        goals: player.Goal[0],
        behinds: player.Behind[0],
        kicks: player.Kick[0],
        handballs: player.Handball[0],
        marks: player.Mark[0],
        tackles: player.Tackle[0],
        hitouts: player.Hitout[0],
        tog: player.TOGPerc[0],
        fantasy: player.DT[0],
        fantasyAvg: player.FantasyAvg[0],
        team: teamType[0],
        teamName: teamName[0],
        url: null,
        teamScore: `${gameDetails[`${teamType ? 'Away' : 'Home'}TeamGoal`]}.${gameDetails[`${teamType ? 'Away' : 'Home'}TeamBehind`]}`,
        teamScoreTotal: parseInt(gameDetails[`${teamType ? 'Away' : 'Home'}TeamGoal`]) * 6 + parseInt(gameDetails[`${teamType ? 'Away' : 'Home'}TeamBehind`]),
        time: "Q" + gameDetails.CurrentQuarter + " " + gameDetails.CurrentTime[0],
        sub: (player.IconImage && player.IconImage.length > 0 && player.IconImage[0] === "greenvest.png") ? 1 : 0,
        breakeven: player.FantasyBE[0],
        price: `${player.FantasyPrice[0]},000`,
        position: "Position Unknown",
        benched: player.CurrentBench[0] === "N" ? 0 : 1,
        injured: (player.IconImage && player.IconImage.includes("redcross.png")) ? 1 : 0,
        subbedout: (player.IconImage && player.IconImage.includes("redvest.png")) ? 1 : 0,
        tagged: (player.IconImage && player.IconImage.includes("padlock.png")) ? 1 : 0,
        tagger: (player.IconImage && player.IconImage.includes("tag.png")) ? 1 : 0,
        freesfor: player.FreeFor[0],
        freesagainst: player.FreeAgainst[0],
        round: gameDetails.Round[0],
        date: 0, // Unsure how to find
        trimmedLink: trimmedLink,
    }));
};

function fetchPlayerData(trimmedLink) {
    return new Promise((resolve, reject) => {
        fetch(`https://dtlive.com.au/afl/xml/${trimmedLink}.xml`, {
            headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "Referer": `https://dtlive.com.au/afl/livescores.php?GameID=${trimmedLink}`,
            },
            body: null,
            method: "GET"
        })
            .then(response => response.text())
            .then(async str => {
                const sanitizeXmlString = (xmlString) => {
                    // Remove characters that are not letters, numbers, or allowed special characters
                    return xmlString.replace(/[^\w\s\.,:<>[\]{}\/\\]/g, '');
                };

                parser.parseString(sanitizeXmlString(str), (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const json = result;
                    const homePlayers = fetchData(json.xml.Home[0].Player, json.xml.Game[0].HomeTeam[0], 0, json.xml.Game[0], trimmedLink);
                    const awayPlayers = fetchData(json.xml.Away[0].Player, json.xml.Game[0].AwayTeam[0], 1, json.xml.Game[0], trimmedLink);

                    playerData.players = [...homePlayers, ...awayPlayers];
                    resolve(playerData);
                });
            })
            .catch(error => {
                reject(error);
            });
    });
}


module.exports = fetchPlayerData;

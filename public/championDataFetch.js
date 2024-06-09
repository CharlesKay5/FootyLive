
const fs = require("fs");

const playerData = {
    players: []
};

function cdFetch() {
    return fetch("https://api.afl.com.au/cfs/afl/playerStats/match/CD_M20240141307", {
        headers: {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "if-none-match": "W/\"e55977d00bab7b80714d79470b2d1e53\"",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "x-media-mis-token": "570a05cdee961a4fd72c13a3754d6aa0",
            "Referer": "https://www.afl.com.au/",
        },
        "body": null,
        "method": "GET"
    })
        .then(response => response.text())
        .then(async data => {
            const jData = JSON.parse(data);

            // playerData.players = jData.players.map(player => ({
            //     playerID:
            // }));
            var player = {
                number: 0,
                name: 0,
                goals: 0,
                behinds: 0,
                kicks: 0,
                handballs: 0,
                marks: 0,
                tackles: 0,
                hitouts: 0,
                tog: 0,
                fantasy: 0,
                fantasyAvg: 0,
                team: 0,
                teamName: 0,
                url: 0,
                teamScore: 0,
                teamScoreTotal: 0,
                time: 0,
                sub: 0,
                breakeven: 0,
                price: 0,
                position: 0,
                benched: 0,
                injured: 0,
                freesfor: 0,
                freesagainst: 0,
                round: 0,
                date: 0,
                trimmedLink: 0,
            }

            let firstName = jData.homeTeamPlayerStats[0].player.player.player.playerName.givenName;
            let lastName = jData.homeTeamPlayerStats[0].player.player.player.playerName.surname;
            player.name = firstName.charAt(0) + "." + lastName;
            player.number = jData.homeTeamPlayerStats[0].player.player.player.playerJumperNumber;


            player.goals = jData.homeTeamPlayerStats[0].playerStats.stats.goals;
            player.behinds = jData.homeTeamPlayerStats[0].playerStats.stats.behinds;
            player.kicks = jData.homeTeamPlayerStats[0].playerStats.stats.kicks;
            player.handballs = jData.homeTeamPlayerStats[0].playerStats.stats.handballs;
            player.marks = jData.homeTeamPlayerStats[0].playerStats.stats.marks;
            player.tackles = jData.homeTeamPlayerStats[0].playerStats.stats.tackles;
            player.hitouts = jData.homeTeamPlayerStats[0].playerStats.stats.hitouts;
            player.tog = jData.homeTeamPlayerStats[0].playerStats.timeOnGroundPercentage;
            player.fantasy = jData.homeTeamPlayerStats[0].playerStats.stats.dreamTeamPoints;
            // player.fantasyAvg = jData.homeTeamPlayerStats[0].playerStats.stats.dreamTeamAverage;
            player.team = 0;
            player.teamName = jData.homeTeamPlayerStats[0].teamId;
            player.url = jData.homeTeamPlayerStats[0].player.photoURL;
            // player.teamScore = jData.homeTeamPlayerStats[0].teamScore;
            // player.teamScoreTotal = jData.homeTeamPlayerStats[0].teamScoreTotal;
            // player.time = 
            player.sub = jData.homeTeamPlayerStats[0].player.player.position === "SUB" ? 1 : 0;
            // player.breakeven = jData.homeTeamPlayerStats[0].breakeven;
            // player.price = jData.homeTeamPlayerStats[0].price;
            // player.position = jData.homeTeamPlayerStats[0].position;
            // player.benched = jData.homeTeamPlayerStats[0].benched;
            // player.injured = jData.homeTeamPlayerStats[0].injured;
            player.freesfor = jData.homeTeamPlayerStats[0].playerStats.stats.freesFor;
            player.freesagainst = jData.homeTeamPlayerStats[0].playerStats.stats.freesAgainst;
            // player.round = jData.homeTeamPlayerStats[0].round;
            // player.date = jData.homeTeamPlayerStats[0].date;
            // player.trimmedLink = jData.homeTeamPlayerStats[0].trimmedLink;







            console.log(player);
            // await fs.promises.writeFile('championData.json', data);
        })
        .catch(error => {
            console.error(error);
        });
}


cdFetch();

//         playerID: `${player.name}-${player.jumperNumber}`,
//         number: player.jumperNumber,
//         name: player.name,
//         goals: player.goal,
//         behinds: player.behind,
//         kicks: player.kick,
//         handballs: player.handball,
//         marks: player.mark,
//         tackles: player.tackle,
//         hitouts: player.hitOut,
//         tog: player.eTOGPercentage,
//         fantasy: player.aflFantasy,
//         fantasyAvg: player.aflFantasyAverage,
//         team: teamType,
//         teamName: teamName,
//         url: null,
//         teamScore: `${gameDetails[`${teamType ? 'away' : 'home'}TeamGoal`]}.${gameDetails[`${teamType ? 'away' : 'home'}TeamBehind`]}`,
//         teamScoreTotal: parseInt(gameDetails[`${teamType ? 'away' : 'home'}TeamGoal`]) * 6 + parseInt(gameDetails[`${teamType ? 'away' : 'home'}TeamBehind`]),
//         time: gameDetails.currentTime,
//         sub: player.selection === "SUB" ? 1 : 0,
//         breakeven: player.aflFantasyBreakEven,
//         price: `${player.aflFantasyPrice},000`,
//         position: player.aflFantasyPosition,
//         benched: player.currentBench === "N" ? 0 : 1,
//         injured: player.iconImage === "redcross.png" ? 1 : 0,
//         subbedout: player.iconImage === "redvest.png" ? 1 : 0,
//         tagged: player.iconImage === "padlock.png" ? 1 : 0,
//         tagger: player.iconImage === "tag.png" ? 1 : 0,
//         freesfor: player.freeFor,
//         freesagainst: player.freeAgainst,
//         round: gameDetails.round,
//         date: 0, // Unsure how to find
//         trimmedLink: trimmedLink,
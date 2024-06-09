// =======================================
// import node modules
// =======================================
const fs = require("fs");
const path = require('path');
const puppeteer = require("puppeteer");
require('dotenv').config();


async function supercoachCrawl() {
    const supercoachScores = fetch("https://supercoach.heraldsun.com.au/2024/api/afl/classic/v1/players-cf?embed=notes%2Codds%2Cplayer_stats%2Cpositions&round=10&xredir=1", {
        headers: {
            "accept": "application/json",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "authorization": "Bearer 7b991d44a5c09b7f12948123ea198da1896afcca",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "Referer": "https://supercoach.heraldsun.com.au/afl/classic/team/field",
        },
        body: null,
        method: "GET"
    }).then(data => data.text())
        .then(data => {
            let jData = JSON.parse(data);
            let result = jData.map(player => ({
                playerName: player.first_name.charAt(0) + '.' + player.last_name,
                livepts: player.player_stats[0].livepts,
                supercoachPrice: player.player_stats[0].price,
            }));
            //console.log(result);
            return result;
            //fs.promises.writeFile('fetchedStats.json', JSON.stringify(result));
        })
        .catch(error => {
            console.error(error);
        });
    return supercoachScores;
}

async function subsCrawl(baseURL, data, browser, callback) {
    console.log(`Crawling subs for ${baseURL.split('/').pop()}`);
    const statsURL = `${baseURL}#player-stats`;

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    //await page.goto(`https://www.afl.com.au/matches/team-lineups?GameWeeks=10`, { "waitUntil": "networkidle0" });
    await page.goto(`https://www.afl.com.au/matches/team-lineups`, { "waitUntil": "networkidle0" });

    try {
        await page.waitForSelector(".empty-state__message-label", { timeout: 3000 });
        let currentURL = page.url();
        let splitURL = currentURL.split('=');
        let round = splitURL[splitURL.length - 1];
        let newURL = `${splitURL[0]}=${round - 1}`;
        await page.goto(newURL, { "waitUntil": "networkidle0" })
    } catch {

    }

    const subs = await page.evaluate(() => {

        const subLabels = document.getElementsByClassName("team-lineups__meta team-lineups__meta--sub");
        let subNames = [];
        for (let i = 0; i < subLabels.length; i++) {
            if (subLabels[i].parentElement) {
                subNames.push(subLabels[i].parentElement.querySelectorAll(".team-lineups__player-name")[0].textContent.replace(/\./g, ' ').split(' ').reduce((shortName, word, index) => index === 0 ? `${word.charAt(0)}.` : shortName + word, '').toUpperCase().toUpperCase());
                subNames.push(subLabels[i].parentElement.querySelectorAll(".team-lineups__player-name")[1].textContent.replace(/\./g, ' ').split(' ').reduce((shortName, word, index) => index === 0 ? `${word.charAt(0)}.` : shortName + word, '').toUpperCase());
            }
        }

        return {
            "Subs": subNames
        }
    });
    data.subs = subs;


    console.log(`Subs crawl complete for ${baseURL.split('/').pop()}`);
    //await browser.close();
    await page.close();

    // Pass data to callback function or return it directly
    if (callback) {
        callback(data);
    } else {
        return data;
    }
}

async function statsCrawl(baseURL, data, browser, supercoachScores) {
    console.log(`Crawling Stats for ${baseURL.split('/').pop()}`);
    const statsURL = `${baseURL}#player-stats`;

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    await page.setRequestInterception(true);
    await page.on('request', (request) => {
        const url = request.url();
        const resourceType = request.resourceType();
        if (['image', 'font', 'media', 'xhr', 'stylesheet'].includes(resourceType) || url.endsWith('.css') || url.endsWith('.svg')) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(statsURL, { "waitUntil": "networkidle0" });

    var basicStats = await page.evaluate((statsURL, data, supercoachScores) => {
        var playerStats = document.getElementsByClassName("stats-table__body-row   ");
        for (let i = 0; i < playerStats.length; i++) {

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
                supercoach: 0,
                supercoachPrice: 0,
            }

            let pageURL = window.location.href;
            let splitLinks = pageURL.split('/')
            player.trimmedLink = splitLinks[splitLinks.length - 1].split("#")[0]

            const roundAndDate = document.getElementsByClassName("mc-header__date-wrapper js-match-start-time")[0].textContent;
            let cleanString = roundAndDate.trim().replace(/^'|'\s*$/g, '');
            const parts = cleanString.split('•').map(part => part.trim());
            const round = parts[0]; // "Round 11"
            const dateAndTime = parts.slice(1).join(' • ').replace(/\s*\(.*?\)\s*/g, '');
            player.round = round;
            player.date = dateAndTime;

            const nameRow = playerStats[i].getElementsByClassName("mc-player-stats-table__player")[0];
            const firstName = nameRow.firstChild.textContent.trim();
            const lastName = nameRow.querySelector('strong').textContent.trim();
            const fullName = (firstName[0] + '.' + lastName);
            player.name = fullName;

            // player.supercoach = supercoachScores.find(supercoachPlayer => supercoachPlayer.playerName === player.name).livepts;
            // player.supercoachPrice = supercoachScores.find(supercoachPlayer => supercoachPlayer.playerName === player.name).supercoachPrice;


            player.goals = playerStats[i].childNodes[3].textContent;

            player.behinds = playerStats[i].childNodes[4].textContent;

            player.kicks = playerStats[i].childNodes[6].textContent;

            player.handballs = playerStats[i].childNodes[7].textContent;

            player.marks = playerStats[i].childNodes[8].textContent;

            player.tackles = playerStats[i].childNodes[9].textContent;

            player.hitouts = playerStats[i].childNodes[10].textContent;

            player.tog = playerStats[i].childNodes[14].textContent;

            player.fantasy = playerStats[i].childNodes[2].textContent;

            const playerTeam = playerStats[i].getElementsByClassName("mc-player-stats-table__jumper-number mc-player-stats-table__jumper-number--home")[0];
            if (playerTeam == null) {
                player.team = 1;
            }

            if (player.team == 0) {
                player.number = playerStats[i].getElementsByClassName("mc-player-stats-table__jumper-number mc-player-stats-table__jumper-number--home")[0].textContent;
            } else {
                player.number = playerStats[i].getElementsByClassName("mc-player-stats-table__jumper-number mc-player-stats-table__jumper-number--away")[0].textContent;
            }

            player.url = playerStats[i].querySelector("img").src;



            data.players.push(player);


        }
        return {
            "Player": data.players,

        };
    }, baseURL, data, supercoachScores);
    data.players = basicStats["Player"];



    //////////////////////////
    const advancedStatsButton = await page.$$("#stats-dropdown-button");
    await advancedStatsButton[0].click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    var advancedStats = await page.evaluate((statsURL, data) => {
        var playerStats = document.getElementsByClassName("stats-table__body-row");
        var stats = [];
        for (let i = 0; i < playerStats.length; i++) {
            var player = {
                freesfor: playerStats[i].childNodes[5].textContent,
                freesagainst: playerStats[i].childNodes[6].textContent,
            }
            stats.push(player);
        }
        return stats;
    }, baseURL, data);

    data.players.forEach((player, index) => {
        player.freesfor = advancedStats[index].freesfor;
        player.freesagainst = advancedStats[index].freesagainst;
    });

    ///////////////////////////

    await page.goto(statsURL, { "waitUntil": "networkidle0" });
    await page.waitForSelector(".toggle-input__button");
    const seasonAvgBtn = await page.$$(".toggle-input__button");
    await seasonAvgBtn[1].click();

    // Wait for the new content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract season average fantasy scores
    const playerSeasonStats = await page.evaluate(() => {
        const playerSeasonStats = document.getElementsByClassName("stats-table__body-row   ");
        const fantasyAvgs = [];

        for (let i = 0; i < playerSeasonStats.length; i++) {
            const fantasyAvg = playerSeasonStats[i].childNodes[2].textContent;
            fantasyAvgs.push(fantasyAvg);
        }

        return fantasyAvgs;
    });

    data.playerSeasonStats = playerSeasonStats;

    // Download player images
    const imageDirectory = "../public/images";
    if (data.players) {
        for (let i = 0; i < data.players.length; i++) {
            const playerId = `${data.players[i].name}-${data.players[i].number}`;
            const photoURL = data.players[i].url;
            const imageName = `${playerId}.png`;
            const imagePath = path.join(imageDirectory, imageName);

            if (!fs.existsSync(imagePath)) {
                fetch(photoURL)
                    .then(response => response.arrayBuffer()) // Convert response to ArrayBuffer
                    .then(arrayBuffer => {
                        const imageBuffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer
                        fs.writeFileSync(imagePath, imageBuffer);
                    })
                    .catch(error => {
                        console.error('Error downloading image:', error);
                    });
            }

        }
    }

    console.log(`Stats crawl complete for ${baseURL.split('/').pop()}`);
    //await browser.close();
    await page.close();

    return data;

}

async function matchupCrawl(baseURL, data, browser, callback) {
    console.log(`Crawling matchup for ${baseURL.split('/').pop()}`);

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    await page.setRequestInterception(true);
    await page.on('request', (request) => {
        const url = request.url();
        const resourceType = request.resourceType();
        if (['image', 'font', 'media', 'xhr', 'stylesheet'].includes(resourceType) || url.endsWith('.css') || url.endsWith('.svg')) {
            request.abort();
        } else {
            request.continue();
        }
    });


    // Get matchup title
    await page.goto(baseURL, { "waitUntil": "networkidle0" });
    await page.waitForSelector(".mc-header__round-wrapper");
    var matchup = await page.evaluate(() => {

        var matchupTitle = document.getElementsByClassName("mc-header__round-wrapper")[0].textContent;
        var matchupTitleSplit = matchupTitle.split(" v ");
        var homeTeam = matchupTitleSplit[0];
        var awayTeam = matchupTitleSplit[1];

        return {
            "Home": homeTeam,
            "Away": awayTeam,
        };
    });
    data.matchup = matchup;
    //  Get current time
    const gameTime = await page.evaluate(() => {
        let currentTime = "";
        try {
            try {
                currentTime = document.getElementsByClassName("mc-header__status-label mc-header__status-label--live ")[0].textContent;
            } catch {
                currentTime = document.getElementsByClassName("mc-header__status-label mc-header__status-label--completed")[0].textContent;
            }
        }
        catch {
            currentTime = "00:00 Q0";
        }

        return {
            "Time": currentTime,
        }
    });
    data.gameTime = gameTime;
    // Get current score
    var score = await page.evaluate(() => {

        let homeScore = 0;
        let homeScoreTotal = 0;
        let awayScore = 0;
        let awayScoreTotal = 0;

        try {
            homeScore = document.getElementsByClassName("mc-header__score-split")[0].textContent;
            homeScoreTotal = document.getElementsByClassName("mc-header__score-main")[0].textContent;
            awayScore = document.getElementsByClassName("mc-header__score-split")[1].textContent;
            awayScoreTotal = document.getElementsByClassName("mc-header__score-main")[1].textContent;
        } catch {
            homeScore = 0;
            homeScoreTotal = 0;
            awayScore = 0;
            awayScoreTotal = 0;
        }


        return {
            "HomeScore": homeScore,
            "HomeScoreTotal": homeScoreTotal,
            "AwayScore": awayScore,
            "AwayScoreTotal": awayScoreTotal,
        }
    });
    data.score = score;

    var benched = await page.evaluate(() => {

        const benchedPlayerElements = document.getElementsByClassName("mc-interchange-bench__player-name");
        let benchedPlayers = [];

        for (let i = 0; i < benchedPlayerElements.length; i++) {
            benchedPlayers.push(benchedPlayerElements[i].textContent);
        }

        const injuredPlayerElements = document.getElementsByClassName("mc-interchange-bench__bench-time");
        let injuredPlayers = [];
        for (let i = 0; i < injuredPlayerElements.length; i++) {
            let benchTime = injuredPlayerElements[i].textContent;
            if (benchTime != "Injured") {
                // Convert bench time to int from format "25 min"
                benchTime = parseInt(benchTime.split(" ")[0]);
            }
            if (injuredPlayerElements[i].textContent.includes("Injured")) {
                injuredPlayers.push(injuredPlayerElements[i].previousElementSibling.textContent);
            }
        }

        // Remove duplicate from benched players
        benchedPlayers = benchedPlayers.filter((player, index) => benchedPlayers.indexOf(player) === index);

        return {
            "Benched": benchedPlayers,
            "Injured": injuredPlayers,
        }
    });
    data.benched = benched;

    console.log(`Matchup crawl complete for ${baseURL.split('/').pop()}`);
    //await browser.close();
    await page.close();

    // Pass data to callback function or return it directly
    if (callback) {
        callback(data);
    } else {
        return data;
    }
}



async function breakevenCrawl(baseURL, data, browser, callback) {
    console.log(`Crawling breakevens for ${baseURL.split('/').pop()}`);

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    await page.setRequestInterception(true);
    await page.on('request', (request) => {
        const url = request.url();
        const resourceType = request.resourceType();
        if (['image', 'font', 'media', 'xhr', 'stylesheet'].includes(resourceType) || url.endsWith('.css') || url.endsWith('.svg')) {
            request.abort();
        } else {
            request.continue();
        }
    });

    // Moved below the foreach because it needs access to player.fantasyAvg
    await page.goto('https://www.footywire.com/afl/footy/dream_team_breakevens', { "waitUntil": "networkidle0" });

    const breakevens = await page.evaluate((data) => {
        const rows = [...document.getElementsByClassName("darkcolor"), ...document.getElementsByClassName("lightcolor")];
        let breakevens = {};
        data.players.forEach((player, index) => {
            let found = false; // Flag to check if breakeven is found for the player
            let playerName = player.name.replace(/\s/g, '').toUpperCase();
            if (playerName.endsWith('JNR')) {
                playerName = playerName.slice(0, -3); // Remove last 3 characters
            }

            for (let i = 0; i < rows.length; i++) {
                if (rows[i].children[0] && rows[i].children[0].children[1] && rows[i].children[4]) {
                    let average = rows[i].children[4].textContent;
                    if (playerName == rows[i].children[0].children[1].textContent.replace(/\s/g, '').toUpperCase() && parseInt(player.fantasyAvg) == parseInt(average)) {
                        let key = `${player.name}-${player.fantasyAvg}`; // Use name-average as key
                        breakevens[key] = {
                            breakeven: rows[i].children[5].textContent,
                            price: rows[i].children[2].textContent,
                            position: rows[i].children[0].getElementsByClassName("playerflag")[0].textContent
                        };
                        found = true;
                        break;
                    }
                }
            }
            // If breakeven not found using name and average, then try just by name
            if (!found) {
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i].children[0] && rows[i].children[0].children[1]) {
                        if (playerName == rows[i].children[0].children[1].textContent.replace(/\s/g, '').toUpperCase()) {
                            let key = `${player.name}-${player.fantasyAvg}`; // Use only name as key
                            breakevens[key] = {
                                breakeven: rows[i].children[5].textContent,
                                price: rows[i].children[2].textContent,
                                position: rows[i].children[0].getElementsByClassName("playerflag")[0].textContent
                            };
                            break;
                        }
                    }
                }
            }
        });

        return breakevens;
    }, data);

    data.breakevens = breakevens;

    console.log(`Breakeven crawl complete for ${baseURL.split('/').pop()}`);
    //await browser.close();
    await page.close();

    // Pass data to callback function or return it directly
    if (callback) {
        callback(data);
    } else {
        return data;
    }

}

const puppeteerCrawl = async (baseURL, data) => {
    const browser = await puppeteer.launch({ 
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
        ],
        executablePath: process.env.NODE_ENV === 'production' 
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
        headless: true, 
        defaultViewport: null 
    });
    // const supercoachScores = await supercoachCrawl();
    const subsData = await subsCrawl(baseURL, data, browser);
    const statsData = await statsCrawl(baseURL, data, browser/*, supercoachScores*/);
    const matchupData = await matchupCrawl(baseURL, data, browser);

    // Assign season average fantasy scores to players
    data.players.forEach((player, index) => {
        player.fantasyAvg = statsData.playerSeasonStats[index];
        player.teamName = player.team == 0 ? matchupData.matchup["Home"] : matchupData.matchup["Away"];
        player.teamScore = player.team == 0 ? matchupData.score["HomeScore"] : matchupData.score["AwayScore"];
        player.teamScoreTotal = player.team == 0 ? matchupData.score["HomeScoreTotal"] : matchupData.score["AwayScoreTotal"];
        player.time = matchupData.gameTime["Time"];
        if (subsData.subs["Subs"].includes(player.name.replace(/\./g, ' ').split(' ').reduce((shortName, word, index) => index === 0 ? `${word.charAt(0)}.` : shortName + word, '').toUpperCase())) {
            player.sub = 1;
        }
        // if a player is benched, set benched flag to 1
        if (matchupData.benched["Benched"].includes(player.name)) {
            player.benched = 1;
        }
        if (matchupData.benched["Injured"].includes(player.name)) {
            player.injured = 1;
        }
    });

    // Requires data from statscrawl, so it has to be done after
    const [breakevenData] = await Promise.all([
        breakevenCrawl(baseURL, data, browser)
    ]);
    await browser.close();

    data.players.forEach((player, index) => {
        const playerData = breakevenData.breakevens[`${player.name}-${player.fantasyAvg}`];
        if (playerData) {
            player.breakeven = playerData.breakeven;
            player.price = playerData.price;
            player.position = playerData.position;
        } else {
            console.log(`No data found for player: ${player.name}-${player.fantasyAvg}`);
        }
    });

    console.log("CRAWL COMPLETE");
    return data;
}



module.exports = puppeteerCrawl;
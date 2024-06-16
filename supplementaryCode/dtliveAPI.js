const fs = require("fs");
const path = require('path');
const xml2js = require('xml2js');
const puppeteer = require('puppeteer');

const data = {
    players: []
};

//Round 1 game 1: 2867
async function crawlAllUrls() {
    for (let i = 2977; i <= 2981; i++) {
        await statsCrawl(`https://dtlive.com.au/afl/livescores.php?GameID=${i}`, data);
    }
}

crawlAllUrls();

async function statsCrawl(baseURL, data) {
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    console.log(`Crawling Stats for ${baseURL.split('/').pop()}`);

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    await page.setRequestInterception(true);
    await page.on('request', (request) => {
        const url = request.url();
        const resourceType = request.resourceType();
        if (request.url().includes("Chat.json")) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(baseURL, { "waitUntil": "networkidle0" });

    var players = await page.evaluate(() => {
        const hrefsA = document.getElementsByTagName('a');
        let hrefs = [];
        for (let i = 0; i < hrefsA.length; i++) {
            if (hrefsA[i].href) {
                hrefs.push(hrefsA[i]);
            }
        }
        let players = [];
        for (let i = 0; i < hrefs.length; i++) {
            if (hrefs[i].href.includes("PlayerTab")) {
                let player = {};
                player.round = document.getElementsByTagName("h3")[0].textContent.split(":")[0].split(' ').pop();
                try {
                    let team;
                    if (hrefs[i].parentElement.id.startsWith("A")) {
                        team = "Away";
                    } else {
                        team = "Home";
                    }
                    let id = hrefs[i].parentElement.id.split('-')[1];
                    let playerNo = document.getElementById(`${team}Jumper-${id}`).textContent;
                    player.myId = hrefs[i].textContent + "-" + playerNo;
                } catch {
                    player.myId = "FAIL";
                }
                if (player.myId !== "FAIL") {
                    player.dtLiveId = hrefs[i].href.split(",")[1].slice(0, -2);
                    players.push(player);
                }
            }
        }
        return players;
    });

    data.players.push(...players);
    players = [];

    let currentURL = baseURL;
    let urlId = currentURL.split("=")[1];

    for (const player of data.players) {
        try {
            const fetchedData = await fetch(`https://dtlive.com.au/afl/xml/${urlId}-${player.dtLiveId}.xml`, {
                headers: {
                    "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "Referer": `https://dtlive.com.au/afl/livescores.php?GameID=${urlId}`,
                },
                method: "GET"
            }).then(response => response.text());

            await fs.promises.writeFile('input.xml', fetchedData);
            await writeToFile(player.myId);
            data.players = [];
            console.log('Data written to file for player:', player.myId);
        } catch (error) {
            console.error('Error fetching or writing data:', error);
        }
    }

    await page.close();
    await browser.close();

    return data;
}

async function writeToFile(playerId) {
    try {
        const data = await fs.promises.readFile('input.xml', 'utf8');
        if (!data) {
            console.error('No data to parse for player', playerId);
            return;
        }

        const result = await xml2js.parseStringPromise(data);

        const timelineData = {};

        const statMapping = {
            k: { key: 'kicks', fantasyPoints: 3 },
            h: { key: 'handballs', fantasyPoints: 2 },
            m: { key: 'marks', fantasyPoints: 3 },
            ho: { key: 'hitouts', fantasyPoints: 1 },
            t: { key: 'tackles', fantasyPoints: 4 },
            ff: { key: 'freeFor', fantasyPoints: 1 },
            fa: { key: 'freeAgainst', fantasyPoints: -3 },
            g: { key: 'goals', fantasyPoints: 6 },
            b: { key: 'behinds', fantasyPoints: 1 },
        };

        result.xml.Tracker.forEach(tracker => {
            const quarter = parseInt(tracker.Q[0], 10);
            const time = tracker.Time[0];
            const text = tracker.Text[0];

            const totalPointsMatch = text.match(/\+(\d+)/);
            const totalPoints = totalPointsMatch ? parseInt(totalPointsMatch[1], 10) : 0;
            const statsMatches = text.match(/\((.*?)\)/)[1].split(',');

            statsMatches.forEach(statMatch => {
                const [statValue, statKey] = statMatch.split(/([a-z]+)/).filter(Boolean).map((v, i) => i === 0 ? parseInt(v, 10) : v);
                const statConfig = statMapping[statKey];
                if (statConfig) {
                    const statName = statConfig.key;
                    const fantasyPoints = statValue * statConfig.fantasyPoints;
                    const entry = {
                        playerId: playerId,
                        quarter: quarter,
                        time: time,
                        stat: statKey,
                        difference: statValue,
                        fantasy: fantasyPoints,
                    };

                    const roundKey = "Round " + result.xml.History[0].Round[0];
                    if (!timelineData[roundKey]) {
                        timelineData[roundKey] = [];
                    }
                    timelineData[roundKey].push(entry);
                }
            });
        });

        await fs.promises.appendFile('timelineData4.json', JSON.stringify(timelineData, null, 2));
        console.log('JSON file has been saved.');
    } catch (err) {
        console.error('Error writing JSON file:', err);
    }
}

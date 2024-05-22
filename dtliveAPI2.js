const fs = require('fs');
const xml2js = require('xml2js');

// Read the XML file
fs.readFile('input.xml', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading XML file:', err);
        return;
    }

    // Parse the XML data
    xml2js.parseString(data, (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return;
        }

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

        // Process each Tracker entry for the player
        result.xml.Tracker.forEach(tracker => {
            const quarter = parseInt(tracker.Q[0], 10);
            const time = tracker.Time[0];
            const text = tracker.Text[0];

            // Extract total points and individual stats from text
            const totalPointsMatch = text.match(/\+(\d+)/);
            const totalPoints = totalPointsMatch ? parseInt(totalPointsMatch[1], 10) : 0;
            const statsMatches = text.match(/\((.*?)\)/)[1].split(',');

            statsMatches.forEach(statMatch => {
                const [statValue, statKey] = statMatch.split(/([a-z]+)/).filter(Boolean).map((v, i) => i === 0 ? parseInt(v, 10) : v);
                const statConfig = statMapping[statKey];
                if (statConfig) {
                    const statName = statConfig.key;
                    const fantasyPoints = statValue * statConfig.fantasyPoints;
                    const playerId = "N.Newman-24";
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

        // Write the JSON data to file
        fs.writeFile('timelineData1.json', JSON.stringify(timelineData, null, 2), (err) => {
            if (err) {
                console.error('Error writing JSON file:', err);
                return;
            }
            console.log('JSON file has been saved.');
        });
    });
});

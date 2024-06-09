

const fs = require("fs");
const path = require('path');

const fixtureData = {
    games: []
};


function fetchFixtureData() {
    return fetch(`https://api.squiggle.com.au/?q=games;source=1;year=2024;format=json`, {
        headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        },
        body: null,
        method: "GET"
    })
    .then(response => response.text())
    .then(async data => {
        const jData = JSON.parse(data);
    
        fixtureData.games = jData.games.map(game => ({
            date: game.date,
            team0: game.hteam,
            team1: game.ateam,
            team0score: game.hscore,
            team1score: game.ascore,
            time: game.timestr || "",
            location: game.venue,
            link: (parseInt(game.id) - 32837),
            live: game.timestr && game.timestr.includes("Q") ? 1 : 0,
            round: game.round,
        }));
        // console.log(fixtureData);
        return fixtureData;
    })
    .catch(error => {
        console.error(error);
    });
}

module.exports = fetchFixtureData;
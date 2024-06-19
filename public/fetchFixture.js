

const fs = require("fs");
const path = require('path');

const fixtureData = {
    games: []
};


const seasonStartDate = new Date("2024-03-07");

// Function to get the most recent Tuesday
function getMostRecentTuesday(date) {
    const dayOfWeek = date.getDay();
    const distanceToTuesday = (dayOfWeek >= 2) ? dayOfWeek - 2 : 7 - (2 - dayOfWeek);
    const mostRecentTuesday = new Date(date);
    mostRecentTuesday.setDate(date.getDate() - distanceToTuesday);
    return mostRecentTuesday;
}

// Function to calculate the current round based on the current date
function getCurrentRound() {
    const currentDate = new Date();
    const mostRecentTuesday = getMostRecentTuesday(currentDate);
    const timeDifference = mostRecentTuesday - seasonStartDate;
    const weeksDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 7));
    return weeksDifference + 1; // Add 1 because weeksDifference is 0-based
}

function fetchFixtureData() {
    return fetch(`https://api.squiggle.com.au/?q=games;round=${getCurrentRound()};source=1;year=2024;format=json`, {
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
            team0: game.hteam.includes("Greater Western Sydney") ? "GWS GIANTS" : game.hteam,
            team1: game.ateam.includes("Greater Western Sydney") ? "GWS GIANTS" : game.ateam,
            team0score: game.hscore,
            team1score: game.ascore,
            time: game.timestr || "",
            location: game.venue,
            link: (parseInt(game.id) - 32837),
            live: game.timestr && game.timestr.includes("Q") ? 1 : 0,
            round: game.round === "Opening Round" ? 0 : game.round,
        }));
        // console.log(fixtureData);
        return fixtureData;
    })
    .catch(error => {
        console.error(error);
    });
}

module.exports = fetchFixtureData;
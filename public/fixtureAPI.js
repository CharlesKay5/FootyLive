// =======================================
// import node modules
// =======================================
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require('path');
require('dotenv').config();


// =======================================
// web crawler
// =======================================
const puppeteer = require('puppeteer');
const { text } = require("body-parser");


async function fixtureCrawl(fixtureURL, data) {
    console.log("Crawling fixtures...");


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
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);


    await page.setRequestInterception(true);
    await page.on('request', (request) => {
        const resourceType = request.resourceType();
        const url = request.url();

        if (['image', 'font', 'media', 'xhr', 'stylesheet'].includes(resourceType) || url.endsWith('.css') || url.endsWith('.svg')) {
            request.abort();
        } else {
            request.continue();
        }
    });
    await page.goto(fixtureURL, { "waitUntil": "networkidle0" });

    page
        .on('console', message =>
            console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
        .on('pageerror', ({ message }) => console.log(message))
        .on('response', response =>
            console.log(`${response.status()} ${response.url()}`))
        .on('requestfailed', request =>
            console.log(`${request.failure().errorText} ${request.url()}`))



    var fixtureData = await page.evaluate((fixtureURL, data) => {

        var fixtureRows = document.getElementsByClassName("fixtures__content");

        let prevDate = null;
        for (let i = 0; i < fixtureRows.length; i++) {

            var game = {
                date: 0,
                team0: 0,
                team1: 0,
                team0score: 0,
                team1score: 0,
                time: 0,
                location: 0,
                link: 0,
                live: 0,
                round: 0,
            }
            game.round = document.getElementsByClassName("competition-nav__round-list-item is-active competition-nav__round-list-item--current-round ")[0].firstElementChild.textContent;

            let dateHeader = fixtureRows[i].parentElement.previousElementSibling;
            if (dateHeader && dateHeader.className === "fixtures__date-header") {
                prevDate = dateHeader.textContent;
            }
            game.date = prevDate;

            game.team0 = fixtureRows[i].getElementsByClassName("fixtures__match-team-name")[0].textContent;

            game.team1 = fixtureRows[i].getElementsByClassName("fixtures__match-team-name")[1].textContent;

            try {
                game.team0score = fixtureRows[i].getElementsByClassName("fixtures__match-score-total")[0].textContent;
            }
            catch {
                //console.log("No team0score")
                game.team0score = "0";
            }

            try {
                game.team1score = fixtureRows[i].getElementsByClassName("fixtures__match-score-total")[1].textContent;
            }
            catch {
                //console.log("No team1score")
                game.team1score = "0";
            }

            game.time = fixtureRows[i].getElementsByClassName("fixtures__status-label")[0].textContent;
            if (game.time != "FULL TIME" && !game.time.includes("pm") && !game.time.includes("am")) {
                game.live = 1;
            }
            game.location = fixtureRows[i].getElementsByClassName("fixtures__match-venue")[0].textContent;

            game.link = fixtureRows[i].getElementsByClassName("fixtures__details")[0].querySelector("a").href;


            data.games.push(game);
            //console.log("Current games data:", data.games);
        }
        return {
            "Fixtures": data.games,
        };
    }, fixtureURL, data);

    data.games = fixtureData["Fixtures"];
    //console.log("Current games data:", data.games);
    console.log("Crawl complete for fixtures")
    await browser.close();
}

module.exports = fixtureCrawl;
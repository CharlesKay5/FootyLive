// =======================================
// import node modules
// =======================================
const express = require("express")
const bodyParser = require("body-parser")

// =======================================
// web crawler
// =======================================
var baseURL = "https://www.utctime.net/";
const puppeteer = require('puppeteer');
const { text } = require("body-parser");

var finalResults = [];



var data = {
    players: [],
}

async function puppeteerCrawl(baseURL, data, callback) {
    //console.log("Crawling...");

    await new Promise(resolve => setTimeout(resolve, 1000));

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(baseURL);

    await page.setRequestInterception(true);
    await page.on('request', (request) => {
        if (['image', 'font', 'script', 'media'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });

    var basicStats = await page.evaluate((baseURL, data) => {

        var time = document.getElementsByClassName("fontbig");
        
        var player = {
            time: 0
        }

        player.time = time[0].textContent;
        

        data.players.push(player);
        
        return {
            "Player": data.players,
        };
    }, baseURL, data);

    data.players = basicStats["Player"];

    // Finalize data and close browser
    /*var final = {
        playerNames: data.players,
        //"Crawl": "Complete",
    };*/
    //console.log(final);
    await browser.close();

    // Pass data to callback function or return it directly
    callback(data);
    
    //return puppeteerCrawl(baseURL, data, callback);
}


// Example usage:
//puppeteerCrawl(baseURL, data, callbackFunction);

module.exports = puppeteerCrawl;
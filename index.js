const express = require("express");
const app = express();
const axios = require("axios");
const puppeteer = require("puppeteer");
require('dotenv').config();

const url = process.env.URL;
const xPath = process.env.XPATH;
const apiKey = process.env.NOTIFYKEY;
let latestIndex = 1;

function getXPath(latestIndex) { return `${xPath}[${latestIndex}]`}

function sendNotification(episodeNumber, episodeLink) {
  const body = {
    title: `New Episodes Released -> ${episodeNumber}`,
    body: `Link -> ${episodeLink}`
  };

  axios
    .post(`https://push.techulus.com/api/v1/notify/${apiKey}`, body)
    .then((response) => {
      console.log("Notification sent:", response.data);
    })
    .catch((error) => {
      console.error("Error sending notification:", error);
    });
}

async function checkXPath() {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const [element] = await page.$x(getXPath(latestIndex+1));
    if(element != undefined){
      latestIndex++;
      const text = await page.evaluate((el) => el.textContent, element);
      let [,episodeNumber, episodeLink,] = text.split("\n")
      sendNotification(episodeNumber, episodeLink)
    }
    await browser.close();
  } catch (error) {
    console.log("Error getting URL", error);
  }
}

// INITIALIZE LAST INDEX
(async () => {
  console.log("INIT STARTED");
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    while (true) {
      try {
        const rows = await page.$x(getXPath(latestIndex));
        console.log("INSIDEINIT", getXPath(latestIndex))
        if(rows.length === 0){
          break;
        } else{
          latestIndex++;
        }
      } catch (error) {
        console.log("Caught Error in LatestIndex", error);
        break;
      }
    }

    latestIndex--;
    await browser.close();
  } catch (error) {
    console.log("Init Error", error);
  }
})();

app.listen(3000, () => {
  setInterval(checkXPath, 60 * 60 * 1000);
  console.log("Server listening on port 3000");
});

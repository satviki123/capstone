const express = require('express');
const app = express();
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require('firebase-admin/firestore');
const request = require('request');
const Telegram = require("node-telegram-bot-api");
const serviceAccount = require("../../server/key.json"); // Use the correct path to your key file

// const token = "6038513708:AAFAFSHtvI_bDOVtxxa1Quy2j4VqjumLVuk"; // Replace with your Telegram bot token
const key = "ce40be1736e049bcbe0112319232905"; // Replace with your weather API key

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Serve static files (CSS, JavaScript, etc.)
app.use(express.static('public'));

// Middleware for parsing URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Dashboard route
app.get("/dashboard", function (req, res) {
  res.sendFile(__dirname + "/dashboard.html"); // Add a forward slash (/) before "dashboard.html"
});

// Weather API route
app.get("/weather", function (req, res) {
  const placeName = req.query.placeName;

  // Make API request and send weather data to the dashboard
  const url = `https://api.weatherapi.com/v1/current.json?q=${placeName}&lang=en&key=${key}`; // Add backticks (`) around the URL string

  request(url, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const data = JSON.parse(body);
      // Render the weather data in the dashboard.html template or send it as JSON
      res.json(data);
    } else {
      res.status(400).json({ error: "Invalid city name" });
    }
  });
});

// Start the Express.js server
app.listen(8000, () => {
  console.log('Server is running on port 8000');
});

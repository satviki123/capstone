const express = require('express');
const app = express();
const path = require('path');
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require('firebase-admin/firestore');
const request = require('request');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../')));
app.use(bodyParser.urlencoded({ extended: true }));

// Update the path to your Firebase service account key
const serviceAccount = require(path.join(__dirname, 'key.json'));

initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

// Define routes
app.get("/", function (req, res) {
    res.send("Welcome to the home page");
});

app.get("/signup", function (req, res) {
    res.sendFile(path.join(__dirname, '../', 'client', 'public', 'signup.html'));
});

app.get("/signupSubmit", function (req, res) {
    // Handle signup logic here and add user data to Firestore (same as before)
    const userData = {
        FullName: req.query.FullName,
        Email: req.query.Email,
        Password: req.query.Password
    };

    db.collection('users').add(userData)
        .then(() => {
            // After successful signup, redirect to the login page
            res.redirect("/login");
        })
        .catch((error) => {
            // Handle errors here and provide feedback to the user
            console.error("Error adding user:", error);
            res.status(500).send("Error signing up. Please try again.");
        });
});

app.get("/login", function (req, res) {
    res.sendFile(path.join(__dirname, '../', 'client', 'public', 'login.html'));
});

app.post("/loginSubmit", async function (req, res) {
    // Handle login logic here and redirect to the dashboard (same as before)
    const name = req.body.username;
    const password = req.body.password;

    try {
        const userRef = db.collection('users').doc(name);
        const docSnapshot = await userRef.get();

        if (docSnapshot.exists) {
            const hashedPassword = docSnapshot.data().Password;

            // Compare the entered password with the hashed password from Firestore
            const result = await bcrypt.compare(password, hashedPassword);

            if (result) {
                // Redirect to the dashboard on successful login
                res.redirect("/dashboard");
            } else {
                res.send("Fail");
            }
        } else {
            res.send("Fail");
        }
    } catch (error) {
        res.status(500).send("Error: " + error);
    }
});

app.get("/dashboard", function (req, res) {
    res.sendFile(path.join(__dirname, '../', 'client', 'public', 'dashboard.html'));
});

// Weather API route
app.get("/weather", function (req, res) {
    const placeName = req.query.placeName;

    // Make API request and send weather data to the dashboard
    const key = "ce40be1736e049bcbe0112319232905"; // Move the key declaration here
    const url = `https://api.weatherapi.com/v1/current.json?q=${placeName}&lang=en&key=${key}`;

    request(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const data = JSON.parse(body);
            // Render the weather data in the dashboard.html template or send it as JSON
            res.json(data);
            const weatherData = {
                place: placeName,
                response: data
            };
            db.collection('weather').add(weatherData)
                .then(() => {
                    // After successful signup, log a message
                    console.log("Weather data added to the database");
                })
                .catch((error) => {
                    // Handle errors here and provide feedback to the user
                    console.error("Error adding weather", error);
                    res.status(500).send("Error adding weather to the database");
                });
        } else {
            res.status(400).json({ error: "Invalid city name" });
        }
    });
});

// Start the server
app.listen(8000, () => {
    console.log("Server is running on port: 8000");
});

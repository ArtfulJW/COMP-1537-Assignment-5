// Server-Side
// Requires
const express = require("express");
const session = require("express-session");
const app = express();
const fs = require("fs");
const { JSDOM } = require('jsdom');

// static path mappings
app.use("/js", express.static("public/js"));
app.use("/css", express.static("public/css"));
app.use("/images", express.static("public/images"));
app.use("/html", express.static("public/html"));

// Create new Session, Gives you the "Keycard" that you need to access/open site.
app.use(session({
    secret: "a secret",
    name: "PokeSessionID",
    resave: false,
    saveUninitialized: true
}))

// Retrieve URL at..
app.get("/", function (req, res) {

    // // Check if logged in.
    // if(res.session.loggedIn){
    //     // Logged in
    //     // Serve up this file
    //     doc = fs.readFileSync("./html/directory.html", "utf-8");
    //     res.send(doc);

    // } else {
    //     // Not logged in
    // }

    // Serve up this file
    doc = fs.readFileSync("./html/index.html", "utf-8");
    res.send(doc);

});

async function init(){

    // we'll go over promises in COMP 2537, for now know that it allows us
    // to execute some code in a synchronous manner
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      multipleStatements: true
    });
    const createpokemartUser = `CREATE DATABASE IF NOT EXISTS pokemart;
        use pokemart;
        CREATE TABLE IF NOT EXISTS user (
        ID int NOT NULL AUTO_INCREMENT,
        firstName varchar(30),
        lastName varchar(30),
        email varchar(40),
        password varchar(30),
        city varchar(50),
        trainerLevel varchar(10),
        PRIMARY KEY (ID));`;
    await connection.query(createpokemartUser);

    // await allows for us to wait for this line to execute ... synchronously
    // also ... destructuring. There's that term again!
    let [rows, fields] = await connection.query("SELECT * FROM user");
    // no records? Let's add a couple - for testing purposes
    if(rows.length == 0) {
        // no records, so let's add a couple
        let userRecords = "insert into user (firstName, lastName, email, password, city, trainerLevel) values ?";
        let userrecordValues = [
          ["Jay", "Wang", "jaywang@bcit.ca", "123456", "Burnaby", "10"],
          ["Ann","Deboir","anndeboir@bcit.ca","2468", "Vancouver", "20"]
        ];
        await connection.query(userRecords, [userrecordValues]);
    }

    const createPokemonData = `CREATE DATABASE IF not EXISTS pokedata;
    use pokedata;
    CREATE TABLE IF NOT EXISTS pokemon (
    POKEMONID int NOT NULL AUTO_INCREMENT,
    name varchar(30),
    height varchar(30),
    category varchar(30),
    weight varchar(30),
    age varchar(30),
    PRIMARY KEY (POKEMONID));`;
    await connection.query(createPokemonData);
    [rows,field] = await connection.query("SELECT * FROM pokemon");

    if (rows.length == 0){
        let pokemonRecords = "insert into pokemon (name, height, category, weight, age) values ?";
        let pokemonRecordsValue = [
            ["Bulbasaur","71.12 cm","Seed", "15.2 lbs", "5"],
            ["Ivysaur","99.06 cm","Seed", "28.7 lbs", "7"],
            ["Venusaur","200.66 cm","Seed", "220.5 lbs", "12"],
            ["Charmander","60.96 cm","Lizard", "18.7 lbs", "3"],
            ["Charmeleon","109.22 cm","Flame", "41.9 lbs", "6"],
            ["Charizard","170.18 cm","Flame", "199.5 lbs", "15"],
            ["Squirtle","50.8 cm","Tiny Turtle", "19.8 lbs", "6"],
            ["Wartortle","99.06 cm","Turtle", "28.749.6 lbs", "8"],
            ["Blastoise","160.02 cm","Shellfish", "188.5 lbs", "14"],
            ["Caterpie","30.48 cm","Worm", "6.4 lbs", "1"]
        ];
        await connection.query(pokemonRecords,[pokemonRecordsValue]);
    }

    console.log("Listening on port " + port + "!");

}

// RUN SERVER
let port = 8000;
app.listen(port, init);

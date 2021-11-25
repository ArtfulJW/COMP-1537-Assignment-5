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

    // Check if logged in.
    if(req.session.loggedIn){
        // Logged in
        // Serve up this file
        res.redirect("/directory");

    } else {
        // Not logged in
        let doc = fs.readFileSync("./html/index.html", "utf-8");
        res.set("Server", "Poke Engine");
        res.set("X-Powered-By", "PokeMart");
        res.send(doc);
    }

    // // Serve up this file
    // doc = fs.readFileSync("./html/index.html", "utf-8");
    // res.send(doc);

});

app.get("/directory", function(req, res){

    // Check if session exists
    if(req.session.loggedIn){
        let directory = fs.readFileSync("html/directory.html", "utf-8");
        let directoryDOM = new JSDOM(directory);

        // Show User's firstName..
        console.log("Sending Directory...");

        res.send(directoryDOM.serialize());

    } else {
        res.redirect("/");
    }

});

app.get("/marketplace", function (req, res){

        // Check if session exists
        if(req.session.loggedIn){
            let marketplace = fs.readFileSync("html/marketplace.html", "utf-8");
            let marketplaceDOM = new JSDOM(marketplace);
    
            // Show User's firstName..
            let fullName = req.session.firstName + " " + req.session.lastName;
            marketplaceDOM.window.document.getElementById("grid-item-user-FullName").innerHTML = fullName;
            marketplaceDOM.window.document.getElementById("grid-item-user-email").innerHTML = req.session.email;
            marketplaceDOM.window.document.getElementById("grid-item-user-password").innerHTML = req.session.password;
            marketplaceDOM.window.document.getElementById("grid-item-user-city").innerHTML = req.session.city;
            marketplaceDOM.window.document.getElementById("grid-item-user-trainerLevel").innerHTML = req.session.trainerLevel;

            res.send(marketplaceDOM.serialize());
    
        } else {
            res.redirect("/");
        }
})

// IMPORTANT! 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server Detects ajaxPOST request, then handles it
app.post("/login", function(req, res) {
    res.setHeader("Content-Type", "application/json");


    console.log("What was sent", req.body.email, req.body.password);


    let results = authenticate(req.body.email, req.body.password,
        function(userRecord) {
            //console.log(rows);
            if(userRecord == null) {
                // server couldn't find that, so use AJAX response and inform
                // the user. when we get success, we will do a complete page
                // change. Ask why we would do this in lecture/lab :)
                res.send({ status: "fail", msg: "User account not found." });
            } else {
                // authenticate the user, create a session
                req.session.loggedIn = true;
                req.session.firstName = userRecord.firstName;
                req.session.lastName = userRecord.lastName;
                req.session.email = userRecord.email;
                req.session.password = userRecord.password;
                req.session.city = userRecord.city;
                req.session.trainerLevel = userRecord.trainerLevel;
                req.session.save(function(err) {
                    // session saved, for analytics, we could record this in a DB
                });
                // all we are doing as a server is telling the client that they
                // are logged in, it is up to them to switch to the profile page
                res.send({ status: "success", msg: "Logged in." });
            }
    });

});

app.get("/logout", function(req,res){

    // Check to see if session exists
    if (req.session) {
        req.session.destroy(function(error) {
            if (error) {
                res.status(400).send("Unable to log out")
            } else {
                // session deleted, redirect to home
                // res.redirect("/index.html");
                let doc = fs.readFileSync("./html/index.html", "utf-8");
                res.send(doc);
            }
        });
    }
});

// Login Authenticate Function
function authenticate(email, pwd, callback) {

    const mysql = require("mysql2");
    const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "pokemart"
    });
    connection.connect();
    connection.query(
      //'SELECT * FROM user',
      "SELECT * FROM user WHERE email = ? AND password = ?", [email, pwd],
      function(error, results, fields) {
          // results is an array of records, in JSON format
          // fields contains extra meta data about results
          console.log("Results from DB", results, "and the # of records returned", results.length);

          if (error) {
              console.log(error);
          }
          if(results.length > 0) {
              // Found Email and Password
              return callback(results[0]);
          } else {
              // No user found
              return callback(null);
          }

      }
    );

}

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

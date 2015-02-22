var express = require('express'),
    request = require('request'),
    mongoose = require('mongoose')

var app = express()

mongoose.connect('mongodb://localhost/test')
var db = mongoose.connection

var TIME_INTERVAL = 30000,
    API_KEY = process.env.API_KEY,
    username,
    userSchema,
    userModel

db.once('open', function(callback) {
    console.log("setting up database");
    setupDB();
});

function setupDB() {
    userSchema = mongoose.Schema({
        username : String,
        location : String,
        time : {type : Date, default : Date.now}
    })
    userModel = mongoose.model('userModel', userSchema)
}


app.get('/', function(req, res) {
  console.log("A client connected ... ")
  res.send('Server Started')
});

 
app.get('/help', function(req, res) {
  res.send('Nothing to display here, yet. Coming soon');
});


// Subdomain to be used as a callback for Yo.
app.get('/yo', function(req, res) {
    username = req.query.username;
    location = req.query.location;
    console.log("Yo received from " + username);
    res.send("Received a Yo from " + username);
    writeToDb(username, location);
});


function sendYo(yoUsername, location) {
    if (location)
        location = location.replace(";",",");

    request.post('http://api.justyo.co/yo/',
        { form: { 'api_token': API_KEY,
              'username': yoUsername,
              'link': 'https://www.google.com/maps/search/'+location } },
        function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Yo sent to  " + yoUsername);
                console.log(body);
            }
        }
    )
    removeFromDb(yoUsername);
}



function writeToDb(yoUsername, yoLocation) {
    var user = new userModel({ username : yoUsername, location : yoLocation });
    user.save(function(err, user) {
        if (err)
            return console.error(err);
        console.log("User successfully added to database");
    });
}


function removeFromDb(yoUsername) {
    console.log("Deleting user from Database ...");
    userModel.find({username : yoUsername}).remove(function(err, user) {
        if (err) console.log(err);
        console.log("User deleted is = " + user);
    });
}


function getInfoFromDb() {
    console.log("Reading database...");
    userModel.find(function(err, user) {
        if (err) console.log(err);
        for (i = 0; i < user.length; i++) {
            if(isTimeUp(user[i].time)) {
                sendYo(user[i].username, user[i].location);
            }
        }
    });
}


function isTimeUp(givenTime) {
    var currentTime = new Date(Date.now());
    if (currentTime - givenTime > TIME_INTERVAL) {
        return true;
    }
}


var intVar = setInterval(getInfoFromDb, 10 * 1000);

console.log("Server running ...");
app.listen(process.env.PORT || 3000);


var express = require('express')
var request = require('request')
var mongoose = require('mongoose')
var app = express()

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.once('open', function(callback) {
    setupDB();
});

var TIME_INTERVAL = 30000;
var API_KEY = "904143ab-b305-45de-ab8f-adf8a925612e";

app.get('/', function(req, res) {
  console.log("A client connected ... ");
  res.send('Server Started');
});

 
app.get('/help', function(req, res) {
  res.send('Nothing to display here, yet. Coming soon');
});

var username

// Subdomain to be used as a callback for Yo.
app.get('/yo', function(req, res) {
    username = req.query.username;
    console.log("Yo received from " + req.query.username);
    res.send("Received a Yo from " + req.query.username);
    //sendYo(username);
    writeToDb(username);
    //getInfoFromDb();
});


function sendYo(username) {
    request.post('http://api.justyo.co/yo/',
        { form: { 'api_token': API_KEY,
              'username': username,
              'link': 'http://google.com' } },
        function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Yo sent to  " + username);
                console.log(body);
            }
        }
    )
    removeFromDb(username);
}

var userSchema
var userModel
function setupDB() {
    userSchema = mongoose.Schema({
        username : String,
        time : {type : Date, default : Date.now}
    })
    userModel = mongoose.model('userModel', userSchema)
}


function writeToDb(yoUsername) {
    var user = new userModel({ username : yoUsername });
    user.save(function(err, user) {
        if (err)
            return console.error(error);
        console.log("User successfully added to database");
    });
}

function removeFromDb(yoUsername) {
    console.log("Deleting user from Database ...");
    userModel.find({username : yoUsername}).remove(function(err, user) {
        if (err) console.log(err);
        console.log("User deleted is = " + user);
    });
    
    clearInterval(intVar);
}

function getInfoFromDb() {
    console.log("Reading database...");
    userModel.find(function(err, user) {
        if (err) console.log(err);
        for (i = 0; i < user.length; i++) {
            if(isTimeUp(user[i].time)) {
                sendYo(user[i].username);
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
app.listen(3000);


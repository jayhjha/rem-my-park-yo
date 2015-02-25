var express = require('express'),
    request = require('request'),
    mongoose = require('mongoose')

var app = express()

/*
 * This is the time interval after which the user gets a notification
 * In production, this would be 1 hour, 45 minutes. Current value is
 * only for testing purposes.
 */
var TIME_INTERVAL = 30000,
    API_KEY = process.env.API_KEY,
    username,
    userSchema,
    userModel
    MONGO_USER = process.env.MONGO_USER,
    MONGO_PASSWORD = process.env.MONGO_PASSWORD

mongoose.connect('mongodb://'+MONGO_USER+':'+MONGO_PASSWORD+'@ds047591.mongolab.com:47591/remmyparkyo');
var db = mongoose.connection


/*
 *  One time database set-up
 */
db.once('open', function(callback) {
    console.log("One time database setup ... ");
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


/*
 * Express Middleware
 */
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
    res.send("Received a Yo from " + username);
    writeToDb(username, location);
});


/*
 * Function to send a yo to the specific username
 * with the given location. If the location was
 * not specified, the users only get a link to
 * Google Maps
 */
function sendYo(yoUsername, location) {
    var link
    if (location) {
        location = location.replace(";",",")
        link = 'https://www.google.com/maps/search/'+location
    } else {
        link = 'https://www.google.com/'
    }

    request.post('http://api.justyo.co/yo/',
        { form: { 'api_token': API_KEY,
              'username': yoUsername,
              'link':  link } },
        function(error, response, body) {
            console.log("response code = " + response.statusCode);
            if (!error && response.statusCode == 200) {
                console.log("Yo sent to  " + yoUsername)
                console.log(body)
            }
        }
    )
    removeFromDb(yoUsername)
}


/*
 *  Database Manipulation Functions.
 *  Read and Write from the database when required.
 */
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


/*
 * Keeps checking the database at regular intervals to see
 * if any user has been in the database for more than TIME_INTERVAL
 * and if so, sends them a Yo.
 */
function getInfoFromDb() {
    console.log("Reading database...");
    userModel.find(function(err, user) {
        if (err) console.log(err);
        for (i = 0; i < user.length; i++) {
            if (isTimeUp(user[i].time)) {
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


/*
 *  The getInfoFromDb function is being called repeatedly.
 *  For testing and debugging purposes, this interval is 10 seconds.
 *  In production, it would be a lot more.
 *
 *  TODO:: Ideal solution would be to get a notification from the
 *  database that a user's time has expired and then send them a Yo.
 *  Possibly implement using Firebase (the real-time database).
 */
setInterval(getInfoFromDb, 10 * 1000);


console.log("Server running ...");

app.listen(process.env.PORT || 3000);

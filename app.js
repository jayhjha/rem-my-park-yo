var express = require('express')
var request = require('request')
var mongoose = require('mongoose')
var app = express()

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
    sendYo(username);
    writeToDb(username);
});


function sendYo(username) {
    request.post('http://api.justyo.co/yo/',
        { form: { 'api_token': API_KEY,
              'username': username,
              'link': 'http://google.com' } },
        function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            }
        }
    )
}

function writeToDb(yoUsername) {
    mongoose.connect('mongodb://127.0.0.1/test');
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function (callback) {
        var userSchema = mongoose.Schema({
            username : String,
            time : {type : Date, default : Date.now}
        })
        var userModel = mongoose.model('userModel', userSchema)
        var user = new userModel({ username : yoUsername });
        user.save(function(err, user) {
            if (err)
                return console.error(error);
            console.log("User successfully added to database");
        });
    });
}

console.log("Server running ...");
app.listen(3000);


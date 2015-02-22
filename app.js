var express = require('express')
var request = require('request')
var app = express();

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

console.log("Server running ...");
app.listen(3000);


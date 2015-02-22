var express = require('express')
var app = express();

app.get('/', function(req, res) {
  console.log("A client connected ... ");
  res.send('Server Started');
});
 
app.get('/help', function(req, res) {
  res.send('Nothing to display here, yet. Coming soon');
});

console.log("Server running ...");
app.listen(3000);


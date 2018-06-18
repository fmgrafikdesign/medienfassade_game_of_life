var app = require('express')();
var express = require('express');
var http = require('http').Server(app);

var io = require('socket.io')(http);

var port = 61162;

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client.html');
});

app.use('/', express.static(__dirname + '/public/'));

http.listen(port, function(){
    console.log('listening on port %s', port);
});


/** DEBUG FUNCTION **/


/** GAME VARIABLES **/
const width = 192;
const height = 108;
const time_per_generation = 2000; // Time per generation in milliseconds


/**
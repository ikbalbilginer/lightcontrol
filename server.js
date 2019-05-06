var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/mydb";

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname));

http.listen(3000, function(){
    console.log('listening on :3000');
});

mongo.connect(url, function(err, db){
    
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    io.on('connection', function(socket){
        let dbo = db.db('mydb');
        let lights = dbo.collection('lightcontrol');

        lights.find().sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }
            
            // Database emit
            socket.emit('output', res);
        });

        console.log('birileri bağlandı...');

        socket.on('click', function(data){
          
            var _status = data.status == 'opened' ? 'closed' : 'opened';

            var myquery = { light: data.light };
            var newvalues = { $set: {light: data.light, status: _status } };

            dbo.collection("lightcontrol").updateOne(myquery, newvalues, {upsert:true}, function(err, res) {
              if (err) throw err;

              console.log("1 document updated");

                lights = dbo.collection('lightcontrol');

                lights.find().sort({_id:1}).toArray(function(err, resp){
                if(err){
                    throw err;
                }
                
                io.sockets.emit('output', resp);
                 });
            });
        });
    });
});




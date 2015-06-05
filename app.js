var conf = require('./config');
var port = conf.web.port;
console.log('port',conf.web.port);
process.currentlyPlaying = {};
process.playlist = [];
process.removalTimers = {};
process.lastSeen = {};
process.outOfMusic=true;


process.env.TZ = 'America/New_York';

var PseudoGuid = new (function() {
    this.empty = "00000000-0000-0000-0000-000000000000";
    this.GetNew = function() {
        var fourChars = function() {
            return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1).toUpperCase();
        };
        return (fourChars() + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + fourChars() + fourChars());
    };
})();



//https://github.com/techpines/express.io
//http://blog.modulus.io/getting-started-with-mongoose
//https://github.com/techpines/express.io/tree/master/examples#rooms
var express = require('express.io');
var app = express().http().io();
process.app = app;
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);
var hash = bcrypt.hashSync('B4c0/\/', salt);
var bodyParser  = require("body-parser");
var request = require('request');

setInterval(function(){
    var log = '';
    var playlistManger = require('./custom_node_module/playlistManager.js');
    if(playlistManger.needsTick){
        if(playlistManger.isPlaying){
            log+='iPly';
            if(playlistManger.currentlyPlaying.maxSeconds!==undefined){
                log+='hasM';
                if(playlistManger.currentlyPlaying.seconds<playlistManger.currentlyPlaying.maxSeconds){
                    log+='notDn'+playlistManger.currentlyPlaying.seconds+'_'+playlistManger.currentlyPlaying.maxSeconds;
                    playlistManger.currentlyPlaying.seconds++;
                }else{
                    log+='isDn'+playlistManger.currentlyPlaying.seconds+'_'+playlistManger.currentlyPlaying.maxSeconds;
                    playlistManger.isPlaying = false;
                    if(playlistManger.nextSong()==false){
                        process.app.io.emit('NoMedia');
                    }
                }
            }
            console.log(log);
        }else{
            log+='notPly';
            if(playlistManger.queue.length>0){
                log+='hzNxt';
                playlistManger.nextSong();
            }
            console.log(log);
        }
    }
},1000);

// Create the server 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.cookieParser('vikingMusicIsBestMusic'));
app.use(express.session({
    secret: 'vikingMusicIsBestMusic'
}));

var db = mongoose.connection;
process.onlineUsers = {};
db.on('error', console.error);
db.once('open', function() {

    console.log('open');
    var Schema = mongoose.Schema;

    var chatSchema = new Schema({
        msg:  String,
        name: String,
        date: { type: Date, default: Date.now }
    });
    var Chat = mongoose.model('Chat', chatSchema);
    var usersSchema = new Schema({
        username:  String,
        email:  String,
        password: String,
        coins:Number,
        country: String,
        rank:String,
        role: { type: Number, default: 0 },
        reg_date: { type: Date, default: Date.now },
        meta: {
            suggestedVideoWasLiked: Number,
            suggestedVideoWasSkipped: Number,
            suggestedVideos:  Number,
        }
    });
    var Users = mongoose.model('Users', usersSchema);
    console.log('scheme');
    app.io.route('ready', function(req) {
        var moment = require('moment');
        req.session.user = {
            name:req.data.name,
            cameOnline:new moment(new Date()),
            muted:false,
            admin:false,
            online:true,
            lastSeen:new moment(new Date()),
            hidden:false,
            voteWeight:1

        };
        console.log('sever got ready',req.data);
        app.io.broadcast('announce',{
            id: req.sessionID,
            name: req.data.name
        });
        Chat.find({}, function(err, results){
            req.io.emit('history',{
                chatlog:results
            });
        });
        console.log("server broadcast announce",{
            user: req.data.name
        });
        
        var playlistManger = require('./custom_node_module/playlistManager.js').setApp(app);
        playlistManger.newUser(req.sessionID);
        req.io.emit('youare',req.sessionID);
    });

    app.io.route('userList', function(req) {
        app.io.broadcast('newUsersList',process.onlineUsers);
    });
    app.io.route('addSong', function(req) {
        var obj = {
            id:req.data.id,
            requester:{
                id:req.sessionID,
                name:req.data.requester
            }                
        };
        request('http://www.youtube.com/watch?v='+obj.id, function (error, response, body) {
            if (!error && response.statusCode == 200){
                var cheerio = require('cheerio');
                var $ = cheerio.load(body);
                obj.maxSeconds= $('meta[itemprop="duration"]').attr('content');
                obj.name= $('meta[itemprop="name"]').attr('content');

                var playlistManger = require('./custom_node_module/playlistManager.js').setApp(app);
                console.log('addSong',obj);
                playlistManger.addSong(obj)
            }else{
                console.log("ERROR",error);
            }
        });
    });
    function addSongManual(id,name,videoId){
        var obj = {
            id:videoId,
            requester:{
                id:id,
                name:name
            }                
        };
        request('http://www.youtube.com/watch?v='+obj.id, function (error, response, body) {
            if (!error && response.statusCode == 200){
                var cheerio = require('cheerio');
                var $ = cheerio.load(body);
                console.log($('meta[itemprop="duration"]').attr('content'));
                obj.maxSeconds= $('meta[itemprop="duration"]').attr('content');
                obj.name= $('meta[itemprop="name"]').attr('content');

                var playlistManger = require('./custom_node_module/playlistManager.js').setApp(app);
                playlistManger.addSong(obj)
            }else{
                console.log("ERROR",error);
            }
        });
    }
    addSongManual('0','testing','5uCNxVJ0Z_s');
    addSongManual('0','testing','JCDjP4JnpGU');
    addSongManual('0','testing','4Sx5xOQpzB8');
    addSongManual('0','testing','fj-10lIrboM');
    addSongManual('0','testing','9d8SzG4FPyM');
    addSongManual('0','testing','r7Zy6ieJAHQ');
    app.io.route('newName', function(req) {
        console.log(req.data);
        //fs.writeSync('assets/queue.json',JSON.stringify(process.playlist));
        var oldname =req.session.user.name;
        app.io.sockets.emit('newName',{
            name:req.data,
            oldName:oldname
        });

        var sanitizer = require('sanitizer');
        req.session.user.name = sanitizer.escape(req.data);
        req.io.emit('yourNewName',req.session.user.name);
    });

    app.io.route('msg', function(req) {
        var sanitizer = require('sanitizer');
        if(req.session.user.name!=''){
            var name = req.session.user.name;
            var msg = sanitizer.escape(req.data.message);
            new Chat({ 
                name: name,
                msg: msg
            }).save();
            console.log('sever got msg',req.data);
            app.io.broadcast('msg',{
                name: name,
                message: msg
            });
        }
    });
    app.io.route('vote', function(req) {
        var playlistManger = require('./custom_node_module/playlistManager.js').setApp(app);
        playlistManger.vote(req.data.videoId,req.sessionID,req.session.user.weight);
    });
    app.io.route('away', function(req) {
        req.session.user.online = true;
        var moment = require('moment');
        req.session.user.lastSeenTime = new moment(new Date());
        app.io.sockets.emit('newUsersList',process.onlineUsers);
    });
    app.io.route('back', function(req) { 
        req.session.user.away = false;
        var moment = require('moment');
        req.session.user.lastSeenTime = new moment(new Date());
        app.io.sockets.emit('newUsersList',process.onlineUsers);
    });
    app.io.route('skip', function(req) { 
        var playlistManger = require('./custom_node_module/playlistManager.js').setApp(app);
        if(req.session.user.admin==false)
            playlistManger.voteSkip();
        else if(req.session.user.admin==true){
            playlistManger.nextSong();
        }
    });
    app.io.route('disconnect', function(req) {
        console.warn('io.route.disconnect');
        var theReq = req;
        process.removalTimers[req.sessionID]=setTimeout(function(){
            var moment = require('moment');
            var playlistManger = require('./custom_node_module/playlistManager.js').setApp(app);
            playlistManger.newUser(theReq.sessionID);
            
            app.io.sockets.emit('newUsersList',process.onlineUsers);

        },10000);
        app.io.sockets.emit('whois',{
            id: req.sessionID,
        });
    });
    app.io.on('here',function(req){
        console.log('here',req.sessionID);
        clearTimeout(process.removalTimers[req.sessionID]);
        delete process.removalTimers[req.sessionID];
    });



    console.log('routes');
    //server static files from /assets
    app.use('/', express.static(__dirname + '/assets'));


    // Send the client html. on /
    // 
    // 
    app.get('/', function(req, res) {
        console.log('[GET /]'); 
        res.sendfile(__dirname + '/html/homepage.html');
    });

    app.get('/listen',function(req,res){
        console.log('[GET /listen]');
        res.sendfile(__dirname + '/html/listen.html');
    });

    console.log('server started on port '+port);
    app.listen(port);
    var playlistManger = require('./custom_node_module/playlistManager.js').setApp(app);
    playlistManger.nextSong();
});




mongoose.connect('mongodb://localhost/vikrates');







































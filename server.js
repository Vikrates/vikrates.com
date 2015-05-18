var conf = require('./config');
var port = conf.web.port;
console.log('port',conf.web.port);
process.currentlyPlaying = {};
process.playlist = [
    {
        id:'n6DyGZFG6lE',
        name:"Hello, is it me you're looking for? Lionel Richie",
        requester:'Sam2332'
    },
    {
        id:'wJgjw4MIcbQ',
        name:"skrilldog",
        requester:'Fhut',
    },
    {
        id:'B0MNfMUa9pc',
        name:'Run - Gnarls Barkley',
        requester:'Mr.B'
    },
    {
        id:'_qtA4tg_4G4',
        name:'Machine Head: this is the end',
        requester:'your mother'
    },
    {
        id:'o97aFI8waII',
        name:'Machine Head: this is the end',
        requester:'your mother'
    }
];
setInterval(function(){
    if(process.currentlyPlaying!=undefined){
        if(process.currentlyPlaying.maxSeconds!==undefined){
            if(process.currentlyPlaying.seconds<process.currentlyPlaying.maxSeconds){
                process.currentlyPlaying.seconds++;
            }else{
                process.currentlyPlaying.seconds=0;
                nextSong();
            }
        }
    }
},1000);
setInterval(function(){
    if(process.currentlyPlaying!=undefined){
        app.io.sockets.emit('newCur',process.currentlyPlaying);
    }
},5000);

["log", "warn", "error"].forEach(function(method) {
    var oldMethod = console[method].bind(console);
    console[method] = function() {
        oldMethod.apply(
            console,
            [new Date().toISOString()].concat(arguments)
        );
    };
});
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
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);
var hash = bcrypt.hashSync('B4c0/\/', salt);
var bodyParser  = require("body-parser");
var request = require('request');

process.doingWork = false;
function nextSong(){
    if(process.doingWork == false){
        var obj = process.playlist.pop();
        if(obj!==undefined){
            process.currentlyPlaying.id = obj.id;
            process.currentlyPlaying.seconds=0;
            process.currentlyPlaying.requester = obj.requester;
            console.log(obj);
            process.doingWork=true;
            request('http://www.youtube.com/watch?v='+obj.id, function (error, response, body) {
                if (!error && response.statusCode == 200){
                    var cheerio = require('cheerio');
                    var $ = cheerio.load(body);
                    process.currentlyPlaying.maxSeconds= convert_time($('meta[itemprop="duration"]').attr('content'));

                    app.io.sockets.emit('newCur',process.currentlyPlaying);
                    app.io.sockets.emit('newQueue',process.playlist);
                    process.doingWork=false;
                }else{
                    console.log("ERROR",error);
                }
            });
        }else{
            process.currentlyPlaying = null;
            app.io.sockets.emit('addSongs');
        }
    }
}


nextSong();
// Create the server 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.cookieParser('vikingMusicIsBestMusic'));
app.use(express.session({
    secret: 'vikingMusicIsBestMusic'
}));
function convert_time(duration) {
    var a = duration.match(/\d+/g);

    if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
        a = [0, a[0], 0];
    }

    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
        a = [a[0], 0, a[1]];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
        a = [a[0], 0, 0];
    }

    duration = 0;
    if(a!=undefined){
        if (a.length == 3) {
            duration = duration + parseInt(a[0]) * 3600;
            duration = duration + parseInt(a[1]) * 60;
            duration = duration + parseInt(a[2]);
        }

        if (a.length == 2) {
            duration = duration + parseInt(a[0]) * 60;
            duration = duration + parseInt(a[1]);
        }

        if (a.length == 1) {
            duration = duration + parseInt(a[0]);
        }
    }
    return duration;
}
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
    var lastSeen  = {};
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
        process.onlineUsers[req.sessionID] = {
            name:req.data.name,
            cameOnline:new moment(new Date()),
            muted:false,
            mode:0,
            hidden:false
        };
        req.io.broadcast('newUsersList',process.onlineUsers);
        console.log('sever got ready',req.data);
        req.io.broadcast('announce',{
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

        req.io.emit('newQueue',process.playlist);
        req.io.emit('newCur',process.currentlyPlaying);

    });

    app.io.route('addSong', function(req) {
        var obj = {
            id:req.data.name,
            requester:req.data.requester
        };
        request('http://www.youtube.com/watch?v='+obj.id, function (error, response, body) {
            if (!error && response.statusCode == 200){
                var cheerio = require('cheerio');
                var $ = cheerio.load(body);
                console.log($('meta[itemprop="duration"]').attr('content'));
                obj.maxSeconds= convert_time($('meta[itemprop="duration"]').attr('content'));
                obj.name= $('meta[itemprop="name"]').attr('content');


                process.playlist.push(obj);
                console.log('addSong',obj,process.playlist);
                app.io.sockets.emit('newQueue',process.playlist);

            }else{
                console.log("ERROR",error);
            }
        });
    });
    app.io.route('newName', function(req) {
        //fs.writeSync('assets/queue.json',JSON.stringify(process.playlist));
        app.io.sockets.emit('newName',req.data);
    });

    app.io.route('msg', function(req) {
        var sanitizer = require('sanitizer');
        var name =sanitizer.escape(req.data.name);
        var msg = sanitizer.escape(req.data.message);
        new Chat({ 
            name: name,
            msg: msg
        }).save();
        console.log('sever got msg',req.data);
        req.io.broadcast('msg',{
            name: name,
            message: msg
        });

    });
    app.io.route('vote', function(req) { 
        app.io.sockets.emit('voted',{
            id: req.videoId,
            voteMode: req.voteMode,
            user_id: req.sessionID
        });
    });
    app.io.route('away', function(req) { 
        req.io.broadcast('useraway',{
            id: req.sessionID,
        });
    });
    app.io.route('back', function(req) { 
        req.io.broadcast('userback',{
            id: req.sessionID,
        });
    });
    app.io.route('skip', function(req) { 
        nextSong();
    });
    app.io.route('disconnect', function(req) {
        console.warn('io.route.disconnect');
        var moment = require('moment');
        //lastSeen[process.onlineUsers[req.sessionID].name] =new moment(new Date());
        delete process.onlineUsers[req.sessionID];
        app.io.sockets.emit('newUsersList',process.onlineUsers);
    });
    console.log('routes');
    /*
    app.io.route('loadUser', function(req) {

        console.log(req.session);
        console.info('sever got loadUser',req.data);
        User.findOne({_id:req.data},'user_name department status').exec(function(err, user) { 
            if (err) return console.error(err);
            TimeclockPunch.findOne({user:user._id},'inOrOut time').sort('-time').exec(function(err, lastPunch) { 
                if (err) return console.error(err);
                req.io.emit('userLoaded',{user:user,lastPunch:lastPunch});
                console.log("server sent userLoaded",{user:user,lastPunch:lastPunch});
            });
        });
    });

    app.io.route('createUser', function(req) {
        if(!req.session.su){
            req.io.emit('su_failed');
            return false;
        }
        console.info('sever got createNewUser',req.data);
        var newuser = new User({
            user_name: req.data.user_name,
            department:req.data.department,
            pin: 1111,
            admin:req.data.admin,
            status: '-1'
        });

        newuser.save(function(err, thor) {
            if(err) return console.error(err);

            // event 
            req.io.emit('newUserCreated',{
                user:req.data.user,                
                department:req.data.department,
            });

            console.log("server sent newUserCreated",{
                user:req.data.user,                
                department:req.data.department,
            });

            User.find({},'user_name department status').sort('department').exec(function(err, users) { 
                if (err) return console.error(err);
                req.io.emit('usersList',users);
                console.log("server sent usersList",users);
            });
            User.find({}).sort('department').exec(function(err, users) { 
                if (err) return console.error(err);
                req.io.emit('employeesList',users);
                console.log("server sent employeesList",users);
            });

        });
    });


    app.io.route('updateUser', function(req) {
        if(!req.session.su){
            req.io.emit('su_failed');
            return false;
        }
        console.log(req.session);
        console.info('sever got updateUser',req.data);
        User.findOne({_id:req.data.id}).exec(function(err, user) { 
            if (err) return console.error(err);
            user.status = req.data.status;
            user.admin = req.data.admin;
            user.department =req.data.department;
            user.save();

            User.find({},'user_name department status').sort('department').exec(function(err, users) { 
                if (err) return console.error(err);
                req.io.emit('usersList',users);
                console.log("server sent usersList",users);
            });
            User.find({}).sort('department').exec(function(err, users) { 
                if (err) return console.error(err);
                req.io.emit('employeesList',users);
                console.log("server sent employeesList",users);
            });



        });
    });
    app.io.route('deleteUser', function(req) {
        if(!req.session.su){
            req.io.emit('su_failed');
            return false;
        }
        console.log(req.session);
        console.info('sever got deleteUser',req.data);
        User.findOne({_id:req.data.id}).remove().exec(function(err, user) { 
            if (err) return console.error(err);

            req.io.emit('userDeleted');
            User.find({},'user_name department status').sort('department').exec(function(err, users) { 
                if (err) return console.error(err);
                req.io.emit('usersList',users);
                console.log("server sent usersList",users);
            });
            User.find({}).sort('department').exec(function(err, users) { 
                if (err) return console.error(err);
                req.io.emit('employeesList',users);
                console.log("server sent employeesList",users);
            });



        });
    });
*/
    console.log('routes');
    //server static files from /assets
    app.use('/', express.static(__dirname + '/assets'));


    // Send the client html. on /
    // 
    // 
    app.get('/', function(req, res) {
        console.log('[GET /]');
        req.session.lastloadDate = new Date().toString(); //session testing or page session time tracking, you decide
        res.sendfile(__dirname + '/html/homepage.html');
    });

    app.get('/listen',function(req,res){
        console.log('[GET /listen]');
        req.session.lastloadDate = new Date().toString(); //session testing or page session time tracking, you decide
        res.sendfile(__dirname + '/html/listen.html');
    });

    console.log('server started on port '+port);
    app.listen(port);

});




mongoose.connect('mongodb://localhost/vikrates');







































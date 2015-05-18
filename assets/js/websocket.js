window.admin=false;
moment.tz.add([
    'America/New_York|EST EDT|50 40|0101|1Lz50 1zb0 Op0'
]);
var toLocalTime = function(time) {

    return moment(time).tz('America/New_York').format('h:mm A [on] MM/DD/YY');
};
var toLocalTime_export = function(time) {
    var ts =moment(time).tz('America/New_York');
    return {
        time:   ts.format('h:mm A'),
        date:   ts.format('MM/DD/YY')
    };
};

var toSeverTime = function(time) {

    return moment(time).tz('America/New_York').format('h:mm A [on] MM/DD/YY');
};

/* realtime io; this stuffs like crack to yo app dawg */
io = io.connect();

var loginData = {};
loginData.psudoUserId = Math.round(Math.random()*1999999999999*Math.random());
loginData.room =  'Timeclock_lobby_1';
// Emit ready event with room name.
io.emit('ready', loginData);

// Listen for the announce event.
io.on('announce', function(data) {
    console.log("websocket got announce  ",data,"\t"+ new Date().toString());
    //remove in production
});
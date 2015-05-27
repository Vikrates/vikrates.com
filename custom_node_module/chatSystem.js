var chatSystem = function(options){
    this.motd = '';
    this.maxMessagePerSecond=5
    this.warnsBeforeMute=5
    this.mutesBeforeBan=5
    this.guestAutoMute=true
    if(options!==undefined){
        if(typeof(options)== 'object'){
            if(options.hasOwnProperty('consolePrefix')){
                this.consolePrefix = options.consolePrefix;
            }
            if(options.hasOwnProperty('maxMessagePerSecond')){
                this.maxMessagePerSecond = options.maxMessagePerSecond;
            }

            if(options.hasOwnProperty('warnsBeforeMute')){
                this.warnsBeforeMute = options.warnsBeforeMute;
            }

            if(options.hasOwnProperty('mutesBeforeBan')){
                this.mutesBeforeBan = options.mutesBeforeBan;
            }
            if(options.hasOwnProperty('guestAutoMute')){
                this.guestAutoMute = options.guestAutoMute;
            }
            if(options.hasOwnProperty('motd')){
                this.motd = options.motd;
            }
        }
    }
    this.chatCommands = {
        mute:function(msg){
            var opts = msg.split(' ');
            if(opts.length==2){
                this.mute(opts[1],600); //10min mute default
            }else if(opts.length==3){
                this.mute(opts[1],opts[2]); //custom mute time in seconds
            }
        },
        ban:function(msg){
            var opts = msg.split(' ');
            if(opts.length==2){
                this.ban(opts[1],600); //10min mute default
            }else if(opts.length==3){
                this.ban(opts[1],opts[2]); //custom mute time in seconds
            }
        },
        mod:function(msg){
            var opts = msg.split(' ');
            if(opts.length==2){
                if(opts[1]=='true')
                    this.promote(opts[1]); // /op {user} true
                else
                    this.demote(opts[1]); //  /op {user} false
            }else if(opts.length==3){ // allows for time based demotes or promotes
                if(opts[1]=='true')
                    this.promote(opts[1],opts[3]); // /op {user} true 600 
                else
                    this.demote(opts[1],opts[3]); //  /op {user} false 600 
            }
        },
        op:function(msg){
            var opts = msg.split(' ');
            if(opts.length==2){
                this.op(opts[1]); //10min mute default
            }
        },
        deop:function(msg){
            var opts = msg.split(' ');
            if(opts.length==2){
                this.deop(opts[1]); //10min mute default
            }
        },
    };
    this.promote=function(user,time){
        if(time==undefined){time=null};

    };
    this.demote=function(user,time){
        if(time==undefined){time=null};

    };
    this.op=function(user){

    };
    this.deop=function(user){

    };
    this.mute=function(user,time){
        if(time==undefined){time=600};

    };
    this.ban=function(user,time){
        if(time==undefined){time=600};

    };
    this.getUserList=function(){
        
    };
    this.getChatHistory=function(){
        
    };

}

var fs = require('fs');
module.exports = new chatSystem({
    consolePrefix: '[CS] ',
    maxMessagePerSecond:5,
    warnsBeforeMute:5,
    mutesBeforeBan:100,
    guestAutoMute:false,
    motd:fs.readFileSync('ChatMotd')
});


var playlistManger = function(options){
//init
this.needsTick=true;
this.currentlyPlaying=null;
this.consolePrefix = '';
this.queue = [];
this._UsersToVotes ={};
this.voteSkips = {};
this.votesRequiredToSkip=1;
this.maxVotes = 1;
this.isPlaying = false;

if(options!==undefined){
    if(typeof(options)== 'object'){
        if(options.hasOwnProperty('consolePrefix')){
            this.consolePrefix = options.consolePrefix;
        }
        if(options.hasOwnProperty('votesRequiredToSkip')){
            this.votesRequiredToSkip = options.votesRequiredToSkip;
        }
    }
}




//main functions
this.addSong=function(obj){
    obj.maxSeconds =this.__convert_time(obj.maxSeconds);
    console.log('addSong',obj);
    obj.votes = 1;
    this.queue.push(obj);
    
    this.app.io.sockets.emit('newQ',this.queue);
    console.log(this.consolePrefix+' BroadCasting new Q');
    this.app.io.sockets.emit('CurrentlyPlaying',this.currentlyPlaying);
    console.log(this.consolePrefix+' BroadCasting new CurrentlyPlaying');
     
};

this.voteSkip = function(id){
    console.log('voteskip',id,this.req.sessionID);
    if(this.voteSkips.hasOwnProperty(id)){
        this.voteSkips[id]++;
        console.log(this.voteSkips[id]);
        console.log(this.totalUsers*this.votesRequiredToSkip);
        console.log(this.voteSkips[id]>(this.totalUsers*this.votesRequiredToSkip))
        if(this.voteSkips[id]>(this.totalUsers*this.votesRequiredToSkip)){
            this.nextSong();
        }            
        return true;
    }
    return false
}
this.initSong=function(){
	if(this.queue.length>0){
        var item =  this.queue.pop();
        console.log(this.consolePrefix+'next song is_');
        console.log(item);
        console.log(this.consolePrefix+'cleaning _UsersToVotes');
        for(var user in this._UsersToVotes){
            user = this._UsersToVotes[user];
            var index = user.indexOf(item.id);
            if(index!==-1){
                this._UsersToVotes[user].splice(index,1);
                console.log(this.consolePrefix+'removed userToVotes entry for '+user+' index '+index);
            }
        }
        this.isPlaying = true;
        this.currentlyPlaying = item; 
        this.currentlyPlaying.seconds=0;
        return true
    }
    return false;
}

this.nextSong = function(){
    if(this.queue.length>0){
        var item =  this.queue.pop();
        console.log(this.consolePrefix+'next song is_');
        console.log(item);
        console.log(this.consolePrefix+'cleaning _UsersToVotes');
        for(var user in this._UsersToVotes){
            user = this._UsersToVotes[user];
            var index = user.indexOf(item.id);
            if(index!==-1){
                this._UsersToVotes[user].splice(index,1);
                console.log(this.consolePrefix+'removed userToVotes entry for '+user+' index '+index);
            }
        }
        this.isPlaying = true;
        this.currentlyPlaying = item; 
        this.currentlyPlaying.seconds=0;
        this.app.io.sockets.emit('CurrentlyPlaying',this.currentlyPlaying);
        console.log(this.consolePrefix+' BroadCasting new CurrentlyPlaying');
        this.app.io.sockets.emit('newQ',this.queue);
        console.log(this.consolePrefix+' BroadCasting new Q');
        return true
    }
    //this.needsTick = false;
   
    this.app.io.sockets.emit('noMedia');

    return false;
};
this.vote = function(id,userId){
    id = this.idToIndex(id);
    if(id!==false){ 
        if(this._UsersToVotes.hasOwnProperty(this.req.session.user.userId))
            this._UsersToVotes[this.req.session.user.userId].push({id:id,weight:this.req.session.user.voteWeight});
        else{
            this._UsersToVotes[this.req.session.user.userId]=[];
            this._UsersToVotes[this.req.session.user.userId].push({id:id,weight:this.req.session.user.voteWeight});
        }

        this.queue[id].votes+=this.req.session.user.voteWeight;  
        this.sortVotes();
        this.app.io.sockets.emit('newQ',this.queue);
        console.log(this.consolePrefix+' BroadCasting new Q');
    }
    return false;
};

 this.userLeft = function(){
    if(this._UsersToVotes.hasOwnProperty(this.req.session.user.userId)){
        if(this._UsersToVotes[this.req.session.user.userId].length>0)
            for(var i =0; i<this._UsersToVotes[this.req.session.user.userId].length;i++){
                this.queue[this._UsersToVotes[this.req.session.user.userId][i].id].votes-=this._UsersToVotes[this.req.session.user.userId][i].weight;
                console.log(this.consolePrefix+'removing vote',this.req.session.user.userId,i,this._UsersToVotes[this.req.session.user.userId][i].weight);
            }
        this.sortVotes();
    }
};
this.newUser = function(){
    if(this._UsersToVotes.hasOwnProperty(this.req.sessionID)){
        console.log('user session exists');
    }else{
        console.log('user session doesnt exist');
        this._UsersToVotes[this.req.sessionID]=[];
    }
    if(this.queue.length>0 || this.isPlaying){
        if(this.currentlyPlaying==null){
            this.nextSong();
        }
        this.req.io.emit('CurrentlyPlaying',this.currentlyPlaying);
        console.log(this.consolePrefix+' BroadCasting new CurrentlyPlaying');
        this.req.io.emit('newQ',this.queue);
        console.log(this.consolePrefix+' BroadCasting new Q');
    }else{
        req.io.emit('NoMedia');
    }
}




//utility functions

this.sortVotes = function() {
    if(this.queue.length>1)
        this.queue.sort(function(a, b) {
            var x = a.votes; var y = b.votes;
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
};

this.idToIndex = function(id){
    console.log('id lookup_ '+id);
    for(var i=0;i<this.queue.length;i++){
        if(this.queue[i].id==id){
            console.log(this.consolePrefix+'id found at index '+i);
            return i; 
        }
    }
    console.log(this.consolePrefix+'id not found');
    return false;
};


this.__convert_time = function(duration) {
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
this.setApp=function(app){
    this.app = app;
    return this;
}

this.setReq=function(req){
    this.req = req;
    return this;
}
};





//module construct
module.exports = new playlistManger({
consolePrefix: '[PM] ',
votesRequiredToSkip:0.75,//75%
});













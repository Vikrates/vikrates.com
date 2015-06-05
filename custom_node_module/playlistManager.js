
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
        this.queue.push(obj);
    };

    this.voteSkip = function(id,user){
        console.log('voteskip',id,user);
        if(this.voteSkips.hasOwnProperty(id)){
            this.voteSkips[id]++;
            if(this.voteSkips[id]>(this.totalUsers*this.votesRequiredToSkip)){
                this.nextSong();
            }            
            return true;
        }
        return false
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
        this.needsTick = false;
       
        this.app.io.sockets.emit('noMedia');

        return false;
    };

    this.vote = function(id,userId,weight){
        if(weight==undefined) weight = 1;
        id = this.idToIndex(id);
        if(id!==false){ 
            if(this._UsersToVotes.hasOwnProperty(userId))
                this._UsersToVotes[userId].push({id:id,weight:weight});
            else{
                this._UsersToVotes[userId]=[];
                this._UsersToVotes[userId].push({id:id,weight:weight});
            }

            this.queue[id].votes+=weight;  
            this.sortVotes();
            this.app.io.sockets.emit('newQ',this.queue);
            console.log(this.consolePrefix+' BroadCasting new Q');
        }
        return false;
    };

    this.userLeft = function(userId){
        if(this._UsersToVotes.hasOwnProperty(userId)){
            if(this._UsersToVotes[userId].length>0)
                for(var i =0; i<this._UsersToVotes[userId].length;i++){
                    this.queue[this._UsersToVotes[userId][i].id].votes-=this._UsersToVotes[userId][i].weight;
                    console.log(this.consolePrefix+'removing vote',userId,i,this._UsersToVotes[userId][i].weight);
                }
            this.sortVotes();
        }
    };
    this.newUser = function(userId){
        if(this._UsersToVotes.hasOwnProperty(userId)){
            console.log('user session exists');
        }else{
            console.log('user session doesnt exist');
            this._UsersToVotes[userId]=[];
        }
        if(this.queue.length>0 || this.isPlaying){
            if(this.currentlyPlaying==null){
                this.nextSong();
            }
            this.app.io.sockets.emit('CurrentlyPlaying',this.currentlyPlaying);
            console.log(this.consolePrefix+' BroadCasting new CurrentlyPlaying');
            this.app.io.sockets.emit('newQ',this.queue);
            console.log(this.consolePrefix+' BroadCasting new Q');
        }else{
            this.app.io.sockets.emit('NoMedia');
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
};





//module construct
module.exports = new playlistManger({
    consolePrefix: '[PM] ',
    votesRequiredToSkip:0.75,//75%
});













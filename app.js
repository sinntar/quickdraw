/**
 * Module dependencies.
 */
var express = require('express')
    , http = require('http')
    , path = require('path');
var app = express();
var admin = require("firebase-admin");
admin.initializeApp({
    credential: admin.credential.cert("key.json")
    , databaseURL: "https://quick-draw-24044.firebaseio.com"
});
var dbRef = admin.database();
// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(express.static(path.join(__dirname, 'public')));
// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

function joinRoom(item) {
    roomRef.on('child_added', function (data) {
        //vm.messages.push(data.val());
        console.log('new user added' + data.val());
        // addCommentElement(postElement, data.key, data.val().text, data.val().author);
    });
    roomRef.on('child_changed', function (data) {
        console.log(data);
        // setCommentValues(postElement, data.key, data.val().text, data.val().author);
    });
    roomRef.on('child_removed', function (data) {
        console.log(data);
        // deleteComment(postElement, data.key);
    });
    roomRef.once('value').then(function (data) {
        console.log("this is webservice call" + data.val());
        //vm.defaultList = data.val();
        $timeout(function () {
            updateMessages(data);
        });
    });
}
var server = http.createServer(app)
    , io = require('socket.io').listen(server);
server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
io.sockets.on('connection', function (socket) {
    //socket.roomClients = [];
    //joinRoom(1223);
    var ref = dbRef.ref("rooms");
    ref.once("value", function (snapshot) {
        console.log('room list' + snapshot.val());
        if (snapshot.val() == null) {
            var usersRef = ref.child("1");
            usersRef.set([{
                userid: 123
                , username: "Ryan Shen"
            }], function (error) {
                if (error) {
                    console.log("Data could not be saved." + error);
                }
                else {
                    socket.join('1');
                    console.log("Socket joined room" + 1);
                }
            });
        }
        else {
            var rooms = snapshot.val();
            console.log('JSON STRINGYFY'   +  JSON.stringyfy(rooms));
            for (var i = 0; i < rooms.length; i++) {
                if (rooms[i].length < 8) {
                    var postsRef = ref.child( i + 1);
                    var newPostRef = postsRef.push();
                    newPostRef.set({
                       userid: 1235
                        , username: "Ryan Shen 1"
                    });
                }
            }
        }
    });
    //var postsRef = roomRef.child(socket);
    socket.emit('draw', {});
    socket.on('draw', function (data) {
        console.log(data);
        socket.broadcast.emit('draw', data);
    });
    socket.on('clear', function (data) {
        console.log(data);
        socket.broadcast.emit('clear', data);
    });
    socket.on("msg", function (data) {
        if (data.id) {
            io.sockets.socket(data.id).emit("msg", socket.store.data.nickname + "<span style='color: green'>对你说：</span>" + data.msg)
        }
        else {
            socket.broadcast.emit("msg", socket.store.data.nickname + "对大家说：" + data.msg);
        }
    });
});
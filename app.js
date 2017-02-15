//NODE_CTF - A CTF Scoreboard Made with:
//node js / express js / jquery / Mysql
//Uses clustering and pooling for high performance
//Created by Christopher Davis
//github.com/chrisjd20/node_ctf
/*
    This file is part of the NODE_CTF Project (see info above).

    NODE_CTF is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    NODE_CTF is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with NODE_CTF.  If not, see <http://www.gnu.org/licenses/>.

    This licence applies to ALL files that come with this file and are listed at:
    github.com/chrisjd20/node_ctf
*/
var cluster = require('cluster');  //used to run multiple instances for performance
var express   =    require("express");
var mysql     =    require('mysql');
var app       =    express();
var md5 = require('md5');
var path = require('path');
var cookieParser = require('cookie-parser');                                              //used for managing cookies
var bodyParser = require('body-parser');                                                  //used for collection POST requests
var fs = require('fs');
var base64 = require('./node_modules/base64');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var http = require('http');
var httpServer = http.createServer(app);
require('events').EventEmitter.defaultMaxListeners = Infinity;

//Default user is admin/admin. Change it asap once you start the server.
//Server Specific items. Change these to your hosts info
var logging = false;                //Still prints to the screen but wont download into the logdata cell in the server table
var dbhost = 'localhost';
var dbuser = 'root';
var dbpass = 'root';
var SSL = false;                    //If you change this to true, you will need to configure lines 53-58
var httpport = 3000;
var httpsport = 3443;

//You will need to configure these lines if you changed ssl to true. AND create ssl keys and put them in the correct path.
if (SSL) {
    var privateKey  = fs.readFileSync('./certs/cert-name.key', 'utf8');
    var certificate = fs.readFileSync('./certs/cert-name.crt', 'utf8');
    var credentials = { key: privateKey, cert: certificate };
    var https = require('https');
    var httpsServer = https.createServer(credentials, app);
}

//This sets the mysql pooling options
var pool      =    mysql.createPool({
    connectionLimit : 10,               //Unsure as of the time of making this but since clustering starts a new worker, this might multiply by the number of workers
    host     : dbhost,
    user     : dbuser,
    password : dbpass,
    database : 'scoreboard',
    multipleStatements: true,
    debug    :  false
});

// Code to run if we're in the master process
if (cluster.isMaster) {
    console.log('[+] Server Started');
    //This is a sepparate connection to setup the initial database. Nothing will be changed if it already exists

    
    var con = mysql.createConnection({
    host: dbhost,
    user: dbuser,
    password: dbpass,
    multipleStatements: true
    });
    try {

        con.query('SELECT * FROM scoreboard.users WHERE name = "admin"',function(err,rows){
            if (err) {
                console.log('[+] Scoreboard db doesnt exist, creating...');
                var statement = "CREATE DATABASE IF NOT EXISTS `scoreboard` /*!40100 DEFAULT CHARACTER SET latin1 */; USE `scoreboard`; CREATE TABLE IF NOT EXISTS `boxes` ( `name` varchar(50) NOT NULL, `boxip` text NOT NULL, `info` text NOT NULL, `flag1` text NOT NULL, `flag2` text NOT NULL, `flag1points` text NOT NULL, `flag2points` text NOT NULL, `quest1` text NOT NULL, `quest2` text NOT NULL, `quest3` text NOT NULL, `answ1` text NOT NULL, `answ2` text NOT NULL, `answ3` text NOT NULL, `quest1points` text NOT NULL, `quest2points` text NOT NULL, `quest3points` text NOT NULL, `hint1` text NOT NULL, `hint2` text NOT NULL, `hint3` text NOT NULL, UNIQUE KEY `name` (`name`) ) ENGINE=MyISAM DEFAULT CHARSET=latin1; CREATE TABLE IF NOT EXISTS `server` ( `name` varchar(50) NOT NULL, `registration` text NOT NULL, `time` text NOT NULL, `news` longtext NOT NULL, `trivia` text NOT NULL, `flags` text NOT NULL, `logdata` longtext NOT NULL, UNIQUE KEY `name` (`name`) ) ENGINE=MyISAM DEFAULT CHARSET=latin1; INSERT INTO `server` (`name`, `registration`, `time`, `news`, `trivia`, `flags`,`logdata`) VALUES ('node_ctf', 'true', '', '', '', '', ''); CREATE TABLE IF NOT EXISTS `users` ( `name` varchar(50) NOT NULL, `hash` text NOT NULL, `cookie` varchar(220) NOT NULL, `cookieexp` text NOT NULL, `flags` text NOT NULL, `trivia` text NOT NULL, `avatarurl` text NOT NULL, `avatarcolor` text NOT NULL, `vmresets` text NOT NULL, UNIQUE KEY `name` (`name`) ) ENGINE=MyISAM DEFAULT CHARSET=latin1; INSERT INTO `users` (`name`, `hash`, `cookie`, `cookieexp`, `flags`, `trivia`, `avatarurl`, `avatarcolor`, `vmresets`) VALUES ('admin', '21232f297a57a5a743894a0e4a801fc3', '', '', '', '', 'static.js?file=boss.png', '#6a8e7f', '');";
                con.commit('UPDATE scoreboard.server SET logdata = ""');                         //Resets the log data every time the server is started
                con.commit('UPDATE scoreboard.server SET news = '+mysql.escape('Welcome to Node_CTF!||||||||Home is where you submit flags||||||||Click targets to display all targets in grey/green if hacked||||||||Click scoreboard to display all the teams based on their scores||||||||Click your name to change your avatar/pass||||||||The side-bar to your right allows you to navigate quickly||||||||Admins may post news here||||||||Captured flags will also be displayed here||||||||'));
                con.commit(statement);
                con.end();
            } else {
                con.commit('UPDATE scoreboard.server SET logdata = ""');                         //Resets the log data every time the server is started
                con.commit('UPDATE scoreboard.server SET news = '+mysql.escape('Welcome to Node_CTF!||||||||Home is where you submit flags||||||||Click targets to display all targets in grey/green if hacked||||||||Click scoreboard to display all the teams based on their scores||||||||Click your name to change your avatar/pass||||||||The side-bar to your right allows you to navigate quickly||||||||Admins may post news here||||||||Captured flags will also be displayed here||||||||'));
                con.end();
                console.log('[+] Scoreboard db exists, moving on...');
            }
            
        });
        con.on('error', function(err) {      
            // do nothing, just move on
        });

    } catch (err) {
        //do nothing if error, just move onv
    }



    //This spawns the new ones
    var cpuCount = require('os').cpus().length;                                                 // Count the machine's CPUs
    for (var i = 0; i < cpuCount; i += 1) {                                                     // Create a worker for each CPU
        cluster.fork();                                                                         // When they are forked, they pass this section since they are not master
    }

// Code to run if we're in a worker process
} else {
    try {

//===========================MYSQL POOLING SECTION=============================//

        //For performing queries
        function mysql_query(thequery, callback) {
            try {
                pool.getConnection(function(err,connection){
                    if (err) {
                        console.log({"code" : 100, "status" : "Error in connection database"});
                        return callback(false);
                    }   
                    connection.query(thequery,function(err,rows){
                        connection.release();
                        if(!err) {
                            return callback(rows);
                        } else {
                            console.log(err);
                            return callback(false);
                        }
                    });
                    connection.on('error', function(err) {      
                        console.log(err);
                        return callback(false); 
                    });
                });
            } catch (err) {
                return callback(false);
            }
        };

        //For committing to the database
        function mysql_commit(thequery) {
            try {
                pool.getConnection(function(err,connection){
                    if (err) {
                        console.log({"code" : 100, "status" : "Error in connection database"});
                        return;
                    }   
                    connection.commit(thequery,function(err){
                        connection.release();
                        if(!err) {
                            return;
                        } else {
                            console.log(err);
                        }
                    });
                    connection.on('error', function(err) {    
                        console.log(err);  
                        return;
                    });
                });
            } catch (err) {
                console.log(err);
            }
        };

//===========================START OF MAIN FUNCTIONS=============================//

        //When users log in, we need to update their board to reflect which flags and trivia they have answered
        //req.body.flagsNtriviaRequest
        function userFlagsNtriviaPull(req, res){
            var username = req.cookies.SCORE.split('.')[0];
            mysql_query("SELECT flags,trivia,name FROM users WHERE name = " + mysql.escape(username), function(rows){
                mysql_query("SELECT hint1,hint2,hint3,name FROM boxes", function(rows2){
                    try {
                        if (rows[0] !== "") {
                            var tmp = rows[0];
                            var newtmp = {};
                            for (var z in rows2) {
                                newtmp[rows2[z].name] = rows2[z];
                                if (parseInt(rows2.length - 1) === parseInt(z)) {
                                    tmp["answers"] = newtmp;
                                    res.send(base64.encode(JSON.stringify(tmp)));
                                }
                            }
                        } else {
                            res.send(base64.encode('{"False":"False"}'))
                        }
                    } catch (err) {
                        console.log(err);
                    }
                });
            });
        };

        function totalizer(thejson, type, callback){
            if (type === 'flags') {
                var triggers = 0;
                var total = 0;
                for (var e in thejson) {
                    if (thejson[e].flag1 === "True") {
                        total += parseInt(thejson[e].flag1points);
                        triggers += 1;
                    } else {
                        triggers += 1;
                    }
                    if (thejson[e].flag2 === "True") {
                        total += parseInt(thejson[e].flag1points);
                        triggers += 1;
                    } else {
                        triggers += 1;
                    }
                }
                while (true) {
                    if (triggers === (2 * Object.keys(thejson).length)) {
                        return callback(total);
                    }
                }
            } else {
                var total2 = 0;
                var triggers2 = 0;
                for (var e in thejson) {
                    if (thejson[e].question1 === "True") {
                        total2 += parseInt(thejson[e].question1points);
                        triggers2 += 1;
                    } else {
                        triggers2 += 1;
                    }
                    if (thejson[e].question2 === "True") {
                        total2 += parseInt(thejson[e].question2points);
                        triggers2 += 1;
                    } else {
                        triggers2 += 1;
                    }
                    if (thejson[e].question3 === "True") {
                        total2 += parseInt(thejson[e].question3points);
                        triggers2 += 1;
                    } else {
                        triggers2 += 1;
                    }
                }
                while (true) {
                    if (triggers2 === (3 * Object.keys(thejson).length)) {
                        return callback(total2);
                    }
                }
            }
        };

        function getMax(arr, prop) {
            var max;
            for (var i=0 ; i<arr.length ; i++) {
                if (!max || parseInt(arr[i][prop]) > parseInt(max[prop]))
                    max = arr[i];
            }
            return max;
        };

        //This was a bit more challenging than I thought. Partly my own fault for the way I structured the sql tables. not my most efficient code but works
        function scoreboardDataGrabber(req, res){
            mysql_query("SELECT name,flags,trivia,avatarurl,avatarcolor FROM users",function (rows){
                mysql_query("SELECT flag1points,flag2points,quest1points,quest2points,quest3points,name FROM boxes", function(rows2){
                        if (!rows2[0]) {
                            res.send('<h1>Scoreboard</h1><div style="height: 1400px; width: 100%;"</div>');
                            return;
                        } else {
                            var tmp = {};
                            var finalcount = 0;
                            for (var e in rows) {
                                if (rows[e].trivia && rows[e].flags) {
                                    tmp[rows[e].name] = {};
                                    tmp[rows[e].name].name = rows[e].name;
                                    tmp[rows[e].name].avatarurl = rows[e].avatarurl;
                                    tmp[rows[e].name].avatarcolor = rows[e].avatarcolor;
                                    var theflagsJson = JSON.parse(rows[e].flags);
                                    var thetriviaJson = JSON.parse(rows[e].trivia);
                                    totalizer(theflagsJson, 'flags', function (num1){
                                        totalizer(thetriviaJson, 'trivia', function (num2){
                                            tmp[rows[e].name].total = (num1 + num2);
                                            finalcount += 1;
                                        });
                                    });
                                }
                            }
                            var total = 0;
                            for (var d in rows2) {
                                total += parseInt(rows2[d].flag1points)
                                total += parseInt(rows2[d].flag2points)
                                total += parseInt(rows2[d].quest1points)
                                total += parseInt(rows2[d].quest2points)
                                total += parseInt(rows2[d].quest3points)
                                if (parseInt(rows2.length - 1) === parseInt(d)) {
                                    tmp['total'] = total + '';
                                    while (true) {
                                        if (finalcount === rows.length) {
                                            finalcount += 1;
                                            html = '<h1>Scoreboard</h1><div class="bgraphcontainer">';
                                            var finalbeforesend = 0;
                                            var tmparray = new Array();
                                            var fin = 0;
                                            for (var name in tmp) {
                                                if (tmp[name].name === "admin") {
                                                    fin += 1;
                                                } else {
                                                    tmparray.push(tmp[name]);
                                                    fin += 1;
                                                }
                                            }
                                            while (true) {
                                                if (fin === Object.keys(tmp).length) {
                                                    fin += 1;
                                                    var tmplength = (tmparray.length -1);
                                                    for (i = 0; i < tmplength; i ++) {
                                                        var maxUser = getMax(tmparray, "total");
                                                        var percentage = (((maxUser.total/tmp.total) * 100) + '').split('.')[0] + '%';
                                                        html += 'Team: '+maxUser.name+'</br>Points: '+maxUser.total+' of '+tmp.total+'</br><div class="bargraph" id="'+maxUser.name+'-barGraphId" style="width: '+percentage+'; background-color: '+maxUser.avatarcolor+';"><image width="80px"height="80px" src="'+maxUser.avatarurl+'" ></image></div><div style="height: 1px;"></div></br>';
                                                        var index = tmparray.indexOf(maxUser);
                                                        tmparray.splice(index, 1);
                                                        finalbeforesend += 1;
                                                    }
                                                    while (true) {
                                                        if ((finalbeforesend + 1)=== Object.keys(tmp).length - 1) {
                                                            finalbeforesend += 1;
                                                            res.send(html + '</div><div style="height: '+(((1400-(Object.keys(tmp).length  * 80))) + "").split('.')[0]+'px; width: '+(((1400-(Object.keys(tmp).length  * 80))) + "").split('.')[0] +'px;"</div>');
                                                            return;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                });
            });
        };

        //Anytime a target is created or deleted, the users flags/trivia cell needs to be updated with the correct JSON
        function cleanUsersFlagsNtrivia(boxname, type, thearray) {
            try {
                if (type === "del") {
                    mysql_query("SELECT flags,trivia,name FROM users",function (rows){
                        if (rows[0].flags !== "" || rows[0].trivia !== '') {
                            for (var e in rows) {
                                if (rows[e].flags && rows[e].trivia) {
                                    var flagJson = JSON.parse(rows[e].flags);
                                    var triviaJson = JSON.parse(rows[e].trivia);
                                    delete flagJson[boxname];
                                    delete triviaJson[boxname];
                                    mysql_commit("UPDATE users SET flags = " + mysql.escape(JSON.stringify(flagJson)) + " WHERE name = " + mysql.escape(rows[e].name));
                                    mysql_commit("UPDATE users SET trivia = " + mysql.escape(JSON.stringify(triviaJson)) + " WHERE name = " + mysql.escape(rows[e].name));
                                }
                            }
                        } else {
                            //Do nothing because there should be no boxes
                        }
                    });
                } else if (type === 'add') {
                    mysql_query("SELECT flags,trivia,name FROM users",function (rows){
                        if (rows[0].flags !== "" || rows[0].trivia !== '') {
                            for (var e in rows) {
                                if (rows[e].flags && rows[e].trivia) {
                                    var flagJson = JSON.parse(rows[e].flags);
                                    var triviaJson = JSON.parse(rows[e].trivia);
                                    flagJson[boxname] = {"flag1":"False","flag2":"False","flag1points": thearray[0],"flag2points":thearray[1]};
                                    triviaJson[boxname] = {"question1":"False","question2":"False","question3":"False","question1points":thearray[2],"question2points":thearray[3],"question3points": thearray[4]}
                                    mysql_commit("UPDATE users SET flags = " + mysql.escape(JSON.stringify(flagJson)) + " WHERE name = " + mysql.escape(rows[e].name));
                                    mysql_commit("UPDATE users SET trivia = " + mysql.escape(JSON.stringify(triviaJson)) + " WHERE name = " + mysql.escape(rows[e].name));
                                }
                            }
                        } else {  //This must mean this is the first box to be added
                            mysql_commit('UPDATE users SET flags = ' +mysql.escape('{"'+boxname+'":{"flag1":"False","flag2":"False","flag1points":"'+thearray[0]+'","flag2points":"'+thearray[1]+'"}}'));
                            mysql_commit('UPDATE users SET trivia = ' +mysql.escape('{"'+boxname+'":{"question1":"False","question2":"False","question3":"False","question1points":"'+thearray[2]+'","question2points":"'+thearray[3]+'","question3points":"'+thearray[4]+'"}}'));
                        }
                    });
                }
            } catch (err) {
                console.log(err);
            }
        };

        //This is the function used to check if a user answered a question properly or not
        function flagSubmitter(req, res) {
            try{
                var username = req.cookies.SCORE.split('.')[0];
                var myArray = ['Such h@ckz0rs!', 'So 133t!', 'Much cyber!','Wow!','Such Non-newb!','Such H@cks!','Very 1337!','Such Wow!','Much Pwnage!','Pwned!','So Pwning!']; 
                if (req.body.flag1) {
                    mysql_query("SELECT flag1 FROM boxes WHERE name = " + mysql.escape(req.body.flagsubmit), function (rows) {
                        if (rows[0].flag1.trim() === req.body.flag1.trim()) {
                            mysql_query("SELECT flags FROM users WHERE name = "+ mysql.escape(username), function(rows2){
                                if (rows2[0].flags !== ""){
                                    var flagJson = JSON.parse(rows2[0].flags);
                                    flagJson[req.body.flagsubmit].flag1 = "True";
                                    mysql_commit("UPDATE users SET flags = " + mysql.escape(JSON.stringify(flagJson)) + " WHERE name = " + mysql.escape(username));   
                                    var rand = myArray[Math.floor(Math.random() * myArray.length)];
                                    newsUpdater('req', 'res', 'user', (username + ' just got a limited shell on ' + req.body.flagsubmit + '. ' + rand ));
                                    res.send('True');
                                } else {
                                    res.send('False');
                                }
                            });
                        } else {
                            res.send('False');
                        }
                    });
                } else if (req.body.flag2) {
                    mysql_query("SELECT flag2 FROM boxes WHERE name = " + mysql.escape(req.body.flagsubmit), function (rows) {
                        if (rows[0].flag2.trim() === req.body.flag2.trim()) {
                            mysql_query("SELECT flags FROM users WHERE name = "+ mysql.escape(username), function(rows2){
                                if (rows2[0].flags !== ""){
                                    var flagJson = JSON.parse(rows2[0].flags);
                                    flagJson[req.body.flagsubmit].flag2 = "True";
                                    mysql_commit("UPDATE users SET flags = " + mysql.escape(JSON.stringify(flagJson)) + " WHERE name = " + mysql.escape(username));
                                    var rand = myArray[Math.floor(Math.random() * myArray.length)];
                                    newsUpdater('req', 'res', 'user', (username + ' just got a root shell on ' + req.body.flagsubmit + '. ' + rand ));
                                    res.send('True');
                                } else {
                                    res.send('False');
                                }
                            });
                        } else {
                            res.send('False');
                        }
                    });
                } else {
                    res.send("False");
                }
            } catch (err) {
                console.log(err);
                res.send("False");
            }
        };

        //This is the function used to check if a user submitted a questions correctly or not
        function questionSubmitter(req, res){
            try {
                var username = req.cookies.SCORE.split('.')[0];
                if (req.body.question1) {
                    mysql_query("SELECT answ1,hint1 FROM boxes WHERE name = " + mysql.escape(req.body.questionsubmit), function (rows){
                        if (rows[0].answ1.trim() === req.body.question1.trim()) {
                            mysql_query("SELECT trivia FROM users WHERE name = " + mysql.escape(username), function(rows2){
                                if (rows2[0] !== ''){
                                    var triviaJson = JSON.parse(rows2[0].trivia);
                                    triviaJson[req.body.questionsubmit].question1 = "True";
                                    mysql_commit("UPDATE users SET trivia = " + mysql.escape(JSON.stringify(triviaJson))+ " WHERE name = "+ mysql.escape(username));
                                    res.send('Your hint is: '+rows[0].hint1)
                                } else {
                                    res.send("False");
                                }
                            });
                        } else {
                            res.send("False");
                        }
                    });
                } else if (req.body.question2) {
                    mysql_query("SELECT answ2,hint2 FROM boxes WHERE name = " + mysql.escape(req.body.questionsubmit), function (rows){
                        if (rows[0].answ2.trim() === req.body.question2.trim()) {
                            mysql_query("SELECT trivia FROM users WHERE name = " + mysql.escape(username), function(rows2){
                                if (rows2[0] !== ''){
                                    var triviaJson = JSON.parse(rows2[0].trivia);
                                    if (triviaJson[req.body.questionsubmit].question1 === "False") {
                                        res.send("Cheat");
                                    } else {
                                        triviaJson[req.body.questionsubmit].question2 = "True";
                                        mysql_commit("UPDATE users SET trivia = " + mysql.escape(JSON.stringify(triviaJson))+ " WHERE name = "+ mysql.escape(username));
                                        res.send('Your hint is: '+rows[0].hint2)
                                    }
                                } else {
                                    res.send("False");
                                }
                            });
                        } else {
                            res.send("False");
                        }
                    });
                } else if (req.body.question3) {
                    mysql_query("SELECT answ3,hint3 FROM boxes WHERE name = " + mysql.escape(req.body.questionsubmit), function (rows){
                        if (rows[0].answ3.trim() === req.body.question3.trim()) {
                            mysql_query("SELECT trivia FROM users WHERE name = " + mysql.escape(username), function(rows2){
                                if (rows2[0] !== ''){
                                    var triviaJson = JSON.parse(rows2[0].trivia);
                                    if (triviaJson[req.body.questionsubmit].question1 === "False" || triviaJson[req.body.questionsubmit].question2 === "False") {
                                        res.send("Cheat");
                                    } else {
                                        triviaJson[req.body.questionsubmit].question3 = "True";
                                        mysql_commit("UPDATE users SET trivia = " + mysql.escape(JSON.stringify(triviaJson))+ " WHERE name = "+ mysql.escape(username));
                                        res.send('Your hint is: '+rows[0].hint3)
                                    }
                                } else {
                                    res.send("False");
                                }
                            });
                        } else {
                            res.send("False");
                        }
                    });
                } else (
                    res.send('False')
                )
            } catch (err) {
                console.log(err);
                res.send('False');
            }
        };
        
        //CookieChecking
        function cookieChecker(cookie, callback) {
            //Performs Mysql Query from the pooling section
            var username = cookie.split('.')[0];
            mysql_query("SELECT cookieexp FROM users WHERE cookie = " + mysql.escape(cookie), function (rows) {
                try {
                    if (rows[0]) {                                                      //if the cookie was correct, then user data would result. False if not
                        var currentDate = new Date();
                        var cookiedate = new Date(rows[0].cookieexp);
                        if (+currentDate < +cookiedate) {
                            callback(true);
                        } else {
                            mysql_commit("UPDATE users SET cookieexp = '', cookie = '' WHERE name = " + mysql.escape(username));
                            callback(false);
                        }
                    } else {
                        callback(false);
                    }
                } catch (err) {
                    callback(false);
                }
            });
        };


        //Adds hours to date
        Date.prototype.addHours = function(h) {    
            this.setTime(this.getTime() + (h*60*60*1000)); 
            return this;   
        }

        //Converts date to proper format
        Date.prototype.yyyymmdd = function() {
        var mm = this.getMonth() + 1; // getMonth() is zero-based
        var dd = this.getDate();

        return [this.getFullYear(),
                (mm>9 ? '' : '0') + mm,
                (dd>9 ? '' : '0') + dd
                ].join('-');
        };

        //new Date("2015-03-25T12:00:00");
        //makes cookies for user login
        function cookieMaker(username, callback) {
            mysql_query("SELECT cookie FROM users WHERE name = " + mysql.escape(username), function (rows) {
                try {
                    if (rows[0].cookie && rows[0].cookie !== "" && rows[0].cookie !== null) {
                        callback(rows[0].cookie);
                    } else {
                        var hash = username + ".";
                        var exp = '';
                        var options = { hour12: false };
                        var date = new Date();
                        date = date.addHours(24);
                        exp += date.yyyymmdd() + 'T';
                        exp += date.toLocaleString('en-US', options).split(' ')[1]
                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890123456789";
                        for( var i=0; i < 160; i++ ) {
                            hash += possible.charAt(Math.floor(Math.random() * possible.length));
                        }
                        mysql_commit("UPDATE users SET cookie = "+mysql.escape(hash)+" WHERE name = "+mysql.escape(username));
                        mysql_commit("UPDATE users SET cookieexp = "+mysql.escape(exp)+" WHERE name = "+mysql.escape(username));
                        callback(hash);
                    }
                } catch (err) {
                    console.log(err);
                    callback('False');
                }
            });
        };

        //serves up the login page
        function loginPage(res) {
            res.cookie("SCORE" , 'False').sendFile('html/login.html', {root: __dirname });
        };

        //Reads files in a directory and serves up the results in html
        function galleryHtml(callback) {
            try {
                const icons = './pub/icons/';
                var html = '<div id="gallery">';
                var items = Array('cde7b0','a3bfa8','b4656f','f4a259','7286a0','6a8e7f','989572','f4a259','3cbbb1','617073','7a93ac','50723c','568ea3','f18805','568ea3','d95d39','79a9d1','afa2ff','7a89c2','50723c','ffadc6','623cea','e9f1f7','cb8589','dde8b9','a3a3a3','84a9c0','542e71','6a66a3','cde7b0','a3bfa8','b4656f','f4a259','7286a0','6a8e7f','989572','f4a259','3cbbb1','617073','7a93ac','50723c','568ea3','f18805','568ea3','d95d39','79a9d1','afa2ff','7a89c2','50723c','ffadc6','623cea','e9f1f7','cb8589','dde8b9','a3a3a3','84a9c0','542e71','6a66a3','cde7b0','a3bfa8','b4656f','f4a259','7286a0','6a8e7f','989572','f4a259','3cbbb1','617073','7a93ac','50723c','568ea3','f18805','568ea3','d95d39','79a9d1','afa2ff','7a89c2','50723c','ffadc6','623cea','e9f1f7','cb8589','dde8b9','a3a3a3','84a9c0','542e71','6a66a3');
                var item = '';
                fs.readdir(icons, (err, files) => {
                    files.forEach(file => {
                        var tmp = file.search('.png');
                        if (tmp !== -1) {
                            item = items[Math.floor(Math.random()*items.length)];
                            html += '<div class="galleryImages" style="background-color: #'+item+'; border: 1px solid;"><image class="avatars" height="170px" width="170px" src="static.js?file=icons/'+file+'" onclick=\'imageSEL("static.js?file=icons/'+file+'");\'></image></div>'
                        }
                    });
                    html += '</div>'
                    callback(html);
                });
            } catch (err) {
                console.log(err);
                callback('error');
            }
        };

        function adminChecker(thecookie, callback) {
            try {
                var name = thecookie.split('.')[0];
                mysql_query("SELECT * FROM users WHERE name = "+ mysql.escape(name)+ " AND cookie = " + mysql.escape(thecookie), function(rows) {
                    if (rows[0]) {
                        if (name === "admin") {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    } else {
                        callback(false);
                    }
                });
            } catch (err) {
                console.log(err);
                callback(false);
            }
        };

        //for creating new users. Admins can always create new users, otherwise, registration needs to be on
        function teamCreater(req, res){
            try {
                adminChecker(req.cookies.SCORE, function(truefalse){
                    if (truefalse) {
                        if (req.body.name.length > 3 && req.body.name.match(/^(?:\w|\_)+$/g) !== null) {
                            mysql_query("SELECT name FROM users WHERE name = "+ mysql.escape(req.body.name), function (rows){
                                if (rows[0]){
                                    res.send('That username is already taken!');
                                } else {
                                    var hash = "";
                                    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890123456789";
                                    for( var i=0; i < 8; i++ ) {
                                        hash += possible.charAt(Math.floor(Math.random() * possible.length));
                                    }
                                    mysql_query("SELECT flags,trivia FROM users WHERE name = 'admin'", function (rows) {
                                        mysql_commit("INSERT into users (name, hash, avatarurl, avatarcolor, flags, trivia, vmresets, cookie, cookieexp) VALUES ("+mysql.escape(req.body.name)+" , "+mysql.escape(md5(hash))+" , "+mysql.escape('static.js?file=question-mark.png')+" , "+mysql.escape('#ffffff')+" , "+mysql.escape((rows[0].flags).replace(/True/g, "False"))+" , "+mysql.escape((rows[0].trivia).replace(/True/g, "False"))+" , 4 , '', '')");
                                        res.send('The user "'+req.body.name+'" with password "'+hash+'" has been created!');
                                    });
                                }
                            });
                        } else {
                            res.send('A value provided was incorrect. Usernames must be > 4 and alpha/numeric/_');
                        }
                    } else {
                        mysql_query("SELECT registration FROM server", function(rows){
                            if (rows[0].registration === 'true') {
                                if (req.body.name.length > 3 && req.body.name.match(/^(?:\w|\_)+$/g) !== null && req.body.password.match(/^(?:\w|\S)+$/g) !== null && req.body.password.length > 7 && req.body.imgurl && req.body.imgcolor && req.body.imgcolor.match(/^\#\w+?$/g) !== null && req.body.imgurl.match(/^static\.js\?file\=icons\/(?:\w|\-|\_|\d)+?\.\w\w?\w?\w?$/g) !== null ) {
                                    mysql_query("SELECT name FROM users WHERE name = "+ mysql.escape(req.body.name), function (rows){
                                        if (rows[0]){
                                            res.send('That username is already taken!');
                                        } else {
                                            mysql_query("SELECT flags,trivia FROM users WHERE name = 'admin'", function (rows) {
                                                mysql_commit("INSERT into users (name, hash, avatarurl, avatarcolor, flags, trivia, vmresets, cookie, cookieexp) VALUES ("+mysql.escape(req.body.name)+" , "+mysql.escape(md5(req.body.password))+" , "+mysql.escape(req.body.imgurl)+" , "+mysql.escape(req.body.imgcolor)+" , "+mysql.escape((rows[0].flags).replace(/True/g, "False"))+" , "+mysql.escape((rows[0].trivia).replace(/True/g, "False"))+" , 4 , '', '')");
                                                res.send('True');
                                            });
                                        }
                                    });
                                } else {
                                    res.send('A value provided was incorrect. Paswords must be > 8 in length. Usernames must be > 4 and alpha/numeric/_');
                                }
                            } else {
                                res.send('Sorry but registration is currently closed!');
                            }
                        });
                    }
                });
            } catch (err) {
                console.log(err);
                res.send('Denied - e');
            }
        };

        //This function adds a new target that admin requests be put in
        function targetAdder(req, res){
            try{
                var targetname = (req.body.targetname + '');
                var targetip = (req.body.targetip+ '');
                var targetinfo = (req.body.targetinfo+ '');
                var targetflag1 = (req.body.targetflag1+ '');
                var targetflag1points = (req.body.targetflag1points+ '');
                var targetflag2 = (req.body.targetflag2+ '');
                var targetflag2points = (req.body.targetflag2points+ '');
                var targetquestion1 = (req.body.targetquestion1+ '');
                var targetanswer1 = (req.body.targetanswer1+ '');
                var targetquestion1points = (req.body.targetquestion1points+ '');
                var targetquestion2 = (req.body.targetquestion2+ '');
                var targetanswer2 = (req.body.targetanswer2+ '');
                var targetquestion2points = (req.body.targetquestion2points+ '');
                var targetquestion3 = (req.body.targetquestion3+ '');
                var targetanswer3 = (req.body.targetanswer3+ '');
                var targetquestion3points = (req.body.targetquestion3points+ '');
                var targethint3 = (req.body.targethint3+ '');
                var targethint2 = (req.body.targethint2+ '');
                var targethint1 = (req.body.targethint1+ '');
                mysql_query("SELECT * FROM boxes WHERE name = " + mysql.escape(targetname), function (rows) {
                    if (rows[0]) {
                        res.send('Sorry but that target name is already taken!');
                    } else {
                        mysql_commit("INSERT INTO boxes (name, boxip, info, flag1, flag2, flag1points, flag2points, quest1, quest2, quest3, answ1, answ2, answ3, quest1points, quest2points, quest3points, hint1, hint2, hint3) VALUES ( "+mysql.escape(targetname)+", "+mysql.escape(targetip)+", "+mysql.escape(targetinfo)+", "+mysql.escape(targetflag1)+", "+mysql.escape(targetflag2)+", "+mysql.escape(targetflag1points)+", "+mysql.escape(targetflag2points)+", "+mysql.escape(targetquestion1)+", "+mysql.escape(targetquestion2)+", "+mysql.escape(targetquestion3)+", "+mysql.escape(targetanswer1)+", "+mysql.escape(targetanswer2)+", "+mysql.escape(targetanswer3)+", "+mysql.escape(targetquestion1points)+", "+mysql.escape(targetquestion2points)+", "+mysql.escape(targetquestion3points)+", "+mysql.escape(targethint1)+", "+mysql.escape(targethint2)+", "+mysql.escape(targethint3)+")");
                        cleanUsersFlagsNtrivia(targetname, "add", new Array(targetflag1points,targetflag2points,targetquestion1points,targetquestion2points,targetquestion3points));
                        res.send('Target added to the scoreboard!');
                    }
                });
            } catch (err) {
                console.log(err);
                res.send('err');
            }

        };


        //This pulls in target_template.html (target boxes column) then iterates over each box and puts its value there and sends as base64
        function mainBoardBuilder(req, res){ 
            try {
                mysql_query("SELECT * FROM boxes", function(rows){
                    if (rows[0]) {
                        var original = fs.readFileSync('./html/target_template.html', 'utf-8');
                        //var thejava = fs.readFileSync('./api.js', 'utf-8');
                        var content = '';
                        var tmp = '';
                        for (var e in rows) {  
                            content = original + '\n'                      
                            content = content.replace('TARGETSIDGOESHERE', rows[e].name);
                            content = content.replace('TARGETSNAMEANDIPGOESHERE', rows[e].name + ' ' + rows[e].boxip);
                            content = content.replace('TARGETSINFOGOESHERE', "Limited Flag: " + rows[e].flag1points + ' pts</br>\n' + "Root Flag: " + rows[e].flag2points +' pts</br>\n'+ "Question 1: " + rows[e].quest1points +' pts</br>\n' +"Question 2: " + rows[e].quest2points + ' pts</br>\n'+"Question 3: " + rows[e].quest3points+' pts</br></br>\n' +rows[e].info);
                            content = content.replace('LIMITEDFLAGID', rows[e].name + '-flag1');
                            content = content.replace('LIMITEDFLAGBUTTONID',rows[e].name + '-flag1button');
                            content = content.replace('ROOTFLAGID', rows[e].name + '-flag2');
                            content = content.replace('ROOTFLAGBUTTONID',rows[e].name + '-flag2button');
                            content = content.replace('TARGETQUESTION1GOESHERE',rows[e].quest1);
                            content = content.replace('TARGETQUESTION1PREID',rows[e].name + '-preid1');
                            content = content.replace('TARGETQUESTION2PREID',rows[e].name + '-preid2');
                            content = content.replace('TARGETQUESTION3PREID',rows[e].name + '-preid3');
                            content = content.replace('TARGETQUEST1INPUT', rows[e].name + '-quest1input');
                            content = content.replace('TARGETQUEST1SUBMIT', rows[e].name + '-quest1submit');
                            content = content.replace('TARGETHINT1', rows[e].name + '-hint1');
                            content = content.replace('TARGETQUESTION2GOESHERE',rows[e].quest2);
                            content = content.replace('TARGETQUEST2INPUT', rows[e].name + '-quest2input');
                            content = content.replace('TARGETQUEST2SUBMIT', rows[e].name + '-quest2submit');
                            content = content.replace('TARGETHINT2', rows[e].name + '-hint2');
                            content = content.replace('TARGETQUESTION3GOESHERE',rows[e].quest3);
                            content = content.replace('TARGETQUEST3INPUT', rows[e].name + '-quest3input');
                            content = content.replace('TARGETQUEST3SUBMIT', rows[e].name + '-quest3submit');
                            content = content.replace('TARGETHINT3', rows[e].name + '-hint3');
                            content = content.replace('LIMITEDFLAGCONTAINER', rows[e].name + '-flag1container');
                            content = content.replace('ROOTFLAGCONTAINER', rows[e].name + '-flag2container');
                            content = content.replace('QUEST1A', rows[e].name + '-A');
                            content = content.replace('QUEST1B', rows[e].name + '-B');
                            content = content.replace('QUEST1C', rows[e].name + '-C');
                            content = content.replace('QUEST1TOGGLEA', rows[e].name + '-A');
                            content = content.replace('QUEST1TOGGLEB', rows[e].name + '-B');
                            content = content.replace('QUEST1TOGGLEC', rows[e].name + '-C');
                            tmp += content + '\n'
                            if (parseInt(rows.length - 1) === parseInt(e)) {
                                res.send(base64.encode(tmp + '<script src="static.js?file=js/api.js"></script>'));   //Sends as base64 to ensure data doesn't get garbled
                            }
                        }
                    } else {
                        //var notargets = fs.readFileSync('./html/svg-notargets.html', 'utf-8');
                        res.send(base64.encode(("<div style='position: relative; width: 100%; height: 1400px;'></div>")));
                    }
                });
            } catch (err) {
                console.log(err);
                res.send(base64.encode(("<div style='position: relative; width: 100%; height: 1400px;'></div>")));
            }
        };

        function sideBoardBuilder(req, res){ 
            mysql_query("SELECT * FROM boxes", function(rows){
                try {
                    if (rows[0]) {
                        var tmp = '<li><a href="#">PgUp</a></li>';
                        for (var e in rows) {                        
                            tmp += '<li><a onclick="mover(\''+rows[e].name+'\')" href="#">'+rows[e].name+'</a></li>'
                            if (parseInt(rows.length - 1) === parseInt(e)) {
                                res.send(tmp);   
                            }
                        }
                    } else {
                        res.send('<li><a href="#">PgUp</a></li>');
                    }
                } catch (err) {
                    console.log(err);
                    res.send('<li><a href="#">PgUp</a></li>');
                }
            });
        };


        //This is where the target html is made for the admin panel and the regular users panel
        function targetGalleryHtml(req, res, size) {
            try {
                if (size === 'small') {
                    mysql_query("SELECT * FROM boxes", function(rows) {
                        if (rows[0]) {
                            var tmp = '';
                            for (var e in rows) {
                                tmp += '<div onclick=\'deltarget("'+rows[e].name+'");\' class="galleryImages" style="font-size: 14px; width= 80px; height:80px; border: 1px solid; background-color: #80ff80; border-radius: 5%;"><p>'+rows[e].name+' '+rows[e].boxip+'</p></div>'
                                if (parseInt(rows.length - 1) === parseInt(e)) {
                                    res.send(tmp);
                                }
                            }
                        } else {
                            res.send("<h1>Targets</h1>");
                        }
                    });     
                } else if (size == "big"){    //style="background-color: rgba(128, 255, 128, 0.6);"  green  style="background-color: rgba(211,211,211, 0.6);"   grey
                    var username = req.cookies.SCORE.split('.')[0];
                    mysql_query("SELECT flags FROM users WHERE name = " + mysql.escape(username), function(rows2){
                        mysql_query("SELECT * FROM boxes", function(rows) {
                            if (rows[0]) {
                                var tmp = '';
                                for (var e in rows) {
                                    var thejson = JSON.parse(rows2[0].flags);
                                    if (thejson[rows[e].name] && thejson[rows[e].name]) {
                                        if (thejson[rows[e].name].flag1 === "True" && thejson[rows[e].name].flag2 === "True" ) {
                                            tmp += '<div onclick="exploder(this.id)" class="touter" id="'+rows[e].name + '-touter'+'"><text>'+rows[e].name+'</text></br>'+rows[e].boxip+'<div style="background-color: rgba(128, 255, 128, 0.7);" class="tblock"><div style="background-color: rgba(128, 255, 128, 0.7);" class="tblockInner">Root<p>'+rows[e].flag2points+' pts</p></div>Limited<p>'+rows[e].flag1points+' pts</p></div></div>'
                                            if (parseInt(rows.length - 1) === parseInt(e)) {
                                                //var svg = fs.readFileSync('./svg.html', 'utf-8');
                                                res.send('<h1>Targets</h1>' + tmp+  "<script>strober(5);</script><div style='position: relative; width: 100%; height: 1400px;'></div>");
                                            }
                                        } else if (thejson[rows[e].name].flag1 === "False" && thejson[rows[e].name].flag2 === "False" ) {
                                            tmp += '<div onclick="exploder(this.id)" class="touter" id="'+rows[e].name + '-touter'+'"><text>'+rows[e].name+'</text></br>'+rows[e].boxip+'<div style="background-color: rgba(211,211,211, 0.7);" class="tblock"><div style="background-color: rgba(211,211,211, 0.8);" class="tblockInner">Root<p>'+rows[e].flag2points+' pts</p></div>Limited<p>'+rows[e].flag1points+' pts</p></div></div>'
                                            if (parseInt(rows.length - 1) === parseInt(e)) {
                                                //var svg = fs.readFileSync('./svg.html', 'utf-8');
                                                res.send('<h1>Targets</h1>' + tmp+  "<script>strober(5);</script><div style='position: relative; width: 100%; height: 1400px;'></div>");
                                            }
                                        } else if (thejson[rows[e].name].flag1 === "True" && thejson[rows[e].name].flag2 === "False" ) {
                                            tmp += '<div onclick="exploder(this.id)" class="touter" id="'+rows[e].name + '-touter'+'"><text>'+rows[e].name+'</text></br>'+rows[e].boxip+'<div style="background-color: rgba(128, 255, 128, 0.7);"  class="tblock"><div style="background-color: rgba(211,211,211, 0.8);" class="tblockInner">Root<p>'+rows[e].flag2points+' pts</p></div>Limited<p>'+rows[e].flag1points+' pts</p></div></div>'
                                            if (parseInt(rows.length - 1) === parseInt(e)) {
                                                //var svg = fs.readFileSync('./svg.html', 'utf-8');
                                                res.send('<h1>Targets</h1>' + tmp+  "<script>strober(5);</script><div style='position: relative; width: 100%; height: 1400px;'></div>");
                                            }
                                        } else if (thejson[rows[e].name].flag1 === "False" && thejson[rows[e].name].flag2 === "True" ) {
                                            tmp += '<div onclick="exploder(this.id)" class="touter" id="'+rows[e].name + '-touter'+'"><text>'+rows[e].name+'</text></br>'+rows[e].boxip+'<div style="background-color: rgba(211,211,211, 0.7);" class="tblock"><div style="background-color: rgba(128, 255, 128, 0.7);"  class="tblockInner">Root<p>'+rows[e].flag2points+' pts</p></div>Limited<p>'+rows[e].flag1points+' pts</p></div></div>'
                                            if (parseInt(rows.length - 1) === parseInt(e)) {
                                                //var svg = fs.readFileSync('./svg.html', 'utf-8');
                                                res.send('<h1>Targets</h1>' + tmp+  "<script>strober(5);</script><div style='position: relative; width: 100%; height: 1400px;'></div>");
                                            }
                                        }
                                    }
                                    
                                }
                            } else {
                                res.send("<h1>Targets</h1><div style='position: relative; width: 100%; height: 1400px;'></div>");
                            }
                        }); 
                    });
                } else {
                    res.send('Error');
                }
            } catch (err) {
                console.log(err);
            }
        };

        //This removes excess blank objects from the array
        Array.prototype.clean = function(deleteValue) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == deleteValue) {         
            this.splice(i, 1);
            i--;
            }
        }
        return this;
        };

        function newsUpdater(req, res, type, flagmsg){
            try {
                mysql_query('SELECT news FROM server', function(rows){
                    if (type === 'admin') {
                        adminChecker(req.cookies.SCORE, function(truefalse){
                            if (truefalse) {
                                mysql_commit('UPDATE server SET news = '+mysql.escape( '<strong>ADMIN:&nbsp</strong>'+req.body.updatenews+'||||||||' + rows[0].news ) );
                                res.send('Your message has been added!');
                            } else {
                                res.send('Denied');
                            }
                        });
                    } else {
                        mysql_commit('UPDATE server SET news = '+mysql.escape( flagmsg+'||||||||' + rows[0].news ) );
                    }
                });
            } catch (err) {
                console.log(err);
            }
        };

        //<li class="list-group-item">Etiam imperdiet volutpat libero eu tristique.</li>
        function newsHtmler (req, res){
            mysql_query('SELECT news FROM server', function(rows){
                try {
                    var newsArray = rows[0].news.split('||||||||').clean("");
                    var html = '';
                    if (newsArray.length > 20) newsArray = newsArray.slice(0, 20);
                    for (var e = 0; e < 20; e++) {
                        if ( newsArray[e]) html += '<li class="list-group-item">' + newsArray[e] + '</li>';
                        if (e === 19) {
                            res.send(html);
                        }
                    }
                } catch (err) {
                    console.log(err);
                    res.send('<div style="width: 100%; height: 1400px; background-color: white;"> err</div>');
                }
            });
        };

//===================Beginning of Authenticated API calls===================//
        function authenticatedAPIcalls(req, res) {
            try {
                //Change user password
                if (req.body.changepass) {
                    if (req.body.password.length > 7  && req.body.password.match(/^(?:\w|\S)+$/g) !== null) {
                        var name = req.cookies.SCORE.split('.')[0];
                        mysql_query('SELECT * FROM users WHERE name = ' + mysql.escape(name)+ ' AND hash = ' + mysql.escape(md5(req.body.oldpass)), function(rows){
                            if (rows[0]) {
                                if (req.body.imgcolor === 'undefined' || req.body.imgcolor === "" || req.body.imgcolor == null) {
                                    mysql_commit("UPDATE users SET hash = " + mysql.escape(md5(req.body.password)) + " WHERE name = " + mysql.escape(name));
                                    res.send('True');
                                } else {
                                    mysql_commit("UPDATE users SET hash = " + mysql.escape(md5(req.body.password)) + ", avatarurl = "+mysql.escape(req.body.imgurl)+", avatarcolor = "+mysql.escape(req.body.imgcolor)+" WHERE name = " + mysql.escape(name));
                                    res.send("True");
                                }
                            } else {
                                res.send('The old password was incorrect!')
                            }
                        });
                    } else {
                        res.send("The password must be at least 8 characters in length and not contain spaces.");
                    }
                //} else if (req.body.) {
                    //Checks registration status
                } else if (req.body.registerstatus) {
                    adminChecker(req.cookies.SCORE, function(truefalse){
                        if (truefalse) {
                            mysql_query("SELECT registration FROM server", function(rows){
                                if (rows[0].registration === 'true') {
                                    res.send("On");
                                } else {
                                    res.send('Off')
                                }
                            });
                        } else {
                            res.send('Denied');
                        }
                    });
                    //toggles the registration status on/off
                } else if (req.body.toggleregistration) {
                    adminChecker(req.cookies.SCORE, function(truefalse){
                        if (truefalse) {
                            mysql_query("SELECT registration FROM server", function(rows){
                                if (rows[0].registration === 'true') {
                                    mysql_commit("UPDATE server SET registration = 'false'");
                                    res.send("Off");
                                } else {
                                    mysql_commit("UPDATE server SET registration = 'true'");
                                    res.send("On");
                                }
                            });
                        } else {
                            res.send('Denied');
                        }
                    });
                } else if (req.body.usergallery) {
                    adminChecker(req.cookies.SCORE, function(truefalse){
                        if (truefalse) {
                            mysql_query("SELECT name,avatarurl,avatarcolor FROM users", function(rows){
                                try{
                                    if (rows.length !== 1) {
                                        var tmp = "";
                                        for (var e in rows) {
                                            if (rows[e].name == 'admin') {
                                                //skip this user
                                            } else {
                                                tmp += '<div class="galleryImages" style="background-color: '+rows[e].avatarcolor+'; border: 1px solid;"><image class="avatars" height="80px" width="80px" src="'+rows[e].avatarurl+'" onclick=\'deluser("'+rows[e].name+'");\'></image><p>'+rows[e].name+'</p></div>'
                                                if (parseInt(rows.length - 1) === parseInt(e)) {
                                                    res.send(tmp);
                                                }
                                            }
                                        }
                                    } else {
                                       res.send("<p>Only User is Admin.</p>");
                                    }
                                } catch (err) {
                                    res.send("<pre>"+err.message+"</pre>");
                                }
                            });
                        } else {
                            res.send('Denied');
                        }
                    });
                } else if (req.body.deleteuser && req.body.deleteuser !== 'admin') {
                    adminChecker(req.cookies.SCORE, function(truefalse){
                        if (truefalse) {
                            mysql_commit("DELETE FROM users WHERE name = " + mysql.escape(req.body.deleteuser));
                            res.send('The user has been deleted!');
                        } else {
                            res.send('Denied');
                        }
                    });
                } else if (req.body.deletebox) {
                    adminChecker(req.cookies.SCORE, function(truefalse){
                        if (truefalse) {
                            mysql_commit("DELETE FROM boxes WHERE name = " + mysql.escape(req.body.deletebox));
                            cleanUsersFlagsNtrivia(req.body.deletebox, "del", 'this is not needed for delete');
                            res.send('The target has been deleted!');
                        } else {
                            res.send('Denied');
                        }
                    });
                } else if (req.body.targetcreate && req.body.targetname && req.body.targetip) {
                    if (req.body.targetname.match(/^(?:\w|\_)+$/g) !== null) {
                        adminChecker(req.cookies.SCORE, function(truefalse){
                            if (truefalse) {
                                targetAdder(req, res);
                            } else {
                                res.send('Denied');
                            }
                        });
                    } else {
                        res.send('Target name can only be alpha/numeric/_');
                    }
                //This next line prints the targets info based on admin/regular usage
                } else if (req.body.targetgallery) {
                    if (req.body.targetgallery === "small") {
                        adminChecker(req.cookies.SCORE, function(truefalse){
                            if (truefalse) {
                                targetGalleryHtml(req, res, 'small');
                            } else {
                                res.send('Denied');
                            }
                        });
                    } else {
                        targetGalleryHtml(req, res, 'big');
                    }
                } else if (req.body.mainboard) {
                    mainBoardBuilder(req, res);
                } else if (req.body.sideboard) {
                    sideBoardBuilder(req, res);
                } else if (req.body.flagsubmit) {
                    flagSubmitter(req, res);
                } else if (req.body.questionsubmit) {
                    questionSubmitter(req, res);
                } else if (req.body.flagsNtriviaRequest) {
                    userFlagsNtriviaPull(req, res);
                } else if (req.body.scoredata) {
                    scoreboardDataGrabber(req, res);
                } else if (req.body.updatenews){
                    newsUpdater(req, res, 'admin', 'NA');
                } else if (req.body.updatethenews) {
                    newsHtmler(req,res);
                } else {
                    res.send('NA');
                }
            } catch (err) {
                console.log(err);
                res.send('Error');
            }
        };

        //By default this will log to mysql database. However, you can turn of logging for specific routes by simply passing in false/true when this is called
        function routeLogger(req, logging){
            try {
                var date = new Date();
                var ipaddr = req.connection.remoteAddress;
                var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                var line = (date + '').replace(/\(.+?\)/g,'') + ipaddr + ' ' + fullUrl.replace(/https?\:\/\/.+?\//g, '') + " " + JSON.stringify(req.body);
                console.log(line);   //this is goood
                if (logging) {
                    mysql_commit('UPDATE server SET logdata = CONCAT(logdata, '+mysql.escape(line+'\n')+')');
                }
                return;
            } catch (err) {
                console.log(err);
            }
        }

//============================START OF ROUTES=====================================//


        //This route returns the login page if the cookie does not exist
        app.get(["/"],function(req,res){
            try {
                routeLogger(req, logging);
                if (req.cookies.SCORE === 'False' && req.cookies.SCORE) {           //If no cookie set, send login page
                    loginPage(res);
                } else if (req.cookies.SCORE) {
                    cookieChecker(req.cookies.SCORE, function(trueFalse) {          //Check the cookie. If its in the db, redirect to home html
                        if (trueFalse) {
                            res.sendFile('html/home.html', {root: __dirname });
                        } else {
                            loginPage(res);
                        }
                    });   
                } else {
                    loginPage(res);
                }
            } catch (err) {
                console.log(err);
                loginPage(res);
            }
        });

        app.get(["/node_ctf.logdata"],function(req,res){
            try {
                routeLogger(req, logging);
                if (req.cookies.SCORE === 'False' && req.cookies.SCORE) {           //If no cookie set, send login page
                    loginPage(res);
                } else if (req.cookies.SCORE) {
                    cookieChecker(req.cookies.SCORE, function(trueFalse) {          //Check the cookie. If its in the db, redirect to home html
                        if (trueFalse) {
                            adminChecker(req.cookies.SCORE, function (trueFalse) {
                                if (trueFalse) {
                                    mysql_query('SELECT logdata FROM server', function (rows){
                                        res.set('Content-Type', 'application/octet-stream').send(rows[0].logdata);
                                    });
                                } else {
                                    res.send('Denied');
                                }
                            });
                        } else {
                            loginPage(res);
                        }
                    });   
                } else {
                    loginPage(res);
                }
            } catch (err) {
                console.log(err);
                loginPage(res);
            }
        });

        //This is used for api calls in post form
        app.post(["/api.js"],function(req,res){
             try {
                routeLogger(req, logging);
                //Any api calls that do not require auth (like logging in and registration)
                if (req.body.gallery) {
                    galleryHtml(function(data) {
                        res.send(data);
                    });
                } else if (req.body.teamCreate) {                               //registration page team creation
                    teamCreater(req, res);
                } else if (req.body.username && req.body.password) {            //User login
                    var hash = md5(req.body.password);
                    mysql_query('SELECT name, hash FROM users WHERE name = '+ mysql.escape(req.body.username)+ ' AND hash = ' + mysql.escape(hash), function(rows) {
                        if (rows[0]) {
                            cookieMaker(req.body.username, function(cookie) {
                                res.cookie("SCORE", cookie).send("True");
                            }); 
                        } else {
                            res.send('False');
                        }
                    });
                } else if (req.cookies.SCORE !== "False" && req.cookies.SCORE) {           //For api calls that require cookies
                    cookieChecker(req.cookies.SCORE, function(trueFalse) {
                        if (trueFalse) {
                            //=============This calls all authenticated API calls===============//
                            authenticatedAPIcalls(req, res);
                        } else {
                            res.cookie("SCORE" , 'False').send('False');
                        } 
                    });
                } else { 
                    res.send('False');
                }
             } catch (err) {
                 console.log(err);
                 res.send("False");
             }
        });

        //This function serves up static files
        app.get(["/static.js"],function(req,res){
            routeLogger(req, logging);
            try {
                if (req.query.file){                //If its a html file, check in html folder
                    if (path.extname(req.query.file) === ".html") {
                        fs.access('./html/' + req.query.file, fs.F_OK, function(err) {
                            if (!err) {
                                if (req.query.file === 'home.html' || req.query.file === 'account.html' || req.query.file === 'admin.html' || req.query.file === 'scoreboard.html' || req.query.file === 'targets.html') {
                                    cookieChecker(req.cookies.SCORE, function(trueFalse) {
                                        if (trueFalse) {
                                            if (req.query.file === "admin.html") {
                                                adminChecker(req.cookies.SCORE, function(truefalse){
                                                    if (truefalse) {
                                                        var tmp = req.query.file.replace(/[^a-zA-Z0-9\.\_\-\/]/g, "");
                                                        var tmp = tmp.replace(/\.\./g, "");
                                                        res.sendFile('html/' + tmp, {root: __dirname });
                                                    } else {
                                                        res.send('<script>window.location.href="/"</script>');
                                                    }
                                                });
                                            } else {
                                                var tmp = req.query.file.replace(/[^a-zA-Z0-9\.\_\-\/]/g, "");
                                                var tmp = tmp.replace(/\.\./g, "");
                                                res.sendFile('html/' + tmp, {root: __dirname });
                                            }
                                        } else {
                                            res.cookie("SCORE" , 'False').send('<script>window.location.href="/"</script>');
                                        } 
                                    });
                                } else if (req.query.file === "register.html") {
                                    mysql_query("SELECT registration FROM server", function(rows){
                                        if (rows[0].registration === 'true') {
                                            var tmp = req.query.file.replace(/[^a-zA-Z0-9\.\_\-\/]/g, "");
                                            var tmp = tmp.replace(/\.\./g, "");
                                            res.sendFile('html/' + tmp, {root: __dirname });
                                        } else {
                                            res.sendFile('html/closed.html', {root: __dirname });
                                        }
                                    });      
                                } else {
                                    var tmp = req.query.file.replace(/[^a-zA-Z0-9\.\_\-\/]/g, "");
                                    var tmp = tmp.replace(/\.\./g, "");
                                    res.sendFile('html/' + tmp, {root: __dirname });
                                }
                            } else {
                                res.send('404');
                            }
                        });
                    } else {                        //if not html, then serve it up from the public folder
                        fs.access('./pub/' + req.query.file, fs.F_OK, function(err) {
                            if (!err) {
                                var tmp = req.query.file.replace(/[^a-zA-Z0-9\.\_\-\/]/g, "");
                                var tmp = tmp.replace(/\.\./g, "");
                                res.sendFile('pub/' + tmp, {root: __dirname });
                            } else {
                                res.send('404');
                            }
                        });
                    }
                } else {
                    res.send('404');
                }
            } catch (err) {
                console.log(err);
                res.send('False');
            }
        });

        //All urls not caught by a listener get redirected to index
        app.get('*', function(req, res) {
            try {
                routeLogger(req, logging);
                res.send("<script>location.href = '/';</script>");
            } catch (err) {
                console.log(err);
                res.send("<script>location.href = '/';</script>");
            }
        });


        //Starts the listener
        console.log('[+] Worker Listening');
        if (SSL) {
            httpsServer.listen(httpsport)
        } else {
            httpServer.listen(httpport);
        }
        
    } catch (err) {
        console.log(err)
    }
}

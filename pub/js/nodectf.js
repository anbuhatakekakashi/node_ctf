//Licensed Under: GNU GENERAL PUBLIC LICENSE / https://www.gnu.org/licenses/gpl-3.0.en.html
//Part of the NODE_CTF framework
function scoreboardGrabber(){
    $.post("api.js", {scoredata: "scoredata"}, function(result) {
        $("#scoreboard").html((result));
    });
};

function targetsGrabber(){
    $.post("api.js", {targetgallery: "big"}, function(result) {
        $("#targetsboard").html(result);
    });
};

function boardChanger(type) {
    if (type ==="scoreboard") {
    $("#mainboard").css('display', 'none');
    $("#targetsboard").css('display', 'none');
    $("#scoreboard").css('display', 'block');
    window.scrollTo(0, 0);
    } else if (type === "targets") {
    $("#mainboard").css('display', 'none');
    $("#targetsboard").css('display', 'block');
    $("#scoreboard").css('display', 'none');
    window.scrollTo(0, 0);
    } else if (type === "home") {
    $("#mainboard").css('display', 'block');
    $("#targetsboard").css('display', 'none');
    $("#scoreboard").css('display', 'none');
    window.scrollTo(0, 0);
    }
};

//box/trivia api section

$.post("api.js", {mainboard: "mainboard"}, function(result) {
    $("#mainboard").html(atob(result)); //Pulls the main board down as base64 and then decodes and pasts at html
    //$("#mainboard").html(result);
});

$.post("api.js", {sideboard: "sideboard"}, function(result) {
    $("#sidebar-nav").html(result); //Pulls the main board down as base64 and then decodes and pasts at html
    //$("#mainboard").html(result);
});

function panelizer(thetype) {
    if (thetype === "admin") {
    $('.overlay').html('<iframe src="static.js?file=admin.html"></iframe>').show();
    } else {
    $('.overlay').html('<iframe src="static.js?file=account.html"></iframe>').show();
    }
};

function closer() {
    $('.overlay').html('').hide();
};

$(".overlay").click(function () {
    $('.overlay').html('').hide();
});

$(document).keyup(function(e) {
    if (e.keyCode == 27) {
        $('.overlay').html('').hide();
    }
});

$.post("api.js", {gallery: "gallery"}, function(result) {
    $("#inner2").html(result);
});

function imageSEL(src) {
    var items = Array('cde7b0','a3bfa8','b4656f','f4a259','7286a0','6a8e7f','989572','f4a259','3cbbb1','617073','7a93ac','50723c','568ea3','f18805','568ea3','d95d39','79a9d1','afa2ff','7a89c2','50723c','ffadc6','623cea','e9f1f7','cb8589','dde8b9','a3a3a3','84a9c0','542e71','6a66a3','cde7b0','a3bfa8','b4656f','f4a259','7286a0','6a8e7f','989572','f4a259','3cbbb1','617073','7a93ac','50723c','568ea3','f18805','568ea3','d95d39','79a9d1','afa2ff','7a89c2','50723c','ffadc6','623cea','e9f1f7','cb8589','dde8b9','a3a3a3','84a9c0','542e71','6a66a3','cde7b0','a3bfa8','b4656f','f4a259','7286a0','6a8e7f','989572','f4a259','3cbbb1','617073','7a93ac','50723c','568ea3','f18805','568ea3','d95d39','79a9d1','afa2ff','7a89c2','50723c','ffadc6','623cea','e9f1f7','cb8589','dde8b9','a3a3a3','84a9c0','542e71','6a66a3');
    var item = items[Math.floor(Math.random()*items.length)];
    $('#imageSelect').css("background-color",'#'+item)
    $('#imageSelect').html('<image style="" height="170px" width="170px" src="'+src+'"></image>');
    $('#imageSelectHidden').val(src);
    $('#imageSelectHiddenColor').val('#'+ item);
};

$('.anav').click(function(e) {
    var $this = $(this);
    $(".anav").removeClass('active');
    if (!$this.hasClass('active')) {
    $this.addClass('active');
    }
    e.preventDefault();
});

function logout(){
    document.cookie = "SCORE=False; path=/";
    window.location.href = '/';
};


function screenUpdater(user){
    $("#topnav").html(user + " &#8595;");
    if (user === 'admin'){
    $("#dropdown").html('<li><a onclick="panelizer(\'nada\');" id="accountPanel" href="#">Account</a></li><li><a onclick="panelizer(\'admin\');" id="adminPanel" href="#">Admin</a></li><li><a onclick="logout();" href="#">Logout</a></li>');
    } else {
    $("#dropdown").html('<li><a onclick="panelizer(\'nada\');" id="accountPanel" href="#">Account</a></li><li><a onclick="logout();" href="#">Logout</a></li>');
    }
};

function mover(theid) {
    $('html,body').animate({
        scrollTop: $("#" + theid).offset().top},
        'slow');
};
//this is used to set the users account on screen but also pull appropriate user info
var user = document.cookie.split('.')[0];
user = user.split('=')[1];
screenUpdater(user);

function exploder(theid) {
    $.when($( "#" + theid ).toggle( "explode" )).done(function(){
    $( "#" + theid ).toggle( "explode" );
    });
};
$('#newsStore').val('true');
$('#newsticker').css('width', '600px');
$('#newsticker').trigger( "click" );
$('#newsticker').click(function() {
    //panelizer('news');
    if ($('#newsStore').val() === 'true'){
    $('#newsStore').val('false');
    $('#newsticker').css('width', '2%');
    $('#newsticker').css('height', '4%');
    $('#newsHeader').css('display', 'none');
    } else {
    $('#newsStore').val('true');
    $('#newsticker').css('width', '600px');
    $('#newsticker').css('height', '160px');
    $('#newsHeader').css('display', 'block');
    }
});

function strober(thecount) {
    if (thecount === 0) {
    return;
    } else {
    $.when($( '.tblock').fadeTo( 1000, 0.5 )).done(function(){
        thecount -= 1;
        $.when($( '.tblock' ).fadeTo( 1000, 0.8 )).done(function(){
        strober(thecount);
        });
    });
    }
};

var digit,
    maxDigits = 250,
    randomize = function() {
        return Math.floor(Math.random() + 0.5);
    },
    codeArea = document.getElementById("code"),
    generate = function(e) {
        // replace old result with one digit
        codeArea.innerHTML = randomize();
        var tmp = ''
            // then generate the rest of the digits
        for (var i = 1; i < maxDigits; ++i) {
            digit = randomize();
            tmp += digit;
        }
        codeArea.innerHTML += tmp.repeat(350)
    };

    $('.newsticker').newsTicker({
        row_height: 40,
        max_rows: 4,
        speed: 600,
        direction: 'up',
        duration: 3000,
        autostart: 1,
        pauseOnHover: 1,
        prevButton:  $('#newsdown'),
        nextButton:  $('#newsup'),
    });
    function newsgrabber(){
    $.post("api.js", {updatethenews: "updatethenews"}, function(result) {
        $("#newsticker").text('');
        $("#newsticker").html(result);
    });
    };
    
    generate();
    scoreboardGrabber();
    targetsGrabber();
    newsgrabber();
    setInterval(generate, 1000);
    setInterval(newsgrabber, 60000);
    setInterval(scoreboardGrabber, 30000);
    setInterval(targetsGrabber, 10000);


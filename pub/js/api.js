
function flag1submitter(element, boolvar) {
    if (boolvar) {
        var name = element.split('-')[0];
        var theflag = $("#" + name + '-flag1').val();
        $.post("api.js", {flagsubmit: name, flag1: theflag}, function(result) {
            if (result === "False") {
                $( "#"+name + '-flag1' ).val( "" );
                $( "#"+name + '-flag1' ).effect( "shake" );
            } else if (result === "True") {
                $("#"+ name + '-flag1container').fadeOut( 400, function() {
                $("#"+ name + '-flag1container').html("<h3 style='color: white; display: inline;'>Limited: </h3><image style='display: inline;' width='40px' height='40px' src='static.js?file=check.png'></image>");
                $("#"+ name + '-flag1container').fadeIn( 400, function() {});
                });
            } else {
                $( "#"+name + '-flag1' ).val( "" );
                $( "#"+name + '-flag1' ).effect( "shake" );
            }
        });
    } else {
        $("#"+ element + '-flag1container').html("<h3 style='color: white; display: inline;'>Limited: </h3><image style='display: inline;' width='40px' height='40px' src='static.js?file=check.png'></image>");
    }
};

function flag2submitter(element, boolvar) {
    if (boolvar) {
        var name = element.split('-')[0];
        var theflag = $("#" + name + '-flag2').val();
        $.post("api.js", {flagsubmit: name, flag2: theflag}, function(result) {
            if (result === "False") {
                $( "#"+ name +'-flag2' ).val( "" );
                $( "#"+ name +'-flag2' ).effect( "shake" );
            } else if (result === "True") {
                $("#"+ name + '-flag2container').fadeOut( 400, function() {
                    $("#"+ name + '-flag2container').html("<h3 style='color: white; display: inline;'>Root: </h3><image style='display: inline;' width='40px' height='40px' src='static.js?file=check.png'></image>");
                    $("#"+ name + '-flag2container').fadeIn( 400, function() {});
                });
            } else {
                $( "#"+name + '-flag2' ).val( "" );
                $( "#"+name + '-flag2' ).effect( "shake" );
            }
        });
    } else {
        $("#"+ element + '-flag2container').html("<h3 style='color: white; display: inline;'>Root: </h3><image style='display: inline;' width='40px' height='40px' src='static.js?file=check.png'></image>");
    }
};

function question1submitter(element, boolvar) {
    if (boolvar) {
        var name = element.split('-')[0];
        var theansw = $("#" + name + '-quest1input').val();
        $.post("api.js", {questionsubmit: name, question1: theansw}, function(result) {
            if (result === "False" || result === "NA") {
                $( "#"+ name +'-quest1input' ).val( "" );
                $( "#"+ name +'-quest1input' ).effect( "shake" );    
            } else {
                $("#"+ name + '-hint1').fadeOut( "fast", function() {});
                $("#"+ name + '-quest1submit').fadeOut( 400, function() {});
                $("#"+ name + '-preid1').fadeOut( 400, function() {});
                $("#"+ name + '-quest1input').fadeOut( 400, function() {});
                setTimeout(function() {
                    $("#"+ name + '-quest1submit').css("display","none");
                    $("#"+ name + '-preid1').css("display","none");
                    $("#"+ name + '-quest1input').css("display","none");
                    $("#"+ name + '-A br').remove();
                }, 400);
                $("#"+ name + '-hint1').text(result);
                $("#"+ name + '-hint1').fadeIn( 400, function() {});
            }
        });
    } else {
        $("#"+ element[0] + '-quest1submit').css("display","none");
        $("#"+ element[0] + '-preid1').css("display","none");
        $("#"+ element[0] + '-quest1input').css("display","none");
        $("#"+ element[0] + '-A br').remove();
        $("#"+ element[0] + '-hint1').text("Your hint is: "+element[1]);
    }
};

function question2submitter(element, boolvar) {
    if (boolvar) {
        var name = element.split('-')[0];
        if ($('#' + name + '-hint1').text()) {
            var theansw = $("#" + name + '-quest2input').val();
            $.post("api.js", {questionsubmit: name, question2: theansw}, function(result) {
                if (result === "False" || result === "NA") {
                    $( "#"+  name +'-quest2input' ).val( "" );
                    $( "#"+  name +'-quest2input' ).effect( "shake" ); 
                } else if (result === "Cheat") {
                    $( "#"+ name +'-quest2input' ).val( "" );
                    $( "#"+ name +'-quest2input' ).effect( "shake" );   
                    $("#"+ name + '-hint2').fadeOut( "fast", function() {});
                    $("#"+ name + '-hint2').text('Are you trying to cheat and skip ahead?');
                    $("#"+ name + '-hint2').fadeIn( 400, function() {
                        $("#"+ name + '-hint2').fadeOut( 4000, function() {
                            $("#"+ name + '-hint2').text('');
                        });  
                    });  
                } else {
                    $("#"+ name + '-hint2').fadeOut( "fast", function() {});
                    $("#"+ name + '-quest2submit').fadeOut( 400, function() {});
                    $("#"+ name + '-preid2').fadeOut( 400, function() {});
                    $("#"+ name + '-quest2input').fadeOut( 400, function() {});
                    setTimeout(function() {
                        $("#"+ name + '-quest2submit').css("display","none");
                        $("#"+ name + '-preid2').css("display","none");
                        $("#"+ name + '-quest2input').css("display","none");
                        $("#"+ name + '-B br').remove();
                    }, 400);
                    $("#"+ name + '-hint2').text(result);
                    $("#"+ name + '-hint2').fadeIn( 400, function() {});
                }
            });
        } else {
            $( "#"+  name +'-quest2input' ).val( "" );
            $( "#"+  name +'-quest2input' ).effect( "shake" );
            $("#" + name + '-hint2').text('You must first answer question 1!');
            $("#" + name + '-hint2').delay(3000).queue(function(n) {$("#" + name + '-hint2').text(''); n();});
        }
    } else {
        $("#"+ element[0] + '-quest2submit').css("display","none");
        $("#"+ element[0] + '-preid2').css("display","none");
        $("#"+ element[0] + '-quest2input').css("display","none");
        $("#"+ element[0] + '-B br').remove();
        $("#"+ element[0] + '-hint2').text("Your hint is: "+element[1]);
    }
};
function question3Submitter(element, boolvar) {
    if (boolvar) {
        var name = element.split('-')[0];
        if ($('#' + name + '-hint1').text() && $('#' + name + '-hint2').text()) {
            var theansw = $("#" + name + '-quest3input').val();
            $.post("api.js", {questionsubmit: name, question3: theansw}, function(result) {
                if (result === "False" || result === "NA") {
                    $( "#"+ name + '-quest3input' ).val( "" );
                    $( "#"+ name + '-quest3input' ).effect( "shake" );
                } else if (result === "Cheat") {
                    $( "#"+ name +'-quest3input' ).val( "" );
                    $( "#"+ name +'-quest3input' ).effect( "shake" );   
                    $("#"+ name + '-hint3').fadeOut( "fast", function() {});
                    $("#"+ name + '-hint3').text('Are you trying to cheat and skip ahead?');
                    $("#"+ name + '-hint3').fadeIn( 400, function() {
                        $("#"+ name + '-hint3').fadeOut( 4000, function() {
                            $("#"+ name + '-hint3').text('');
                        });  
                    });  
                } else {
                    $("#"+ name + '-hint3').fadeOut( "fast", function() {});
                    $("#"+ name + '-quest3submit').fadeOut( 400, function() {});
                    $("#"+ name + '-preid3').fadeOut( 400, function() {});
                    $("#"+ name + '-quest3input').fadeOut( 400, function() {});
                    setTimeout(function() {
                        $("#"+ name + '-quest3submit').css("display","none");
                        $("#"+ name + '-preid3').css("display","none");
                        $("#"+ name + '-quest3input').css("display","none");
                        $("#"+ name + '-C br').remove();
                    }, 400);
                    $("#"+ name + '-hint3').text(result);
                    $("#"+ name + '-hint3').fadeIn( 400, function() {});
                }
            });
        } else {
            $( "#"+  name +'-quest3input' ).val( "" );
            $( "#"+  name +'-quest3input' ).effect( "shake" );
            $("#" + name + '-hint3').text('You must first answer questions 1 and 2!');
            $("#" + name + '-hint3').delay(3000).queue(function(n) {$("#" + name + '-hint3').text(''); n();});
        }
    } else {
        $("#"+ element[0] + '-quest3submit').css("display","none");
        $("#"+ element[0] + '-preid3').css("display","none");
        $("#"+ element[0] + '-quest3input').css("display","none");
        $("#"+ element[0] + '-C br').remove();
        $("#"+ element[0] + '-hint3').text("Your hint is: "+element[1]);
    }
};

$('.limitedflagsubmit').click(function (){
    flag1submitter(this.id, true);
});
$('.rootflagsubmit').click(function() {
    flag2submitter(this.id, true);
});
$('.question1submit').click(function() {
    question1submitter(this.id, true);
});
$('.question2submit').click(function() {
    question2submitter(this.id, true);
});
$('.question3submit').click(function() {
    question3Submitter(this.id, true);
});

$.post("api.js", {flagsNtriviaRequest: "flagsNtriviaRequest"}, function(result) {
    var finalResults = JSON.parse(atob(result));
    var theflags = JSON.parse(finalResults.flags);
    var thetrivia = JSON.parse(finalResults.trivia);
    var theanswers = finalResults.answers;
    if (finalResults.False === "False") {
        //Do nothing cause there are no boxes
    } else {
        $.each(theflags, function (i, field) {
            if (field.flag1 === "True") {
                flag1submitter(i, false);
            }
            if (field.flag2 === "True") {
                flag2submitter(i, false);
            }
        });
        $.each(thetrivia, function (j, field2) {
            if (field2.question1 === "True") {
                question1submitter(new Array(j,theanswers[j].answ1), false);
            }
            if (field2.question2 === "True") {
                question2submitter(new Array(j,theanswers[j].answ2), false);
            }
            if (field2.question3 === "True") {
                question3Submitter(new Array(j,theanswers[j].answ3), false);
            }
        });
    }
});

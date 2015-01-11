//  put mutation observer on betstatus div

window.addEventListener('load', function(){
	alert("bruh");
	signIn();
	//setInterval(loop, 10000);
	loop();
}, false);

function signIn(){
	var signupBtn = document.getElementsByClassName("graybutton");
	if (signupBtn.length < 1){
		alert("logged in");
	} else {
		console.log("BRUUUUUh");
		$.ajax({
		    url: "http://www.saltybet.com/authenticate?signin=1",
		    type: "POST",
		    dataType: "html",
            data: {
                "email": "drmelonhead@gmail.com",
                "pword": "lollbob12",
                "authenticate": "signin"
            },
            contentType: "application/x-www-form-urlencoded",
            success: function(text) {
            	alert("BRUUUUUh " + text);
            	location.reload();

            },
            error: function() {
            	alert("nah");
            }

		});

	}
}

function loop(){
	MutationObserver = window.WebKitMutationObserver;
	var observer = new MutationObserver(function(mutations, observer) {
		console.log(mutations, observer);
		console.log('MUTATION BRUH');
		//  something was changed, update.
		update();
	});

	var target = document.getElementById("betstatus");
	observer.observe(target, {characterData: true, attributes: true});
}

function update(){
    $.ajax({
        type: "get",
        url: "../state.json",
        contentType: "application/json; charset=utf-8",
        data: "",
        dataType: "json",
        cache: "false",
        timeout: 30000,
	    success: function(data) {
	    	//  BETS ARE OPEN
	    	if (data.status !== "locked"){
	    		var wager = document.getElementById("wager");
				wager.value = "1";

				var btn = document.getElementById("player1");

				btn.click();
				if (data.status == 1){
					//  player 1 wins
					recordMatch(data.p1Name, data.p2Name);
				} else if (data.status == 2){
					recordMatch(data.p2Name, data.p1Name);
				}
	    	} else {
	    		console.log(data.status);
	    	}

	    },
	    error: function() {
	    	alert("error in update");
	    }

	});
}

function recordMatch(winner, loser){
	//  send match data to server
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://127.0.0.1:5000", true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function() { 
		console.log("request finished");
	    console.log(xhr);
	}
	xhr.send("winner=" + winner + "&loser=" + loser);
}
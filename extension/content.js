//  put mutation observer on betstatus div
var lastMatch = "";

window.addEventListener('load', function(){
	alert("bruh");
	if(signIn()){
		loop();
	}
}, false);

function signIn(){
	var signupBtn = document.getElementsByClassName("graybutton");
	if (signupBtn.length < 1){
		alert("logged in");
		return true;
	} else {
		var email = prompt("SaltyBet email (if you don't trust me login to saltybet yourself and refresh the page)", "");
		var password = prompt("SaltyBet password", "")
		$.ajax({
		    url: "http://www.saltybet.com/authenticate?signin=1",
		    type: "POST",
		    dataType: "html",
            data: {
                "email": email,
                "pword": password,
                "authenticate": "signin"
            },
            contentType: "application/x-www-form-urlencoded",
            success: function(text) {
            	console.log(text);
            	if (text.indexOf("Invalid Email") > -1){
            		alert("Invalid username or password.")
            		return false;
            	}
            	location.reload();
            	return true;
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
	    	if (data.status == 1){
	    		//  player 1 wins
	    		recordMatch(data.p1name, data.p2name);
	    	} else if (data.status == 2){
	    		recordMatch(data.p2name, data.p1name);
	    	}
	    	else if (data.status !== "locked"){
	    		var wager = document.getElementById("wager");
				wager.value = getWager(data.p1name, data.p2name);

				var btn = document.getElementById("player1");

				btn.click();
				
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
	var match = winner + loser;
	if (match === lastMatch){
		return;
	} else {
		lastMatch = match;
	}
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://127.0.0.1:5000/entry", true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function() { 
		console.log("request finished");
	    console.log(xhr);
	    lastMatch = match;
	}
	xhr.send("winner=" + winner + "&loser=" + loser);
}

function getWager(p1, p2){
	var balance = document.getElementById("balance").textContent.replace(",", "");
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://127.0.0.1:5000/?p1=" + p1 + "&p2=" + p2 + "&balance=" + balance, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function() { 
		console.log("wager request finished");
	    console.log(xhr);
	}
	xhr.send();
}
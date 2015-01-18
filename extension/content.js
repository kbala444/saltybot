//  put mutation observer on betstatus div
var lastMatch = "";
var lastStatus = 100;
var lastPlayer = "";
var lastWager = 0;

window.addEventListener('load', function(){
	if(signIn()){
		start();
	}
}, false);

//  Sign in to SaltyBet, returns true if we are signed in successfully.
function signIn(){
	var signupBtn = document.getElementsByClassName("graybutton");
	if (signupBtn.length < 1){
		chrome.extension.sendMessage({msg: "SaltyBot is active."});
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
            		chrome.extension.sendMessage({msg: "Invalid login info."});
            		return false;
            	}
            	chrome.extension.sendMessage({msg: "Logged in!"});
            	location.reload();
            	return true;
            },
            error: function() {
            	alert("nah");
            }

		});

	}
}

//  Checks for updates to the fightcard element on the DOM.
//  This is updated at the end of every match.
function start(){
	MutationObserver = window.WebKitMutationObserver;
	var observer = new MutationObserver(function(mutations, observer) {
		//  Something was changed, update.
		for (var i = 0; i < mutations.length; i++){
			console.log('mutation ' + i);
		}
		update();
	});

	var target = document.getElementById("betstatus");
	observer.observe(target, {characterData: true, attributes: true});
}

//  
function update(){
	//  Send ajax request to get current SaltyBet state (stored in state.json).
    $.ajax({
        type: "get",
        url: "../state.json",
        contentType: "application/json; charset=utf-8",
        data: "",
        dataType: "json",
        cache: "false",
        timeout: 50000,
	    success: function(data) {
	    	//  If nothing has changed, don't do anything.
	    	if (data.status == lastStatus){
	    		return;
	    	} else {
	    		lastStatus = data.status;
	    	}

	    	if (data.status == 1){	//  player 1 has won
	    		//  Calculate expected payout
	    		p1total = parseInt(data.p1total.replace(/,/g, ""));
	    		p2total = parseInt(data.p2total.replace(/,/g, ""));
	    		var payout = Math.ceil((lastWager / p1total) * p2total);

	    		//  Checks if we were right or wrong.
	    		if (lastPlayer === "player1"){
    				recordPayout(true, payout);
	    		} else if (lastPlayer === "player2"){
    				recordPayout(false, lastWager);
	    		}

	    		recordMatch(data.p1name, data.p2name);
	    	} else if (data.status == 2){	//  player 2 has won
	    		p1total = parseInt(data.p1total.replace(/,/g, ""));
	    		p2total = parseInt(data.p2total.replace(/,/g, ""));
	    		var payout = Math.ceil((lastWager / p2total) * p1total);

				if (lastPlayer === "player2"){
    				recordPayout(true, payout);
	    		} else if (lastPlayer === "player1") {
    				recordPayout(false, lastWager);
	    		}

	    		recordMatch(data.p2name, data.p1name);
	    	}
	    	else if (data.status !== "locked"){
	    		//  Bets are open again.
	    		bet(data.p1name, data.p2name);				
	    	} 
	    },
	    error: function() {
	    	console.log("error in update");
	    }

	});
}

//  Send match data to server.
function recordMatch(winner, loser){
	//  If we're still on the same match, don't do anything.
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
		if (xhr.readyState == 4){
			console.log("Recorded match " + winner + "vs. " + loser + ".");
		}
	}
	xhr.send("winner=" + winner + "&loser=" + loser);
}

//  Get which player and what wager to bet from server and bet.
function bet(p1, p2){
	var balance = document.getElementById("balance").textContent.replace(",", "");
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://127.0.0.1:5000/?p1=" + p1 + "&p2=" + p2 + "&balance=" + balance, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4){
			var res = xhr.response.split(" ");
			console.log(res);
		    lastWager = res[1];
		    wager.value = lastWager;
		    lastPlayer = res[0];
		    console.log('lastPlayer ' + lastPlayer);

		    setTimeout(function(){
		    	var btn = document.getElementById(lastPlayer);
		    	btn.click();
		    }, 7000);
		}
	}

	xhr.send();
}

//  Send results of bet to server and notify user.
function recordPayout(won, payout){
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://127.0.0.1:5000/result", true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send("won=" + won + "&pay=" + payout);

	if (won){
		chrome.extension.sendMessage({msg: "You won $" + payout + "!"});
	} else {
		chrome.extension.sendMessage({msg: "You lost $" + payout + " :'(."});
	}
}
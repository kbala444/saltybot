//  put mutation observer on betstatus div
var lastMatch = "";
var lastStatus = 100;
var lastBet = "";

window.addEventListener('load', function(){
	if(signIn()){
		loop();
	}
}, false);

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
	    	if (data.status == lastStatus){
	    		return;
	    	} else {
	    		lastStatus = data.status;
	    	}

	    	if (data.status == 1){	//  player 1 wins
	    		//  logic from saltybet
	    		console.log(p1total);
	    		console.log(p2total);
	    		p1total = parseInt(data.p1total.replace(/,/g, ""));
	    		p2total = parseInt(data.p2total.replace(/,/g, ""));
	    		var payout = Math.ceil((lastBet / p1total) * p2total);
	    		console.log(payout);

	    		if (lastBet === "player1"){
    				recordPayout(true, payout);
	    		} else {
    				recordPayout(false, payout);
	    		}

	    		recordMatch(data.p1name, data.p2name);
	    	} else if (data.status == 2){
	    		p1total = parseInt(data.p1total.replace(/,/g, ""));
	    		p2total = parseInt(data.p2total.replace(/,/g, ""));
	    		var payout = Math.ceil((lastBet / p2total) * p1total);

				if (lastBet === "player2"){
    				recordPayout(true, payout);
	    		} else {
    				recordPayout(false, payout);
	    		}

	    		recordMatch(data.p2name, data.p1name);
	    	}
	    	else if (data.status !== "locked"){
	    		bet(data.p1name, data.p2name);				
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
		if (xhr.readyState == 4){
			console.log("request finished");
		    console.log(xhr);
		}
	}
	xhr.send("winner=" + winner + "&loser=" + loser);
}

function bet(p1, p2){
	var balance = document.getElementById("balance").textContent.replace(",", "");
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://127.0.0.1:5000/?p1=" + p1 + "&p2=" + p2 + "&balance=" + balance, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhr.onreadystatechange = function() { 
		if (xhr.readyState == 4){
			console.log("wager request finished");
			var res = xhr.response.split(" ");
			console.log(res);

		    wager.value = res[1];
		    lastBet = res[0];
		    var btn = document.getElementById(lastBet);
		    btn.click();
		}
	}

	xhr.send();
}

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
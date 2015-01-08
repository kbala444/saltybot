window.addEventListener('load', function(){
	alert("bruh");
	signIn();
	setInterval(loop, 10000);
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

		var wager = document.getElementById("wager");

		if (wager != null) {
			wager.value = "1";

			var btn = document.getElementById("player1");
			if (btn == null){
				console.log("HOODWINKED");
			}
			btn.click();
			console.log("clicked");
			observer.disconnect();
		}
	});

	var target = document.getElementById("fightcard");
	observer.observe(target, {attributes: true, subtree: true, childList: true});
}
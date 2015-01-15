# Salty Bot
A bot for [saltybet](http://www.saltybet.com/).

## Installation
With these simple steps, you too can win *thousands* of fake internet dollars.

1.  Drag the extension folder into your [extensions page](chrome://extensions).
2.  Run the python server with:
```
cd server
python server.py
```

Now navigate to [saltybet](http://www.saltybet.com/) and watch as you ascend to salt royalty (you're going to have to give the bot some time to collect data though). 

## Current Betting Strategy

SaltyBot currently assigns an elo rating to each player using [this](http://en.wikipedia.org/wiki/Elo_rating_system#Performance_rating) method and picks wagers based on elo difference.

If there is no collected data for either player, SaltyBot will just bet a $1 on player 1 in case an upset occurs.  

Hopefully I will update the betting strategy with something better.

## Am I Really Winning Money?

SaltyBot records its stats.  Check out `server/meta.json` or just navigate to [127.0.0.1:5000/stats](http://127.0.0.1:5000/stats) to see how your bot is doing.



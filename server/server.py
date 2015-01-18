# keep track of played matches so elo doesn't get fucked up
import simplejson as json
import pickle
from flask import Flask, request, g, render_template
import sqlite3

DEBUG = True
DATABASE = 'data.db'

app = Flask(__name__)
app.config.from_object(__name__)

# update db with results of match
@app.route("/entry", methods=['POST'])
def entry():
	winner = request.form['winner']
	loser = request.form['loser']
	
	record_match(winner, loser)

	return 'recorded'

# get wager + player we should bet on given the next two fighters + current balance
@app.route("/", methods=['GET'])
def bet():
	cur = get_db().cursor()
	p1 = request.args['p1']
	p2 = request.args['p2']
	balance = request.args['balance']

	p1_elo = cur.execute('SELECT elo FROM fighter WHERE name=?', (p1,)).fetchone()
	p2_elo = cur.execute('SELECT elo FROM fighter WHERE name=?', (p2,)).fetchone()

	# if no recorded data, just put in $1 in case of upset
	if p1_elo is None and p2_elo is None:
		return 'player1 1'
	else:
		return calc_bet(p1_elo, p2_elo, balance)

# record result of our bet
@app.route("/result", methods=['POST'])
def result():
	won = request.form['won']
	pay = int(request.form['pay'])

	f = open('meta.json', 'r')
	data = json.load(f)
	print won
	if won == 'true':
		data['correct'] += 1
		data['money_won'] += pay
	else:
		data['incorrect'] += 1
		data['money_lost'] += pay
	f.close()
	# update json file
	f = open('meta.json', 'w')
	f.write(json.dumps(data))
	f.close()

	return 'recorded'

# get overall bot results
@app.route("/stats", methods=['GET'])
def results():
	f = open('meta.json', 'r')
	data = json.load(f)

	cor = data['correct']
	incor = data['incorrect']
	winrate = str(float(cor)/(cor + incor) * 100) + '%'
	profit = data['money_won'] - data['money_lost']

	return render_template('stats.html', c=cor, ic=incor, wr=winrate, prof=profit)

# updates db with winner and loser
def record_match(winner, loser):
	db = get_db()
	cur = db.cursor()

	cur.execute('SELECT * FROM fighter WHERE name=?', (winner,))
	win_data = cur.fetchone()

	if not win_data:
		cur.execute('INSERT INTO fighter VALUES(?, ?, ?, ?, ?)', (winner, 1, 0, 1000, 1400))
	else:
		cur.execute('SELECT total_ratings FROM fighter WHERE name=?', (loser,))
		fetched = cur.fetchone()
		print fetched
		if fetched is None:
			loser_elo = 1000
		else:
			loser_elo = fetched[0]
		new_elo = update_elo(win_data)
		cur.execute('UPDATE fighter SET wins=wins+1, total_ratings=total_ratings+?, elo=? WHERE name=?', (loser_elo, new_elo, winner))

	cur.execute('SELECT * FROM fighter WHERE name=?', (loser,))
	lose_data = cur.fetchone()

	if lose_data is None:
		cur.execute('INSERT INTO fighter VALUES(?, ?, ?, ?, ?)', (loser, 0, 1, 1000, 600))
	else:
		winner_elo = cur.execute('SELECT total_ratings FROM fighter WHERE name=?', (winner,)).fetchone()[0]
		new_elo = update_elo(lose_data)
		cur.execute('UPDATE fighter SET losses=losses+1, total_ratings=total_ratings+?, elo=? WHERE name=?', (winner_elo, new_elo, loser))

	db.commit()

# calculate elo using algorithm of 400
def update_elo(fighter):
	wins = fighter[1]
	losses = fighter[2]
	opponent_ratings = fighter[3]
	# the algorithm of 400 formula
	return (opponent_ratings + 400 * (wins - losses))/(wins + losses)

def calc_bet(p1, p2, balance):
	if p1 is None or p2 is None:
		return 'player1 5'

	p1 = p1[0]
	p2 = p2[0]

	if p2 > p1:
		return 'player2 30'
	else:
		return 'player1 30'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = connect_to_database()
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def connect_to_database():
    return sqlite3.connect(app.config['DATABASE'])


if __name__ == "__main__":
    app.run()

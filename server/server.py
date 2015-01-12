# keep track of played matches so elo doesn't get fucked up

import pickle
from flask import Flask, request, g
import sqlite3

PROPAGATE_EXCEPTIONS = True
DEBUG = True
DATABASE = 'data.db'

app = Flask(__name__)
app.config.from_object(__name__)

# data in form of [wins, losses, total oponent ratings (defaults to 0), current rating (defaults to 1000)]

@app.route("/entry", methods=['POST'])
def entry():
	winner = request.form['winner']
	loser = request.form['loser']
	
	record_match(winner, loser)

	return 'recorded'

@app.route("/", methods=['GET'])
def bet():
	cur = get_db().cursor()
	p1 = request.args['p1']
	p2 = request.args['p2']
	balance = request.args['balance']

	p1_elo = cur.execute('SELECT elo FROM fighter WHERE name=?', (p1,)).fetchone()
	p2_elo = cur.execute('SELECT elo FROM fighter WHERE name=?', (p2,)).fetchone()

	# if no recorded data, don't bet
	if p1_elo is None and p2_elo is None:
		return 0
	else:
		return calc_bet(p1_elo, p2_elo, balance)

def record_match(winner, loser):
	db = get_db()
	cur = db.cursor()

	cur.execute('SELECT * FROM fighter WHERE name=?', (winner,))
	win_data = cur.fetchone()

	if not win_data:
		cur.execute('INSERT INTO fighter VALUES(?, ?, ?, ?, ?)', (winner, 1, 0, 1000, 1000))
	else:
		loser_elo = cur.execute('SELECT total_ratings FROM fighter WHERE name=?', (loser,)).fetchone()[0]
		if not loser_elo:
			loser_elo = 1000
		new_elo = update_elo(win_data)
		cur.execute('UPDATE fighter SET wins=wins+1, total_ratings=total_ratings+?, elo=? WHERE name=?', (loser_elo, new_elo, winner))

	cur.execute('SELECT * FROM fighter WHERE name=?', (loser,))
	lose_data = cur.fetchone()

	if not lose_data:
		cur.execute('INSERT INTO fighter VALUES(?, ?, ?, ?, ?)', (loser, 0, 1, 1000, 1000))
	else:
		winner_elo = cur.execute('SELECT total_ratings FROM fighter WHERE name=?', (winner,)).fetchone()[0]
		new_elo = update_elo(lose_data)
		cur.execute('UPDATE fighter SET losses=losses+1, total_ratings=total_ratings+?, elo=? WHERE name=?', (winner_elo, new_elo, loser))

	db.commit()

def load_data():
	f = open('data.pkl', 'w+b')
	try:
		data = pickle.load(f)
	except EOFError:	# pickle file is empty
		data = {}

	return (data, f)

def update_elo(fighter):
	wins = fighter[1]
	losses = fighter[2]
	opponent_ratings = fighter[3]
	# the algorithm of 400 formula
	return (opponent_ratings + 400 * (wins - losses))/(wins + losses)

def calc_bet(p1, p2, balance):
	if p1 is None:
		p1 = 1000
	else:
		p1 = p1[0]
	if p2 is None:
		p2 = 1000
	else:
		p2 = p2[0]

	if p2 > p1:
		return 'p2 10'
	else:
		return 'p1 10'



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

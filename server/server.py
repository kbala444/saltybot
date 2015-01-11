import pickle
from flask import Flask, request

PROPAGATE_EXCEPTIONS = True

app = Flask(__name__)
app.config.from_object(__name__)

# data in form of [wins, losses, total oponent ratings (defaults to 0), current rating (defaults to 1000)]

@app.route("/entry", methods=['POST'])
def entry():
	winner = request.form['winner']
	loser = request.form['loser']
	
	data, f = load_data()
	record_match(winner, loser, data)
	pickle.dump(data, f)
	f.close()

	return str(data)

@app.route("/", methods=['GET'])
def bet():
	p1 = request.form['p1']
	p2 = request.form['p2']

	data, f = load_data()

	getElo(data, p1, p2)

def record_match(winner, loser, data):
	if winner in data:
		data[winner][0] += 1
		data[winner][2] += data[loser][3]
		data[winner][3] = update_elo(data[winner])
	else:
		data[winner] = [1, 0, 0, 1000]

	if loser in data:
		data[loser][1] += 1
		data[loser][2] += data[winner][3]
		data[loser][3] = update_elo(data[loser])
	else:
		data[loser] = [0, 1, 0, 1000]

def load_data():
	f = open('data.pkl', 'w+b')
	try:
		data = pickle.load(f)
	except EOFError:	# pickle file is empty
		data = {}

	return (data, f)

def update_elo(player):
	wins = player[0]
	losses = player[1]
	opponent_ratings = player[2]
	# the algorithm of 400 formula
	return (opponent_ratings + 400 * (wins - losses))/(wins + losses)

if __name__ == "__main__":
    app.run()

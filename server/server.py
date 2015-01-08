import pickle
from flask import Flask, request

PROPAGATE_EXCEPTIONS = True

app = Flask(__name__)
app.config.from_object(__name__)

@app.route("/entry", methods=['POST'])
def entry():
	winner = request.form['winner']
	loser = request.form['loser']

	f = open('data.pkl', 'w+b')
	try:
		data = pickle.load(f)
	except EOFError:	# pickle file is empty
		data = {}
	
	record_match(winner, loser, data)
	pickle.dump(data, f)
	f.close()

	return str(data)

def record_match(winner, loser, data):
	if winner in data:
		data[winner][0] += 1
	else:
		data[winner] = [1, 0]

	if loser in data:
		data[loser][1] += 1
	else:
		data[loser] = [0, 1]

if __name__ == "__main__":
    app.run()

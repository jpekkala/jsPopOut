//scores used and returned by GameEngine
UNKNOWN = 0;
WIN = 1;
LOSS = -1;

/**
 * Performs two-valued negamax with shallow pruning. The history heuristic is 
 * used for move ordering and a transposition table is used to cache results.
 *
 * The game engine calculates whether the first player wins or loses under
 * "handicapping rules". The handicapping rules require the first player to win  * within 21 plies and does not allow him to make a pop move unless it leads to  * an immediate him. In other words, a loss for the first player does not 
 * necessarily mean that he loses in PopOut. It is possible that he could win 
 * if he made a non-winning pop move or if the game was allowed to last longer 
 * than 21 plies.
 */
function GameEngine () {
	Bitboard.call(this);
	this.transTable = new TransTable();
	this.history = new Array(7*6);
}

GameEngine.prototype = Object.create(Bitboard.prototype);

/**
 * Sets up everything and performs the search. Returns either WIN or LOSS 
 * which is from the perspective of the current player.
 */
GameEngine.prototype.solve = function() {
	if(this.hasWon(this.boards[0])) {
		return this.ply % 2 == 0?WIN:LOSS;
	} else if(this.hasWon(this.boards[1])) {
		return this.ply % 2 == 0?LOSS:WIN;
	}

	this.resetHistory();
	this.interiorCount = 0;	
	this.plyLimit = 21;
	return this.negamax();
}

/**
 * Returns a winning move or false if no such move could be found
 */
GameEngine.prototype.getBestMove = function() {
	var symmetric = this.getPositionCode() == this.getMirrorPositionCode();
	var succ = this.getSuccessors(symmetric);
	var best;	
	//check if there is an immediate win
	var quickScore = this.fastEvaluate(succ);
	if(quickScore == WIN) {
		for(var i = 0; i < succ.length; i++) {
			if(succ[i].score == WIN) {
				best = succ[i];
				break;
			}	
		}
	} else {
		//no immediate win, call negamax
		var oldVariation = this.variation;
		this.resetHistory();
		this.orderMoves(succ);
		for(var i = 0; i < succ.length; i++) {
			var s = succ[i];
			if(s.score != UNKNOWN) continue;
			if(s.pop) this.pop(s.column);
			else this.drop(s.column);
			
			var r = this.solve();
			this.setVariation(oldVariation);
			if(r == LOSS) {
				best = s;
				break;
			}
		}
	}

	if(best) {
		//convert to char a-g or A-G
		return String.fromCharCode((best.pop?65:97) + best.column);
	} else {
		return false;
	}
}

/**
 * Returns the successor states i.e. the states reachable by making only one 
 * move. If the flag symmetric is set, the position has been determined to be 
 * symmetric and moves in the last three columns are skipped.
 */
GameEngine.prototype.getSuccessors = function(symmetric) {
	var p = this.ply & 1;

	var columnLimit = symmetric ? 4 : 7;
	var successors = [];

	for(var x = 0; x < columnLimit; x++) {
		if(this.canDrop(x)) {
			var s = { boards: this.getDropBoards(x), pop: false, column: x, score: UNKNOWN};
			successors.push(s);	
		}
	}

	//do in a second loop so that pop moves come last
	for(var x = 0; x < columnLimit; x++) {
		if(this.canPop(x)) {
			var s = { boards: this.getPopBoards(x), pop: true, column: x, score: UNKNOWN};
			successors.push(s);	
		}
	}
	
	return successors;
}

/**
 * Determines if any of the successor states are terminal nodes. Returns WIN 
 * if at least one successor state is a win for the current player, otherwise 
 * LOSS.
 */
GameEngine.prototype.fastEvaluate = function(successors) {
	var current = this.ply & 1;
	var other = current^1;
	for(var i = 0; i < successors.length; i++) {
		var s = successors[i];
		if(this.hasWon(s.boards[current])) {
			s.score = WIN;
			return WIN;
		}	else if(s.pop) {
			if(current == 0 || this.hasWon(s.boards[other])) {
				s.score = LOSS;
			}
		}
	}
	return LOSS;
}

/**
 * Resets the history heuristic and initializes the move scores by preferring 
 * the middle columns.
 */
GameEngine.prototype.resetHistory = function() {
	//give middle cells a slightly better initial score
	for(var x = 0; x < 7; x++) {
		var v = Math.min(x, 6 - x);
		for(var y = 0; y < 6; y++) {
			this.history[x*6 + y] = v;
		}
	}
}

GameEngine.prototype.getHistoryScore = function(x) {
	return this.history[x*6 + this.heights[x]];
}

/**
 * The history score should be increased if a move is "sufficient" i.e. it 
 * caused a cutoff.
 */
GameEngine.prototype.increaseHistoryScore = function(x) {
	if(this.ply <= 22) {
		//the weight 2^depth is used
		this.history[x*6 + this.heights[x]] += Math.pow(2, 22 - this.ply);
	}
}

/**
 * Sort the successor states based on their history scores. The states
 * resulting from pop moves are not sorted because non-winning pop moves
 * are almost always played only as a last resort and therefore their
 * order is unlikely to matter.
 */
GameEngine.prototype.orderMoves = function(succ) {
	for(var i = 1; i < succ.length; i++) {
		//pop moves should come after drop moves and they do not need to be ordered
		if(succ[i].pop) break;

		//insertion sort based on history score
		var j = i;
		while(j > 0) {
			var a = this.getHistoryScore(succ[j].column);
			var b = this.getHistoryScore(succ[j - 1].column);

			if(a > b) {
				//swap
				var t = succ[j];
				succ[j] = succ[j - 1];
				succ[j - 1] = t;
				j--;
			} else {
				//the rest are already sorted
				break;
			}
		}
	}
}

/**
 * Two-valued negamax. The method calls itself recursively until it finds the 
 * score for the current state. 
 */ 
GameEngine.prototype.negamax = function() {
	this.interiorCount++;

	if(this.reportFunction && this.interiorCount % 200000 == 0) {
		this.reportFunction();
	}

	//depth limit reached, White loses
	if(this.ply >= this.plyLimit) {
		return this.ply % 2 == 0?LOSS:WIN;
	}

	//find the position code and check for symmetry
	var pos = this.getPositionCode();
	var mirrorPos = this.getMirrorPositionCode();
	var symmetrical = false;
	if(pos === mirrorPos) {
		pos = pos < mirrorPos ? pos : mirrorPos;
		symmetrical = true;
	}

	//check if we have already solved the position
	var transScore = this.transTable.fetch(pos);
	if(transScore != UNKNOWN) return transScore;
	
	//get successor states and check for an immediate win
	var successors = this.getSuccessors(symmetrical);
	var bestScore = this.fastEvaluate(successors);
	if(bestScore == WIN) return WIN;

	//order moves with the history heuristic
	this.orderMoves(successors);

	//save the current state
	var startNodes = this.interiorCount;
	var oldVariation = this.variation;
	var oldBoards = this.boards;

	this.ply++;
	for(var i = 0; i < successors.length; i++) {
		var s = successors[i];
		//if the score is not UNKNOWN, it is a terminal state
		if(s.score != UNKNOWN) continue;
	
		//change the state
		this.boards = s.boards;
		if(s.pop) {
			this.heights[s.column]--;
			this.variation += String.fromCharCode(65 + s.column);
		} else {
			this.heights[s.column]++;
			this.variation += String.fromCharCode(97 + s.column);
		}

		//recursive call, note the minus sign
		var newScore = -this.negamax();

		//return to the previous state
		if(s.pop) {
			this.heights[s.column]++;
		} else {
			this.heights[s.column]--;
		}
		this.variation = oldVariation;

		//if we have found a winning move, we can skip the rest of the moves
		if(newScore == WIN) {
			this.increaseHistoryScore(s.column);
			bestScore = WIN;
			break;
		}
	}
	this.ply--;

	//restore old state completely
	this.boards = oldBoards;

	this.transTable.store(pos, bestScore, this.interiorCount - startNodes);
	return bestScore;
}

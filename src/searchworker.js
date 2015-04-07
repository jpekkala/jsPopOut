//this file should be run as a web worker, import required scripts into scope
importScripts("bitboard.js", "transtable.js", "engine.js");

var game = new GameEngine();
//reportFunction is called once for every 200,000 interior nodes
game.reportFunction = function() {
	postMessage({text: game.variation, finished: false});
}

/**
 * Solve the variation, measure elapsed time, and send the formatted result
 */
function solve(variation) {
	game.setVariation(variation);
	var startTime = new Date();
	var score = game.solve();
	if(game.ply % 2 != 0) score = -score;
	var elapsed = new Date() - startTime;
	var speed = Math.round(game.interiorCount * 1000 / elapsed);
	var result = score == 1?"White wins":"Unknown";
	var text = "Result: " + result + "\n\nInterior nodes: " + game.interiorCount + "\nElapsed time: " + elapsed + " ms\nNodes per second: " + speed;
	postMessage({text: text, finished: true});
}

function computerPlay(variation) {
	game.setVariation(variation);
	if(game.ply % 2 != 0) {
		postMessage({text: "Cannot play as Red", finished: true});
		return;
	}
	var bestMove = game.getBestMove();
	var text;
	if(bestMove) text = "Play: " + bestMove;
	else text = "Cannot find a winning move";
	
	postMessage({move: bestMove, text: text, finished: true});	
}

onmessage = function(e) {
	if(e.data.mode == "solve") {
		solve(e.data.variation);
	} else if(e.data.mode == "computer") {
		computerPlay(e.data.variation);
	} else if(e.data.mode == "clear") {
		game.transTable.table = null;
	}
}

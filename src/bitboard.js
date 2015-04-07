/**
 * The game state is represented by using two bitboards, one for each player.
 * Each bit in the bitboard corresponds to one cell and the bit is set if
 * the player has a disk in the cell and unset if not. Each column consists
 * of 6 cell bits and one extra bit. The extra bit is always unset and it
 * is used to make sure that certain bit operations do not cause bits to 
 * overflow to adjacent columns.
 *
 * Ideally, each bitboard would be a single 64-bit integer but Javascript
 * has only one Number type that is the same as the IEEE 754 double type.
 * It however supports shift operations by treating it as a 32-bit integer.
 * The player's bitboard is therefore divided into two 32-bit integers.
 *
 * Both 32-bit integers contain four columns. The middle column is replicated
 * in both and the middle column is always the last column (meaning that the
 * other half is mirrored). The last four bits which do not map to any column
 * are always unset.
 */
function Bitboard() {
	this.reset();	
}

/**
 * Empty boards
 */
Bitboard.prototype.reset = function() {
	this.ply = 0;
	//boards[0] is White and boards[1] is Red
	this.boards = [{left: 0, right: 0}, {left: 0, right: 0}];
	//the column heights (int 0-6)
	this.heights = [0,0,0,0,0,0,0];
	this.variation = "";
}


Bitboard.prototype.hasWon = function(board) {
	//it does not matter which way the two halves are assigned
	var half1 = board.left;
	var half2 = board.right;

	//check vertical which is easy
	var vertical1 = half1 & half1 << 1;
	var vertical2 = half2 & half2 << 1;
	if((vertical1 & vertical1 << 2) != 0) return true;
	if((vertical2 & vertical2 << 2) != 0) return true;

	//horizontal and diagonals require more complex logic
	if(this.checkHorizontal(half1, half2)) return true;
	if(this.checkDiagonal(half1, half2)) return true;
	if(this.checkDiagonal(half2, half1)) return true;

	return false;
}

Bitboard.prototype.checkHorizontal = function(half1, half2) {
	//change the semantic meaning of a bit from "has disk" to "adjacent pair"
	half1 &= half1 >>> 7;
	half2 &= half2 >>> 7;

	//only the 6 first bits can be set and they are the pairs containing the middle column
	var middle1 = half1 >>> 14;
	var middle2 = half2 >>> 14;
	
	//check for a win in columns a-d and d-g
	if((half1 & middle1) != 0) return true;	
	if((half2 & middle2) != 0) return true;	

	//check for a win in columns b-e and c-f
	if((half1 & middle2 << 7) != 0) return true;
	if((half2 & middle1 << 7) != 0) return true;

	return false;
}

Bitboard.prototype.checkDiagonal = function(half1, half2) {
	half1 &= half1 >>> 8;
	half2 &= half2 >>> 6;

	//check for a win in columns a-d and d-g
	if((half1 & half1 >>> 16) != 0) return true;
	if((half2 & half2 >>> 12) != 0) return true;	

	//remove the outer column so that it does not interfere
	half1 >>>= 7;
	half2 >>>= 8; //+1 for adjustment, could also be done in the next part

	//check for a win in columns b-e and c-f
	if((half2 & half1 >>> 5) != 0) return true;
	if((half1 & half2 >>> 9) != 0) return true;

	return false;
}


/**
 * Returns an integer that is smaller than 2^49 and that uniquely encodes the game position.
 * It should be safe to store any integer that does not exceed 2^53 in the Javascript number
 * type without a loss of information (see double-precision IEEE-754)
 */
Bitboard.prototype.getPositionCode = function() {
	var n = 0x10000000; // == 2**28
	//the mask removes the middle column so that it is not added twice
	var mask = 0x1fffff; // == 2**21 - 1
	//add White's board twice and Red's board once
	n *= 2*(this.boards[0].right & mask) + (this.boards[1].right & mask);
	n += 2*this.boards[0].left + this.boards[1].left;
	return n;
}

/**
 * Returns the position code when the columns are horizontally mirrored. If the normal
 * position code and the mirror position code are the same, the position is symmetrical.
 */
Bitboard.prototype.getMirrorPositionCode = function() {
	var n = 0x10000000; // == 2**28
	var mask = 0x1fffff; // == 2**21 - 1
	n *= 2*(this.boards[0].left & mask) + (this.boards[1].left & mask);
	n += 2*this.boards[0].right + this.boards[1].right;
	return n;
}

/**
 * Returns whether it is legal for the current player to drop a new disk
 */
Bitboard.prototype.canDrop = function(x) {
	return this.heights[x] < 6;
}

/**
 * Returns whether it is legal for the current player to pop a bottom disk of his own color
 */
Bitboard.prototype.canPop = function(x) {
	if(x < 4) {
		return (this.boards[this.ply & 1].left & 1 << x * 7) != 0;	
	} else {
		return (this.boards[this.ply & 1].right & 1 << (6 - x) * 7) != 0;
	}
}

/**
 * Returns a deep copy of the current state (i.e. the bitboards)
 */
Bitboard.prototype.getCurrentBoards = function() {
	return [{left: this.boards[0].left, right: this.boards[0].right}, {left: this.boards[1].left, right: this.boards[1].right}];
}

/**
 * Returns the new state that would result if the current player made a drop move
 */
Bitboard.prototype.getDropBoards = function(x) {
	var newBoards = this.getCurrentBoards();

	var h = this.heights[x];
	var current = this.ply & 1;

	if(x <= 3) {
		newBoards[current].left |= 1 << x * 7 + h;	
	}	
	//x == 3 will cause both IF blocks to run because the middle column is in both halves
	if(x >= 3) {
		newBoards[current].right |= 1 << (6 - x) * 7 + h;
	}
	
	return newBoards;	
}

/**
 * Returns the new state that would result if the current player made a pop move
 */
Bitboard.prototype.getPopBoards = function(x) {
	var newBoards = this.getCurrentBoards();

	if(x <= 3) {
		//remove piece
		newBoards[this.ply & 1].left ^= 1 << x * 7; 

		//shift down column
		var mask = 127 << x * 7;
		var complement = ~mask;	
		newBoards[0].left = (newBoards[0].left & complement) | (newBoards[0].left & mask) >>> 1;
		newBoards[1].left = (newBoards[1].left & complement) | (newBoards[1].left & mask) >>> 1;
	}

	if(x >= 3) {
		//remove piece
		newBoards[this.ply & 1].right ^= 1 << (6 - x) * 7; 

		//shift down column
		var mask = 127 << (6 - x) * 7;
		var complement = ~mask;	
		newBoards[0].right = (newBoards[0].right & complement) | (newBoards[0].right & mask) >>> 1;
		newBoards[1].right = (newBoards[1].right & complement) | (newBoards[1].right & mask) >>> 1;
	}

	return newBoards;
}

/**
 * Drop a new disk and update bitboards
 */
Bitboard.prototype.drop = function(x) {
	if(!this.canDrop(x)) return false;
	this.boards = this.getDropBoards(x);
	this.heights[x]++;
	this.ply++;
	this.variation += String.fromCharCode(97 + x);
	return true;
}

/**
 * Pop a disk and update bitboards
 */
Bitboard.prototype.pop = function(x) {
	if(!this.canPop(x)) return false;
	this.boards = this.getPopBoards(x);
	this.heights[x]--;
	this.ply++;
	this.variation += String.fromCharCode(65 + x);
	return true;
}

Bitboard.prototype.setVariation = function(variation) {
	this.reset();
	for(var i = 0; i < variation.length; i++) {
		var code = variation.charCodeAt(i);
		if(code >= 97 && code < 97 + 7) {
			if(!this.drop(code - 97)) return false;
		}
		else if(code >= 65 && code < 65 + 7) {
			if(!this.pop(code - 65)) return false;
		} else {
			return false;
		}
	}
	return true;
}

/**
 * Convert the bitboards into a human-readable string
 */
Bitboard.prototype.toString = function() {
	var str = "";
	for(var y = 5; y >= 0; y--) {
		for(var x = 0; x < 7; x++) {
			var bit, p1, p2;

			if(x < 4) {
				bit = 1 << x * 7 + y;
				p1 = this.boards[0].left;
				p2 = this.boards[1].left;
			} else {
				bit = 1 << (6 - x) * 7 + y;
				p1 = this.boards[0].right;
				p2 = this.boards[1].right;
			}

			if((p1 & bit) != 0) str += "X";
			else if((p2 & bit) != 0) str += "O";
			else str += ".";
		}
		str += "\n";
	}
	return str;
}

/**
 * 32-bit bitboard to a string, for debugging purposes
 */
Bitboard.toString = function(board) {
 	var str = "";
	for(var y = 6; y >= 0; y--) {
		for(var x = 0; x < 5; x++) {
			if(x == 4 && y >= 4) continue;
			var bit = 1 << x * 7 + y;
			if((board & bit) != 0) str += "1";
			else str += "0";
		}
		str += "\n";
	}
	return str;
}

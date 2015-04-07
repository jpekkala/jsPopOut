/**
 * Stores the score of a position in a two-level hash table. For each
 * entry in the table, the key of the position, the score and the work
 * are stored. The key and the index uniquely identify the position
 * and the work is the number of nodes investigated. The replacement
 * scheme is TwoBig1 meaning that when a collision happens, the position
 * with the greatest work is always kept together with the new position.
 *
 * The information must be encoded in 52 bits because of Javascript's number
 * type. The score takes only one bit because the search algorithm uses 
 * two-valued logic. The number of bits for the key depends on the 
 * transposition table size. The remaining bits are reserved for the work.
 */
function TransTable(size) {
	//the size should be a prime because it is used as the hash function
	this.transSize = typeof size !== 'undefined'?size:2097169;

	//a position uses 49 bits, calculate how many bits the key needs
	this.keyBits = 49 - Math.floor(Math.log(this.transSize)/Math.log(2));
	//calculating the mask fails if key is 31 bits or more
	if(this.keyBits > 30) throw new Error("Transposition table size is too small");
	this.scoreOffset = 1 << this.keyBits;
	this.keyMask = this.scoreOffset - 1;
	this.maxWork = Math.pow(2, 52 - 1 - this.keyBits) - 1;

	this.reset();
}

TransTable.prototype.reset = function() {
	this.table = new Array(this.transSize * 2);
}

TransTable.prototype.store = function(pos, score, nodes) {
	//could also take log_2 or similar to ensure it fits
	if(nodes > this.maxWork) {
		nodes = this.maxWork;
	}

	//there are two entries per transposition slot
	var index = (pos % this.transSize) * 2;
	//Javascript does not have integer division
	var key = Math.floor(pos / this.transSize);

	//combine score and work
	var scoreWork = 2 * nodes;
	if(score === 1) scoreWork += 1;

	//multiplying by this.scoreOffset is the same as shifting (exceeds 32 bits here)
	var entry = scoreWork * this.scoreOffset + key;

	//determine if the new position has the biggest work
	var first = this.table[index];
	if(!first || entry > first) {
		//store as the first entry and move the old one to second place
		this.table[index] = entry;
		this.table[index + 1] = first;
	} else {
		//not the biggest work, store in the second place
		this.table[index + 1] = entry;
	}
}

TransTable.prototype.fetch = function(pos) {
	var index = (pos % this.transSize) * 2;
	var key = Math.floor(pos / this.transSize);

	//check the first entry
	var entry = this.table[index];
	if(!entry) return 0;
	if((entry & this.keyMask) === key) {
		//the score is in the first 32 bits so shifting is safe
		var whiteWins = (entry >>> this.keyBits & 1) == 1;	
		return whiteWins?1:-1;
	}

	//check the second entry
	entry = this.table[index + 1];
	if(!entry) return 0;
	if((entry & this.keyMask) === key) {
		var whiteWins = (entry >>> this.keyBits & 1) == 1;	
		return whiteWins?1:-1;
	}

	return 0;
}


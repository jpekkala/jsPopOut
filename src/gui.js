/**
 * A simple Connect-4 GUI as an HTML canvas.
 */
function Connect4(width, height) {
    this.boardWidth = typeof width !== 'undefined' ? width:7;
    this.boardHeight = typeof height !== 'undefined' ? height:6;

    this.boardColor = "#000000";
    this.backgroundColor = "#f4f3f3";

    var gui = this;

    var board = [];
    var winningCells = [];
    this.getCell = function(x,y) {
        return board[x*this.boardHeight + y];
    }
    this.setCell = function(x,y,value) {
        board[x*this.boardHeight + y] = value;
    }
    this.isWinningCell = function(x,y) {
        return winningCells[x*this.boardHeight + y];
    }
    this.setWinningCell = function(x,y,value) {
        winningCells[x*this.boardHeight + y] = value;
    }

    this.reset();
}

Connect4.prototype.setCanvas = function(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.cellSize = Math.min(canvas.width/(this.boardWidth + 1), canvas.height/(this.boardHeight + 1));
    this.edgeSize = this.cellSize / 4;
    this.startX = (canvas.width - this.cellSize * this.boardWidth - 2*this.edgeSize)/2;
    this.startY = (canvas.height - this.cellSize * this.boardHeight - 2*this.edgeSize)/2;

    var gui = this;
    canvas.addEventListener("mouseup", function(e) {
        gui.mouseHandler(e);
    }, false);
}

Connect4.prototype.getPosition = function() {
    var str = "";
    for(var y = this.boardHeight - 1; y >= 0; y--) {
        for(var x = 0; x < this.boardWidth; x++) {
            str += this.getCell(x,y);
        }
        if(y !== 0) str += "\n";
    }
    return str;
}

Connect4.prototype.setPosition = function(pos) {
    var s = pos.trim().split("\n");
    this.boardHeight = s.length;
    this.boardWidth = s[0].length;
    for(var i = 0; i < this.boardHeight; i++) {
        var y = this.boardHeight - i - 1;
        for(var x = 0; x < this.boardWidth; x++) {
            var value = parseInt(s[i].charAt(x));   
            this.setCell(x,y, value);
        }
    }
    this.hasWon = this.checkWin();
}

Connect4.prototype.reset = function() {
    for(var x = 0; x < this.boardWidth; x++) {
        for(var y = 0; y < this.boardHeight; y++) {
            this.setCell(x,y, 0);
            this.setWinningCell(x,y,false);
        }
    }
    this.hasWon = false;
    this.variation = "";
    this.results = null;
}

Connect4.prototype.getMoveNumber = function() {
    return this.variation.length;
}

Connect4.prototype.undoMove = function() {
    if(this.variation.length == 0) return false;
    var pos = this.variation.substring(0, this.variation.length - 1);
    return this.setVariation(pos);
}

Connect4.prototype.drop = function(x) {
    if(this.hasWon) return false;

    for(var y = 0; y < this.boardHeight; y++) {
        if(this.getCell(x,y) == 0) {
            this.setCell(x, y, this.getMoveNumber() % 2 == 0? 1 : 2);
            this.variation += String.fromCharCode(97 + x);
            this.hasWon = this.checkWin();
            return true;
        }
    }
    return false;
}

Connect4.prototype.pop = function(x) {
    if(this.hasWon) return false;
    if(this.getCell(x, 0) !== (this.getMoveNumber() % 2 == 0? 1 : 2)) return false;

    for(var y = 0; y < this.boardHeight - 1; y++) {
        this.setCell(x,y, this.getCell(x, y + 1));
    }
    this.setCell(x, this.boardHeight - 1, 0);
    this.variation += String.fromCharCode(65 + x);
    this.hasWon = this.checkWin();
    return true;
}

Connect4.prototype.play = function(move) {
    for(var i = 0; i < move.length; i++) {
        var code = move.charCodeAt(i);
        if(code >= 97 && code < 97 + this.boardWidth) {
            if(!this.drop(code - 97)) return false;
        }
        if(code >= 65 && code < 65 + this.boardWidth) {
            if(!this.pop(code - 65)) return false;
        }
    }
    return true;
}

Connect4.prototype.setVariation = function(variation) {
    this.reset();
    return this.play(variation);
}


Connect4.prototype.checkWin = function() {
    var won = false;

    //clear all winning cells
    for(var x = 0; x < this.boardWidth; x++) {
        for(var y = 0; y < this.boardHeight; y++) {
            this.setWinningCell(x,y,false);
        }
    }

    var outer = this;

    //check the line that starts at (x,y) and whose displacement is (xd,yd)
    function checkLine(p,x,y,xd,yd) {
        var count = 0;
        for(;(x >= 0 && x < outer.boardWidth) && (y >= 0 && y < outer.boardHeight); x+=xd,y+=yd) {
            var v = outer.getCell(x,y);
            if(v != p) {
                last = 0;
                count = 0;
                continue;
            }
            count++;
            if(count == 4) {
                won = true;
                for(var i = 0; i < 4; i++) {
                    outer.setWinningCell(x - i*xd, y - i*yd, true);
                }
            } else if(count > 4) {
                outer.setWinningCell(x, y, true);
            }
        }
    }

    var players = this.getMoveNumber() % 2 == 1 ? [1,2] : [2,1];
    for(var i in players) {
        var player = players[i];

        //check horizontal lines
        for(var y = 0; y < this.boardHeight; y++) {
            checkLine(player, 0,y,1,0);
        }

        //check vertical and diagonals
        for(var x = 0; x < this.boardWidth; x++) {
            checkLine(player, x,0,0,1);
            checkLine(player, x, 0, 1, 1);
            checkLine(player, x, 0, -1, 1);
            checkLine(player, x, this.boardHeight - 1, 1, -1);
            checkLine(player, x, this.boardHeight - 1, -1, -1);
        }
        if(won) break;
    }

    return won;
}

Connect4.prototype.getColumn = function(x,y) {
    x = x - this.edgeSize - this.startX;
    y = y - this.edgeSize - this.startY;
    x = Math.floor(x/this.cellSize);
    y = Math.floor(y/this.cellSize);
    if(x < 0 || x > this.boardWidth) return -1;
    if(y < 0 || y > this.boardHeight) return -1;
    return x;
}

Connect4.prototype.mouseHandler = function(ev) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var currentElement = this.canvas;
    do {
        totalOffsetX += currentElement.offsetLeft;
        totalOffsetY += currentElement.offsetTop;
    }while(currentElement = currentElement.offsetParent);
    var x = ev.pageX - totalOffsetX;
    var y = ev.pageY - totalOffsetY;
    var column = this.getColumn(x,y);
    if(column != -1) {
        if(ev.button == 0 && this.onLeftClick) this.onLeftClick(column);
        if(ev.button == 2 && this.onRightClick) this.onRightClick(column);
    }
}

Connect4.prototype.drawBoard = function() {
    var board = this;
    var ctx =this.context;
    var x0 = this.startX; 
    var y0 = this.startY; 
    var cellSize = this.cellSize;
    var edgeSize = this.edgeSize;

    //clears all
    ctx.fillStyle = this.boardColor;
    roundRect(ctx, x0, y0, cellSize * this.boardWidth + edgeSize*2, cellSize * this.boardHeight + edgeSize*2, cellSize/2, true, false);

    var offsetX = x0 + edgeSize + cellSize/2;
    var offsetY = y0 + edgeSize + cellSize/2;
    var radius = cellSize * 0.85 /2 
    
    for(var x = 0; x < this.boardWidth; x++) {
        for(var y = 0; y < this.boardHeight; y++) {
            var value = board.getCell(x,this.boardHeight - y - 1);

            var gradient = ctx.createLinearGradient(offsetX + cellSize*(x - 0.5), offsetY + cellSize*(y -0.5),
                offsetX + cellSize*(x + 1.5), offsetY + cellSize* (y + 1.5));

            if(board.isWinningCell(x,this.boardHeight - y - 1)) {
                gradient.addColorStop(0, "yellow");
                gradient.addColorStop(1, "#ffff66");
            }
            else if(value == 1) {
                gradient.addColorStop(0, "#2B65EC");
                gradient.addColorStop(1, "#1F45FC");
            }
            else if(value == 2) {
                gradient.addColorStop(0, "red");
                gradient.addColorStop(1, "#660000");
            }
            else {
                gradient = this.backgroundColor;
            }
            ctx.beginPath();
            ctx.arc(offsetX + cellSize * x, offsetY + cellSize * y, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
        
    //draw results
    if(this.showResults) {
        var lampWidth = cellSize * 0.9;
        var lampHeight = cellSize * 0.3;
        var results = board.results;
        offsetX = x0 + edgeSize + (cellSize - lampWidth)/2;
        offsetY = y0 + edgeSize*2.5 + cellSize * this.boardHeight; 
        for(var i = 0; i < this.boardWidth; i++) {
            var style = "black";
            if(results == undefined) style = this.backgroundColor;
            else if(results[i] == '+')  style = "white";
            else if(results[i] == '-') style = "red";
            else if(results[i] == '=') style = "yellow";
            ctx.fillStyle = style;
            ctx.fillRect(offsetX + i*cellSize, offsetY, lampWidth, lampHeight);
        }
    }
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined" ) {
        stroke = true;
    }
    if (typeof radius === "undefined") {
        radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (stroke) {
        ctx.stroke();
    }
    if (fill) {
        ctx.fill();
    }
}

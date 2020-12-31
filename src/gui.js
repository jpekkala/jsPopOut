/**
 * A simple Connect-4 GUI as an HTML canvas.
 */
export default function Connect4(width = 7, height = 6) {
    this.boardWidth = width;
    this.boardHeight = height;

    this.boardColor = "#000000";
    this.backgroundColor = "#f4f3f3";

    const board = [];
    const winningCells = [];
    this.getCell = function (x, y) {
        return board[x * this.boardHeight + y];
    }
    this.setCell = function (x, y, value) {
        board[x * this.boardHeight + y] = value;
    }
    this.isWinningCell = function (x, y) {
        return winningCells[x * this.boardHeight + y];
    }
    this.setWinningCell = function (x, y, value) {
        winningCells[x * this.boardHeight + y] = value;
    }

    this.reset();
}

Connect4.prototype.setCanvas = function (canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.cellSize = Math.min(canvas.width / (this.boardWidth + 1), canvas.height / (this.boardHeight + 1));
    this.edgeSize = this.cellSize / 4;
    this.startX = (canvas.width - this.cellSize * this.boardWidth - 2 * this.edgeSize) / 2;
    this.startY = (canvas.height - this.cellSize * this.boardHeight - 2 * this.edgeSize) / 2;

    canvas.addEventListener("mouseup", e => this.mouseHandler(e), false);
}

Connect4.prototype.getPosition = function () {
    let str = "";
    for (let y = this.boardHeight - 1; y >= 0; y--) {
        for (let x = 0; x < this.boardWidth; x++) {
            str += this.getCell(x, y);
        }
        if (y !== 0) str += "\n";
    }
    return str;
}

Connect4.prototype.setPosition = function (pos) {
    let s = pos.trim().split("\n");
    this.boardHeight = s.length;
    this.boardWidth = s[0].length;
    for (let i = 0; i < this.boardHeight; i++) {
        let y = this.boardHeight - i - 1;
        for (let x = 0; x < this.boardWidth; x++) {
            const value = parseInt(s[i].charAt(x));
            this.setCell(x, y, value);
        }
    }
    this.hasWon = this.checkWin();
}

Connect4.prototype.reset = function () {
    for (let x = 0; x < this.boardWidth; x++) {
        for (let y = 0; y < this.boardHeight; y++) {
            this.setCell(x, y, 0);
            this.setWinningCell(x, y, false);
        }
    }
    this.hasWon = false;
    this.variation = "";
    this.results = null;
}

Connect4.prototype.getMoveNumber = function () {
    return this.variation.length;
}

Connect4.prototype.undoMove = function () {
    if (this.variation.length === 0) return false;
    const pos = this.variation.substring(0, this.variation.length - 1);
    return this.setVariation(pos);
}

Connect4.prototype.drop = function (x) {
    if (this.hasWon) return false;

    for (let y = 0; y < this.boardHeight; y++) {
        if (this.getCell(x, y) == 0) {
            this.setCell(x, y, this.getMoveNumber() % 2 == 0 ? 1 : 2);
            this.variation += String.fromCharCode(97 + x);
            this.hasWon = this.checkWin();
            return true;
        }
    }
    return false;
}

Connect4.prototype.pop = function (x) {
    if (this.hasWon) return false;
    if (this.getCell(x, 0) !== (this.getMoveNumber() % 2 == 0 ? 1 : 2)) return false;

    for (let y = 0; y < this.boardHeight - 1; y++) {
        this.setCell(x, y, this.getCell(x, y + 1));
    }
    this.setCell(x, this.boardHeight - 1, 0);
    this.variation += String.fromCharCode(65 + x);
    this.hasWon = this.checkWin();
    return true;
}

Connect4.prototype.play = function (move) {
    for (let i = 0; i < move.length; i++) {
        const code = move.charCodeAt(i);
        if (code >= 97 && code < 97 + this.boardWidth) {
            if (!this.drop(code - 97)) return false;
        }
        if (code >= 65 && code < 65 + this.boardWidth) {
            if (!this.pop(code - 65)) return false;
        }
    }
    return true;
}

Connect4.prototype.setVariation = function (variation) {
    this.reset();
    return this.play(variation);
}


Connect4.prototype.checkWin = function () {
    let won = false;

    //clear all winning cells
    for (let x = 0; x < this.boardWidth; x++) {
        for (let y = 0; y < this.boardHeight; y++) {
            this.setWinningCell(x, y, false);
        }
    }

    const outer = this;

    //check the line that starts at (x,y) and whose displacement is (xd,yd)
    function checkLine(p, x, y, xd, yd) {
        let count = 0;
        for (; (x >= 0 && x < outer.boardWidth) && (y >= 0 && y < outer.boardHeight); x += xd, y += yd) {
            const v = outer.getCell(x, y);
            if (v !== p) {
                count = 0;
                continue;
            }
            count++;
            if (count === 4) {
                won = true;
                for (let i = 0; i < 4; i++) {
                    outer.setWinningCell(x - i * xd, y - i * yd, true);
                }
            } else if (count > 4) {
                outer.setWinningCell(x, y, true);
            }
        }
    }

    const players = this.getMoveNumber() % 2 === 1 ? [1, 2] : [2, 1];
    for (const player of players) {
        //check horizontal lines
        for (let y = 0; y < this.boardHeight; y++) {
            checkLine(player, 0, y, 1, 0);
        }

        //check vertical and diagonals
        for (let x = 0; x < this.boardWidth; x++) {
            checkLine(player, x, 0, 0, 1);
            checkLine(player, x, 0, 1, 1);
            checkLine(player, x, 0, -1, 1);
            checkLine(player, x, this.boardHeight - 1, 1, -1);
            checkLine(player, x, this.boardHeight - 1, -1, -1);
        }
        if (won) break;
    }

    return won;
}

Connect4.prototype.getColumn = function (x, y) {
    x = x - this.edgeSize - this.startX;
    y = y - this.edgeSize - this.startY;
    x = Math.floor(x / this.cellSize);
    y = Math.floor(y / this.cellSize);
    if (x < 0 || x > this.boardWidth) return -1;
    if (y < 0 || y > this.boardHeight) return -1;
    return x;
}

Connect4.prototype.mouseHandler = function (ev) {
    let totalOffsetX = 0;
    let totalOffsetY = 0;
    let currentElement = this.canvas;
    while (currentElement) {
        totalOffsetX += currentElement.offsetLeft;
        totalOffsetY += currentElement.offsetTop;
        currentElement = currentElement.offsetParent;
    }
    const x = ev.pageX - totalOffsetX;
    const y = ev.pageY - totalOffsetY;
    const column = this.getColumn(x, y);
    if (column !== -1) {
        if (ev.button === 0 && this.onLeftClick) this.onLeftClick(column);
        if (ev.button === 2 && this.onRightClick) this.onRightClick(column);
    }
}

Connect4.prototype.drawBoard = function () {
    const board = this;
    const ctx = this.context;
    const x0 = this.startX;
    const y0 = this.startY;
    const cellSize = this.cellSize;
    const edgeSize = this.edgeSize;

    //clears all
    ctx.fillStyle = this.boardColor;
    roundRect(ctx, x0, y0, cellSize * this.boardWidth + edgeSize * 2, cellSize * this.boardHeight + edgeSize * 2, cellSize / 2, true, false);

    {
        const offsetX = x0 + edgeSize + cellSize / 2;
        const offsetY = y0 + edgeSize + cellSize / 2;
        const radius = cellSize * 0.85 / 2

        for (let x = 0; x < this.boardWidth; x++) {
            for (let y = 0; y < this.boardHeight; y++) {
                const value = board.getCell(x, this.boardHeight - y - 1);

                let gradient = ctx.createLinearGradient(offsetX + cellSize * (x - 0.5), offsetY + cellSize * (y - 0.5),
                    offsetX + cellSize * (x + 1.5), offsetY + cellSize * (y + 1.5));

                if (board.isWinningCell(x, this.boardHeight - y - 1)) {
                    gradient.addColorStop(0, "yellow");
                    gradient.addColorStop(1, "#ffff66");
                } else if (value == 1) {
                    gradient.addColorStop(0, "#2B65EC");
                    gradient.addColorStop(1, "#1F45FC");
                } else if (value == 2) {
                    gradient.addColorStop(0, "red");
                    gradient.addColorStop(1, "#660000");
                } else {
                    gradient = this.backgroundColor;
                }
                ctx.beginPath();
                ctx.arc(offsetX + cellSize * x, offsetY + cellSize * y, radius, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }
    }

    //draw results
    if (this.showResults) {
        const lampWidth = cellSize * 0.9;
        const lampHeight = cellSize * 0.3;
        const results = board.results;
        const offsetX = x0 + edgeSize + (cellSize - lampWidth) / 2;
        const offsetY = y0 + edgeSize * 2.5 + cellSize * this.boardHeight;
        for (let i = 0; i < this.boardWidth; i++) {
            let style = "black";
            if (!results) style = this.backgroundColor;
            else if (results[i] === '+') style = "white";
            else if (results[i] === '-') style = "red";
            else if (results[i] === '=') style = "yellow";
            ctx.fillStyle = style;
            ctx.fillRect(offsetX + i * cellSize, offsetY, lampWidth, lampHeight);
        }
    }
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined") {
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

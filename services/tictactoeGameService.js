const log = require('./logService').log;

//
// Evaluates the board and returns the result object
//
function verifyBoard(board) {
    log(`Verifying board - ${board} for status`);

    const players = [1, 2];
    const result = {
        winner: null,
        board: board,
        status: null
    }

    for (let player of players) {
        log(`Checking status for player - ${player}`);
        if (checkIfRowWin(board, player) || checkIfColWin(board, player) || checkIfDiagonalWin(board, player)) {
            log(`Winning player - ${player}`);

            result.winner = player;
            break;
        }
    }

    if (!result.winner) {
        log(`No winner - checking if game is TIE`);
        result.status = checkIfPossibleMovePresent(board) ? null : "TIE";
    }

    log(`Board evaluated - ${board} - ${JSON.stringify(result)}`)
    return result;
}

function checkIfRowWin(board, letter) {
    log(`Checking if row win - ${board} - ${letter}`);

    if (board[0] == letter && board[1] == letter && board[2] == letter) {
        log(`Row win ${board} - ${letter}`);
        return letter;
    }

    if (board[3] == letter && board[4] == letter && board[5] == letter) {
        log(`Row win ${board} - ${letter}`);
        return letter;
    }

    if (board[6] == letter && board[7] == letter && board[8] == letter) {
        log(`Row win ${board} - ${letter}`);
        return letter;
    }

    log(`No row win ${board} - ${letter}`);
    return "";
}

function checkIfColWin(board, letter) {
    log(`Checking if column win - ${board} - ${letter}`);

    if (board[0] == letter && board[3] == letter && board[6] == letter) {
        log(`Column win ${board} - ${letter}`);
        return letter;
    }

    if (board[1] == letter && board[4] == letter && board[7] == letter) {
        log(`Column win ${board} - ${letter}`);
        return letter;
    }

    if (board[2] == letter && board[5] == letter && board[8] == letter) {
        log(`Column win ${board} - ${letter}`);
        return letter;
    }

    log(`No column win ${board} - ${letter}`);
    return "";
}

function checkIfDiagonalWin(board, letter) {
    log(`Checking if diagonal win - ${board} - ${letter}`);

    if (board[0] == letter && board[4] == letter && board[8] == letter) {
        log(`Diagonal win ${board} - ${letter}`);
        return letter;
    }

    if (board[2] == letter && board[4] == letter && board[6] == letter) {
        log(`Diagonal win ${board} - ${letter}`);
        return letter;
    }

    log(`No diagonal win ${board} - ${letter}`);
    return "";
}

function checkIfPossibleMovePresent(board) {
    return board.includes(0) ? true : false;
}

function copyBoard(board) {
    return board.map(letter => letter);
}

// check if a player could win, copying the board
// to avoid editing on the original board
function checkIfPlayerCouldWin(board, letter, position) {
    log(`Checking if ${letter} could win for ${position} - ${board}`);

    let boardCopy = copyBoard(board);
    boardCopy[position] = letter;

    const result = verifyBoard(boardCopy);

    return result.winner == letter ? true : false;
}

function getPossibleMoves(board) {
    const possibleMoves = [];

    board.forEach((place, index) => {
        if (place == 0) {
            possibleMoves.push(index)
        }
    });

    return possibleMoves;
}

//
// Bruteforce approach for computer move
// First check if computer could win in next move
// Block other players winning move
// take corners, else center, else other edges 
//
function computerMove(board, computerLetter) {
    const playerLetter = computerLetter == 1 ? 2 : 1;
    const possibleMoves = getPossibleMoves(board);

    log(`Making a computer move - ${board} - ${computerLetter}`);
    if (possibleMoves.length == 0) {
        return;
    }

    if (possibleMoves.length == 1) {
        return possibleMoves[0];
    }

    // 1. check if computer could win in next move
    log(`Checking if ${computerLetter} could win in next move`);
    for (let space of possibleMoves) {
        if(checkIfPlayerCouldWin(board, computerLetter, space)) {
            log(`Occupied - ${space}`);
            return space;
        }
    }
    
    // 2. check if a player could win in next move, so block the move
    log(`Checking if ${playerLetter} could win in next move`);
    for (let space of possibleMoves) {
        if(checkIfPlayerCouldWin(board, playerLetter, space)) {
            log(`Occupied - ${space}`);
            return space;
        }
    }

    // 3. Try to take corners
    log(`Checking to occupy corners`);
    const corners = [0, 2, 6, 8];
    const possibleCorners = possibleMoves.filter((place) => corners.includes(place));
    if (possibleCorners.length) {
        const randomIndex = Math.floor(Math.random() * possibleCorners.length);
        log(`Occupied - ${possibleCorners[randomIndex]}`);
        return possibleCorners[randomIndex];
    }

    // 4. Try to take the center
    log(`Checking to occupy center`);
    const center = 4;
    if(possibleMoves.includes(center)) {
        log(`Occupied center - ${center}`);
        return center;
    }

    // 5. Take remaining other places 2,4,6,8
    log(`Checking to occupy other spaces`);
    const otherSpaces = [1, 3, 5, 7];
    const possibleOtherSpaces = possibleMoves.filter((space) => otherSpaces.includes(space))
    if (possibleOtherSpaces.length) {
        const randomIndex = Math.floor(Math.random() * possibleOtherSpaces.length)
        log(`Occupied - ${possibleOtherSpaces[randomIndex]}`);
        return possibleOtherSpaces[randomIndex];
    }

    log(`No space to occupy`);
    return;
}

module.exports.computerMove = computerMove;
module.exports.verifyBoard = verifyBoard;
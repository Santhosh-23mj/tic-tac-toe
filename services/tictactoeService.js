function verifyBoard(board) {
    const players = [1, 2];
    const result = {
        winner: null,
        board: board,
        status: null
    }

    for (let player of players) {
        if (checkIfRowWin(board, player) || checkIfColWin(board, player) || checkIfDiagonalWin(board, player)) {
            result.winner = player;
            break;
        }
    }

    if (!result.winner) {
        result.status = checkIfPossibleMovePresent(board) ? null : "TIE";
    }

    return result;
}

function checkIfRowWin(board, player) {
    let playerWon = false;

    for (const row of board) {
        const ifPlayerWon = row.find((elem) => elem != player);

        if (!ifPlayerWon && ifPlayerWon != 0) {
            playerWon = true;
            break;
        }
    }

    return playerWon;
}

function checkIfColWin(board, player) {
    let playerWon;

    for (let i = 0; i < board.length; i++) {
        let row = board[i];
        playerWon = true;

        for (let j = 0; j < row.length; j++) {
            if (board[j][i] != player) {
                playerWon = false;
                break;
            }
        }

        if (playerWon) {
            return playerWon;
        }
    }

    return playerWon;
}

function checkIfDiagonalWin(board, player) {
    let playerWon;
    for (let i = 0; i < board.length; i++) {
        playerWon = true;
        if (board[i][i] != player) {
            playerWon = false;
            break;
        }
    }

    if (playerWon) {
        return playerWon;
    }

    playerWon = true;
    for (let i = board.length - 1; i >= 0; i--) {
        if (board[i][i] != player) {
            playerWon = false;
            break;
        }
    }

    return playerWon;
}

function checkIfPossibleMovePresent(board) {
    let movePresent = false;

    for (let row of board) {
        if (row.includes(0)) {
            movePresent = true;
            break;
        }
    }

    return movePresent;
}

function isSpaceFree(board, row, column) {
    return board[row][column] == 0 ? true : false;
}

function computerMove(board, computerLetter) {
    let playerLetter = computerLetter == 1 ? 2 : 1;
    // 1. check if computer could win in next move
    // 2. check if a player could win in next move, so block the move
    // 3. Try to take corners
    // 4. Try to take the center
    // 5. Take the places 2,4,6,8

    for (let i = 0; i < board.length; i++) {
        let row = board[i];
        for (let j = 0; j < row.length; j++) {
            if (isSpaceFree(board, row, col)) {
                board[i][j] = computerLetter;
                let result = verifyBoard(board);
                if (result.winner == computerLetter) {
                    return result;
                }
            }
        }
    }    
}

module.exports.verifyBoard = verifyBoard;
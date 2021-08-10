const io = require("../app").io;
const randomString = require("randomstring");

const log = require("./logService").log;
const tictactoeService = require("./tictactoeGameService");

const socketConstants = require("../constants.json").sockets;
const socketStatus = socketConstants.status;

const gameConstants = require("../constants.json").games;
const gameStatus = gameConstants.status;
const gameLetters = gameConstants.sign;

const COMPUTER_ID_LENGTH = require("../constants.json").COMPUTER_ID_LENGTH;
const GAME_ID_LENGTH = require("../constants.json").GAME_ID_LENGTH;

let players = {};
let sockets = {};
let games = {};

io.on("connection", (client) => {
    log(`Client connected - ${client.id}`, "info");

    const isRegistrationSuccessful = registerClient(client.id);
    log(`Client registration status for ${client.id} - ${isRegistrationSuccessful}`, "info");
    client.emit("clientRegistration", { registered: isRegistrationSuccessful });

    client.on("vsPlayer", (gameId) => {
        log(`Player ${client.id} wish to play vs another player`);

        // if matchId is supplied join the player to that game
        if (gameId) {
            if (!games[gameId]) {
                log(`No game with specified ID found`);

                const error = { error: true, message: "No Match found" };
                handleError("vsPlayerResponse", error, client);
            }

            log(`Found a valid game for the Game ID - ${gameId}`, "info");

            twoPlayersPlayingStatusUpdates(client.id, gameId);
            createRoomForTwoPlayersAndStart(gameId);
        } else {
            log(`GameId not supplied trying to match with existing players`);

            let playerMatched = matchPlayersAndStartGame(client.id);
    
            // if no games are present create a new game and wait
            if (!playerMatched) {
                log(`No matching players found - Creating a new game`, "info");
                createGame(client.id);
            }
    
        }
    });

    client.on("vsComputer", () => {
        log(`Player ${client.id} wish to play vs computer`);

        const player1Id = client.id;
        const computerId = getComputerId();
        const isRegistrationSuccessful = registerClient(computerId);
        log(`Registered computer as a user - ${computerId}`, "info");

        if (isRegistrationSuccessful) {
            const gameId = createGame(player1Id);
            twoPlayersPlayingStatusUpdates(computerId, gameId);

            log(`Starting game with computer - ${computerId}`, "info");

            io.sockets.sockets.get(player1Id).join(gameId);
            io.to(gameId).emit("gameStarted", {
                status: true,
                gameId: gameId,
                gameData: games[gameId],
            });
        }
    });

    client.on("markBoard", (gameDataFromClient) => {
        log(`Player marked - ${JSON.stringify(gameDataFromClient)}`);

        const gameId = gameDataFromClient.gameId;
        const markPosition = gameDataFromClient.position;

        const gameDataOnServer = games[gameId];
        const player1Id = gameDataOnServer.player1;
        const player2Id = gameDataOnServer.player2;
        const markingPlayer = gameDataOnServer.turn;
        const markingPlayerLetter =
            markingPlayer == player1Id
                ? gameDataOnServer[player1Id].letter
                : gameDataOnServer[player2Id].letter;

        log(`Marking the board ${games[gameId].board} - ${markPosition}`);
        games[gameId].board[markPosition] = markingPlayerLetter;

        let result = tictactoeService.verifyBoard(games[gameId].board);
        log(`Board evaluated ${games[gameId].board} - ${JSON.stringify(result)}`);

        log(`Checking if the opponent is computer`)
        const computerPlayer = checkIfOpponentComputer(gameDataFromClient.gameId);

        if (computerPlayer) {
            log(`Opponent is computer - ${computerPlayer} - Making a move`);

            const computerPlayerLetter = games[gameId][computerPlayer].letter;
            const computerMove = tictactoeService.computerMove(games[gameId].board, computerPlayerLetter);

            games[gameId].board[computerMove] = computerPlayerLetter;
            log(`Computer made a move - ${computerMove} - ${games[gameId].board}`);

            result = tictactoeService.verifyBoard(games[gameId].board);
            log(`Board evaluated ${games[gameId].board} - ${JSON.stringify(result)}`);
        }

        if (!result.status && !result.winner) {
            log(`Match continues - swapping turn - ${games[gameId].turn}`, "info");

            games[gameId].turn =
                markingPlayerLetter == gameDataOnServer[player1Id].letter && !computerPlayer
                    ? player2Id
                    : player1Id;

            io.to(gameId).emit("markBoardResponse", games[gameId]);
        }

        if (result.status || result.winner) {
            log(`Match completed - ${JSON.stringify(result)}`, "info");

            if (result.status == gameStatus.TIE) {
                log(`It is a tie - ${JSON.stringify(result)}`);

                games[gameId].status = gameStatus.TIE;

                players[player1Id].tie++;
                players[player2Id].tie++;
            } else if (result.winner) {
                log(`Game won by player - ${result.winner}`, "info");

                const winningPlayerId =
                    result.winner == games[gameId][player1Id].letter ? player1Id : player2Id;

                games[gameId].status = gameStatus.WON;
                games[gameId].winner = winningPlayerId;

                players[winningPlayerId].won++;
            }
            let gameSleepTime = 5;

            io.to(gameId).emit("markBoardResponse", games[gameId]);
            io.to(gameId).emit("startingNewGame", gameSleepTime);
            log(`Response sent - starting new game - ${player1Id} - ${player2Id}`);

            let gameSleepInterval = setInterval(() => {
                gameSleepTime--;
                io.to(gameId).emit("gameSleepInterval", gameSleepTime);
                if (!gameSleepTime) {
                    clearInterval(gameSleepInterval);

                    io.sockets.sockets.get(player1Id).leave(gameId);
                    io.sockets.sockets.get(player2Id).leave(gameId);
                    delete games[gameId];
                    log(`Removed players from existing game - ${gameId}`);

                    const newGameId = createGame(player2Id); // player2 gets to start the new game
                    twoPlayersPlayingStatusUpdates(player1Id, newGameId);
                    createRoomForTwoPlayersAndStart(newGameId);

                    log(`Next game started - ${newGameId}`, "info");
                }
            }, 1000);
        }
    });

    client.on("disconnect", () => {
        log(`Player - ${client.id} wishes to get disconnected`);

        const socketId = client.id;

        if (sockets[socketId]) {
            log(`Found the players socketId - ${socketId}`);

            if (sockets[socketId].status == socketStatus.PLAYING) {
                log(`The player is in a match - ${socketId}`);

                io.to(sockets[socketId].gameId).emit("opponentLeft", {});

                const gameId = sockets[socketId].gameId;
                const player1 = games[gameId].player1;
                const player2 = games[gameId].player2;
                const stayingPlayer = socketId == player1 ? player2 : player1;

                players[player1].played--;
                players[player2].played--;

                const computerPlayer = checkIfOpponentComputer(gameId);
                if (computerPlayer && (computerPlayer ==  stayingPlayer)) {
                    delete players[computerPlayer];
                    delete sockets[computerPlayer];
                } else {
                    io.sockets.sockets.get(stayingPlayer).leave(gameId);
                    log(`Removed the stayingPlayer from the game - ${gameId}`);

                    sockets[stayingPlayer].status = socketStatus.WAITING;
                    sockets[stayingPlayer].gameId = null;
    
                    log(`Matching waiting player - ${stayingPlayer}`);
    
                    let playerMatched = matchPlayersAndStartGame(stayingPlayer);
    
                    if (!playerMatched) {
                        log(`No match found creating a new game for - ${stayingPlayer}`);
    
                        createGame(stayingPlayer);
                    }
                }

                delete games[gameId];
            }
        }

        delete players[socketId];
        delete sockets[socketId];
        log(`Deleted player and socket from memory - ${socketId}`);
    });
});

//
// Registering the clients socket connection on server;
//
function registerClient(clientId) {
    log(`Checking if ${clientId} already has a socket connection`);
    if (Object.keys(sockets).includes(clientId)) {
        log(`${clientId} already has a socket connection`);
        return true;
    }

    log(`Checking if ${clientId} already has a player registration`);
    if (Object.keys(players).includes(clientId)) {
        log(`${clientId} already has a player registration`);
        return true;
    }

    sockets[clientId] = getNewSocketObject(clientId);
    log(`New socket registration for ${clientId} created`);

    players[clientId] = getNewPlayerObject(clientId);
    log(`New player registration for ${clientId} created`);

    return true;
}

//
// Join two players using Match ID
//
function twoPlayersPlayingStatusUpdates(socketId, gameId) {
    log(`Joining players using GameId - ${gameId}`, "info");

    const player1SocketId = games[gameId].player1;
    const player2SocketId = socketId;

    log(`Updating socket status for players - ${player1SocketId} - ${player2SocketId}`);
    sockets[player1SocketId].status = socketStatus.PLAYING;
    sockets[player2SocketId].status = socketStatus.PLAYING;
    sockets[player2SocketId].gameId = gameId; // Player1 is already in the game

    log(`Updating player status - ${player1SocketId} - ${player2SocketId}`);
    players[player1SocketId].played++;
    players[player2SocketId].played++;

    log(`Updating game status - ${gameId} - ${player1SocketId} - ${player2SocketId}`);
    games[gameId].player2 = player2SocketId;
    games[gameId][player2SocketId] = players[player2SocketId];
    games[gameId][player2SocketId].letter = gameLetters.O;
}

//
// create room and join the two matched players to a room
//
function createRoomForTwoPlayersAndStart(gameId) {
    const player1Id = games[gameId].player1;
    const player2Id = games[gameId].player2;

    io.sockets.sockets.get(player1Id).join(gameId);
    io.sockets.sockets.get(player2Id).join(gameId);

    log(`Joined players ${player1Id}, ${player2Id} to ${gameId}`, "info");

    io.to(gameId).emit("gameStarted", { status: true, gameId: gameId, gameData: games[gameId] });
}

//
// Match players and start the game
//
function matchPlayersAndStartGame(socketId) {
    let playerMatched = false;

    for (let socket in sockets) {
        if (sockets[socket].status == socketStatus.MATCHING) {
            log(`Found a matching player - Creating game with - ${socket}`);

            playerMatched = true;
            const gameId = sockets[socket].gameId;
            twoPlayersPlayingStatusUpdates(socketId, gameId);
            createRoomForTwoPlayersAndStart(gameId);

            log(`Player matched and joined game - ${gameId}`);
            break;
        }
    }

    return playerMatched;
}

//
// Create a game and update socket status for a player
//
function createGame(socketId) {
    const gameId = getGameId();
    log(`Game Id Created - ${gameId}`, "info");

    games[gameId] = getNewGameObject(gameId, socketId);
    log(`Game registered ${gameId}- Waiting for opponent to join`);

    sockets[socketId].status = socketStatus.MATCHING;
    sockets[socketId].gameId = gameId;
    log(`Socket status updated - Other players can join my game ${gameId} now`);

    return gameId;
}

//
// check which player is computer
//
function checkIfOpponentComputer(gameId) {
    const player1 = games[gameId].player1;
    const player2 = games[gameId].player2;

    if (player1.match(/COMPUTER\-.{11}/)) {
        return player1;
    }

    if (player2.match(/COMPUTER\-.{11}/)) {
        return player2;
    }

    return false;
}

// create unique identifier for COMPUTER player
function getComputerId() {
    return "COMPUTER-" + randomString.generate(COMPUTER_ID_LENGTH);
}

// Create a 5 character GameId for the new game
function getGameId() {
    return randomString.generate(GAME_ID_LENGTH);
}

// return a new game object
function getNewGameObject(gameId, socketId) {
    let player1Info = players[socketId];
    player1Info.letter = gameLetters.X;

    let newGameObject = {
        gameId: gameId,
        player1: socketId,
        turn: socketId,
        status: gameStatus.ONGOING,
        winner: null,
        board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    newGameObject[socketId] = player1Info;
    return newGameObject;
}

// return a new Player object
function getNewPlayerObject(socketId) {
    return {
        clientId: socketId,
        played: 0,
        won: 0,
        tie: 0,
    };
}

// return a new socket object
function getNewSocketObject(socketId) {
    return {
        clientId: socketId,
        status: socketStatus.WAITING,
        gameId: null,
    };
}

// Error Handler
function handleError(eventName, err, client) {
    log(`${err.message}`, "error");

    client.emit(eventName, err);
}
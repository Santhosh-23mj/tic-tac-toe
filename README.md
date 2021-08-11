# tic-tac-toe

A Nodejs backend to a popular game, Tic Tac Toe.

It is made using the Socket.io which uses websockets to deal with real-time
interactive communication between server and client.


A player could join a game using the browser. 
    - First the player chooses New Game or Join Game
    - If New Game is chosen, the player is matched with existing players
        else new game is created and the player waits.
    - If Join a game is chosen the player provides a 5 character GameId, which
        matches the player to an existing game.
    - The player has an option to play against a player or computer.
    - If computer is chosen, the program plays the game with the player.

## To integrate with frontend

#### Events emitted from the server

- *clientRegistration* - once the client successfully connects to the server.
- *vsPlayerResponse* - once the gameId supplied by the player doesn't exist.
- *gameStarted* - emitted to a room of two players with an object of gameStatus, gameId and gameData 
- *markBoardResponse* - emitted to a room of two players with an object of gameData
- *startingNewGame* - emitted to a room when a game is won / draw with amount of time to wait
- *gameSleepInterval* - emitted to a room when new game is in process to get started with the time to wait
- *OpponentLeft* - emitted to a room when the opponent in the game gets disconnected


#### Events recieved on the server

- *vsPlayer*
    - with no params - matches a game to a waiting player or creates a new game and waits
    - with gameId - tries to join the specified gameId
- *vsComputer* - recieved to start a game with the computer
- *markboard* - received when the player marks his letter on the board
- *disconnect* - received to gracefully handle the client getting disconnected.

## The computer player

The computer player follows a simple **bruteforce** approach to find the best position to occupy.
1. Check if the computer could win in the next move, if yes go for it.
2. Check if the user could win in the next move, if yes block that move.
3. check to occupy corners
4. Check to occupy the center
5. Check to occupy the remaining edges
const express = require('express');
const router = express.Router();
const tictactoeService = require('../services/tictactoeService');

router.post('/vsComputer', (req, res) => {
    try {
        console.log("Request Recieved with body - ", req.body);

        const boardAfterPlayer = req.body.board;
        const boardAfterComputer = tictactoeService.computerMove(boardAfterPlayer);

        console.log("Sending the response - ", boardAfterComputer);
        res.send(boardAfterComputer);
    } 
    catch (err) {
        console.log(err);

        const errMessage = err.message || "Some unknown error occurred";
        const statusCode = err.statusCode || 500;
        res.status(statusCode).send({error: errMessage});
    }
})

router.post('/vsPlayer', (req, res) => {
    try {
        console.log("Request Recieved with body - ", req.body);
        
        const boardAfterPlayer = req.body.board;
        const result = tictactoeService.verifyBoard(boardAfterPlayer);

        console.log("Sending the response - ", result);

        res.send(result);
    } 
    catch (err) {
        console.log(err);

        const errMessage = err.message || "Some unknown error occurred";
        const statusCode = err.statusCode || 500;
        res.status(statusCode).send(errMessage);
    }
})


module.exports = router;

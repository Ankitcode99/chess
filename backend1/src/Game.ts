import { WebSocket } from "ws";
import { v4 as uuidv4 } from 'uuid';
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";

export class Game {
    private id: string;
    private player1: WebSocket;
    private player2: WebSocket;
    private startTime: Date;
    private board: Chess;
 
    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;
        this.id = uuidv4(); // a number in the range 0 to 10^7;
        this.startTime = new Date();
        this.board = new Chess();

        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            payload:{
                color: "white"
            }
        }))
        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            payload:{
                color: "black"
            }
        }))
    }

    // GET ID
    public getId(): string {
        return this.id;
    }

    // GET PLAYERS
    public getPlayers(): WebSocket[] {
        return [this.player1, this.player2];
    }

    public makeMove(move: {from: string, to: string}, currentUser: WebSocket) { 
        // Peform validation of move
        /**
         * 1. Was it the chance of currentUser?
         * 2. Is the move valid? (check using zod)
         *   - Yes, update the board 
         * 
         * 3. Check if game is over
         *   - Yes, end the game
         *   - No, send the updated board to both users
         */
        
        if(this.board.history().length % 2 == 0 && currentUser !== this.player1) {
            return;
        }
        if(this.board.history().length % 2 == 1 && currentUser !== this.player2) {
            return;
        }

        console.log("Got Move - ", move);

        try {
            this.board.move(move);            
        } catch (error: any) {
            console.error("Error - ", error.message);
            return
        }

        if(this.board.isGameOver()) {
            this.player1.emit(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: this.board.turn() == "w" ? "black" : "white" // agli turn agar white ki hai.. that means last turn black ne chala and he won.
                }
            }))
            this.player2.emit(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: this.board.turn() == "w" ? "black" : "white" // agli turn agar white ki hai.. that means last turn black ne chala and he won.
                }
            }))
            return;
        }

        console.log("Total moves - ", this.board.history().length);

        if(this.board.history().length % 2 == 1) {
            console.log("Sending Move of P1 to P2");
            this.player2.send(JSON.stringify({
                type: MOVE,
                payload: move
            }))
        } else {
            console.log("Sending Move of P2 to P1");
            this.player1.send(JSON.stringify({
                type: MOVE,
                payload: move
            }))
        }
    }
}
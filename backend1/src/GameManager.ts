import { WebSocket } from "ws";
import { Game } from "./Game";
import { INIT_GAME, MOVE } from "./messages";

// interface Game {
//     id: string;
//     name: string;
//     player1: WebSocket;
//     player2: WebSocket;
//     status: string;
// }

export class GameManager {
    private static instance: GameManager;
    private games: Map<string, Game>;
    private waitingUser: WebSocket|null = null;
    private users: WebSocket[] = [];
    private userToGameId: Map<WebSocket, string> = new Map();

    private constructor() {
        this.games = new Map();
        this.waitingUser = null;
        this.users = [];
    }
    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    public addUser(user: WebSocket) {
        this.users.push(user);
        console.log("User Added!")
        this.addHandler(user);
    }

    public removeUser(user: WebSocket) {
        this.users = this.users.filter(u => u !== user);

    }

    private addHandler(user: WebSocket) {
        user.on("message", (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log("Got Message - ", message);

                if (message.type === INIT_GAME) {
                    if(this.waitingUser) {
                        // Start game between waiting user and current user
                        const newGame = new Game(this.waitingUser, user);

                        this.games.set(newGame.getId(), newGame);

                        this.userToGameId.set(user, newGame.getId());
                        this.userToGameId.set(this.waitingUser, newGame.getId());

                        this.waitingUser = null;
                    } else {
                        this.waitingUser = user;
                    }
                }

                if(message.type === MOVE) {
                    if(this.userToGameId.get(user)) {
                        const game = this.games.get(this.userToGameId.get(user)!);
                        if(game) {
                            game.makeMove(message.move, user);
                        }
                    } 
                }
            } catch (error:any) {
                console.error(error.message);
            }
            
        })
    }
}
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';

const gameManager = GameManager.getInstance();
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {

    gameManager.addUser(ws);
    ws.on("disconnect", ()=>{
        gameManager.removeUser(ws);
    })
});
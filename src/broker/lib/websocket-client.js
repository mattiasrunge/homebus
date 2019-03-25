"use strict";

const { v4: uuid } = require("uuid");

class WebSocketClient {
    constructor(ws, name) {
        this.ws = ws;
        this.id = name || uuid();
        this.persistant = !!name;
    }

    send(message) {
        return new Promise((resolve, reject) => {
            this.ws.send(JSON.stringify(message), (error) => {
                if (error) {
                    return reject(error);
                }

                resolve();
            });
        });
    }
}

module.exports = WebSocketClient;

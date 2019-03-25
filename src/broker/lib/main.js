"use strict";

const Server = require("./server");
const Queues = require("./queues");

class Main {
    constructor(opts) {
        this.opts = opts;
        this.server = new Server(opts);
        this.queues = new Queues(opts);
    }

    async start() {
        this.server.on("message", this.queues.onMessage);
        this.server.on("clientConnected", this.queues.onClientConnected);
        this.server.on("clientDisconnected", this.queues.onClientDisconnected);

        await this.queues.start();
        await this.server.start();
    }

    async dispose() {
        await this.server.dispose();
        await this.queues.dispose();
    }
}

module.exports = Main;

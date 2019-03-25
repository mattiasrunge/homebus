"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const Queue = require("./queue");

class Queues {
    constructor(opts) {
        this.opts = opts;
        this.queues = {};

        assert(this.opts.queuesPath, "A queuesPath must be specified for the persistant queues");

        this.onMessage = this.onMessage.bind(this);
        this.onClientConnected = this.onClientConnected.bind(this);
        this.onClientDisconnected = this.onClientDisconnected.bind(this);
    }

    async start() {
        this._loadQueues();
    }

    async _loadQueues() {
        const names = await fs.readdir(this.opts.queuesPath);

        for (const name of names) {
            this.queues[name] = new Queue(this.opts.queuesPath, name, true);
        }
    }

    async onMessage(message) {
        for (const queue of Object.values(this.queues)) {
            await queue.onMessage(message);
        }
    }

    onClientConnected(client) {
        this.queues[client.id] = new Queue(this.opts.queuesPath, client.id, client.persistant);

        this.queues[client.id].setClient(client);
    }

    onClientDisconnected(client) {
        const queue = this.queues[client.id];

        if (queue) {
            queue.setClient(false);

            if (!queue.persistant) {
                delete this.queues[client.id];
            }
        }
    }

    async dispose() {
        for (const queue of Object.values(this.queues)) {
            queue.setClient(false);
        }

        this.queues = {};
    }
}

module.exports = Queues;

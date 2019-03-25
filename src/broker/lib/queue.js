"use strict";

const path = require("path");
const fs = require("fs-extra");
const log = require("./log");
const synchronize = require("./synchronize");

class Queue {
    constructor(queuesPath, name, persistant) {
        this.queuePath = path.join(queuesPath, name);
        this.id = name;
        this.persistant = persistant;

        synchronize(this, "onMessage");
        synchronize(this, "_sendMessages");
    }

    async onMessage(message) {
        if (this.persistant) {
            const files = await this._getMessages();

            if (files.length === 0 && this.client) {
                return await this.client.send(message);
            }

            const filename = path.join(this.queuePath, `${message.head.time}_${message.head.id}.json`);

            await fs.outputJson(filename, message);

            process.nextTick(() => this._sendMessages());
        } else {
            await this.client.send(message);
        }
    }

    setClient(client) {
        // TODO: Handle if client is already set, possibly overwrite and terminate existing
        this.client = client;

        process.nextTick(() => this._sendMessages());
    }

    async _getMessages() {
        await fs.ensureDir(this.queuePath);

        return fs.readdir(this.queuePath);
    }

    async _sendMessages() {
        if (!this.client || !this.persistant) {
            return;
        }

        const files = await this._getMessages();

        if (files.length === 0) {
            return;
        }

        files.sort();

        const filename = path.join(this.queuePath, files[0]);
        const message = await fs.readJson(filename);

        try {
            this.client.send(message);
        } catch (error) {
            return log.error("Failed to send queued message", error, message);
        }

        await fs.remove(filename);

        await this._sendMessages();
    }
}

module.exports = Queue;

"use strict";

const assert = require("assert");
const axios = require("axios");
const WebSocket = require("ws");
const { v4: uuid } = require("uuid");

class Client {
    constructor(uri) {
        const { url, token } = this._parseUri(uri);

        this.url = url;
        this.headers = {
            "homebus-token": token
        };

        this.axios = axios.create({
            headers: this.headers
        });
    }

    _parseUri(uri) {
        const url = new URL(uri);
        const token = url.username;

        url.username = "";

        return {
            url: url.toString(),
            token
        };
    }

    async sendRaw(message) {
        const response = await this.axios.post(this.url, message);

        assert(response.status === 200, response.data);
    }

    async send(type, data, reactionTo) {
        const message = {
            head: {
                id: uuid(),
                version: 1,
                time: new Date().toISOString(),
                type,
                reactionTo
            },
            data
        };

        await this.sendRaw(message);

        return message.head.id;
    }

    async registerListener(fn) {
        const ws = new WebSocket(this.url, {
            headers: this.headers
        });

        ws.on("message", (message) => fn(JSON.parse(message)));
        ws.on("close", () => fn(false));

        await new Promise((resolve) => ws.on("open", resolve));

        return ws;
    }
}

module.exports = Client;

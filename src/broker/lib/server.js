"use strict";

const assert = require("assert");
const http = require("http");
const WebSocket = require("ws");
const Koa = require("koa");
const koaJson = require("koa-json");
const cors = require("koa2-cors");
const route = require("koa-route");
const koaBody = require("koa-body");
const compress = require("koa-compress");
const log = require("./log");
const WebSocketClient = require("./websocket-client");
const Emitter = require("./emitter");

const HEADER_TOKEN_NAME = "homebus-token";

class Server extends Emitter {
    constructor(opts) {
        super();

        this.opts = opts || {};
        this.opts.tokens = this.opts.tokens || [];

        assert(this.opts.port, "A port must be specified for the broker interface");
        assert(this.opts.name, "A name must be specified for the broker");

        this._onRequest = this._onRequest.bind(this);
        this._onClient = this._onClient.bind(this);
        this._onVerifyClient = this._onVerifyClient.bind(this);
    }

    async start() {
        this.server = http.createServer();
        this.wss = new WebSocket.Server({
            server: this.server,
            verifyClient: this._onVerifyClient
        });

        const app = new Koa();
        app.use(compress());
        app.use(koaBody({ multipart: true }));
        app.use(cors());
        app.use(koaJson());

        app.use(route.post("*", this._onRequest));

        this.server.on("request", app.callback());
        this.wss.on("connection", this._onClient);

        this.server.listen(this.opts.port);
    }

    async _onRequest(ctx) {
        const headers = ctx.headers;
        const body = ctx.request.body;

        if (!this._verifyToken(headers[HEADER_TOKEN_NAME])) {
            ctx.body = "Invalid or missing token header";
            ctx.status = 401;
            ctx.type = "plain/text";

            return;
        }

        try {
            await this._processMessage(body);

            ctx.body = "Message accepted";
            ctx.status = 200;
            ctx.type = "plain/text";
        } catch (error) {
            log.error("Failed to handle request", error, body);

            ctx.body = "Failed to accept message";
            ctx.status = error.status || 500;
            ctx.type = "plain/text";
        }
    }

    async _processMessage(message) {
        message.brokers = message.brokers || [];

        message.brokers.push({
            time: new Date().toISOString(),
            name: this.opts.name
        });

        await this.emit("message", message);
    }

    _onClient(ws, request) {
        const queueName = request.url.replace(/\//g, "");
        const client = new WebSocketClient(ws, queueName);

        this.emit("clientConnected", client);

        ws.on("close", () => {
            this.emit("clientDisconnected", client);
        });

        // TODO: Setup heartbeat
    }

    _onVerifyClient(info, callback) {
        const headers = info.req.headers;

        if (!this._verifyToken(headers[HEADER_TOKEN_NAME])) {
            callback && callback(false, 401, "Invalid or missing token header");

            return false;
        }

        callback && callback(true);

        return true;
    }

    _verifyToken(token) {
        return this.opts.tokens.length === 0 || this.opts.tokens.includes(token);
    }

    async dispose() {
        this.wss && this.wss.close();
        this.server && this.server.close();

        delete this.wss;
        delete this.server;

        this.removeAllListeners();
    }
}

module.exports = Server;

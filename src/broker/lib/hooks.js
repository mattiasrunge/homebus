"use strict";

const errno = require("errno");
const log = require("./log");

class Hooks {
    constructor() {
        this.disposerFn = async () => {};

        this.onCrash = this.onCrash.bind(this);
        this.onPromiseError = this.onPromiseError.bind(this);
        this.onShutdown = this.onShutdown.bind(this);
    }

    setup(disposerFn) {
        this.disposerFn = disposerFn;

        process.on("SIGINT", this.onShutdown);
        process.on("SIGTERM", this.onShutdown);
        process.on("uncaughtException", this.onCrash);
        process.on("unhandledRejection", this.onPromiseError);
    }

    onCrash(error) {
        log.error(`Crashed, reason: ${error.toString().replace("Error: ", "")}`);
        log.error("Error:", error);

        this._exit(error, 254);
    }

    onPromiseError(error, promise) {
        log.error("Crashed, reason: unhandled promise rejection");
        log.error("Promise: ", promise);
        log.error("Error:", error);

        this._exit(error, 254);
    }

    async onShutdown() {
        await this.disposerFn();
    }

    _exit(error, code) {
        if (error.code && typeof error.code === "string" && errno.code[error.code]) {
            // eslint-disable-next-line no-process-exit
            process.exit(errno.code[error.code].errno || code);
        } else if (error.code && typeof error.code !== "string") {
            // eslint-disable-next-line no-process-exit
            process.exit(error.code || code);
        } else {
            // eslint-disable-next-line no-process-exit
            process.exit(code);
        }
    }
}

module.exports = Hooks;

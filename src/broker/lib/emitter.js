"use strict";

const EventEmitter = require("events");

class Emitter extends EventEmitter {
    async emit(eventName, ...args) {
        const listeners = this.listeners(eventName);

        for (const listener of listeners) {
            await Promise.resolve(listener(...args));
        }

        return this;
    }

    once(eventName, listener) {
        const wrapped = async (...args) => {
            await Promise.resolve(listener(...args));
            this.removeListener(eventName, wrapped);
        };

        this.on(eventName, wrapped);
    }
}

module.exports = Emitter;

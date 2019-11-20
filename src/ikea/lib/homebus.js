"use strict";

const EventEmitter = require("events");
const Client = require("@homebus/client");

const LIGHT_GET_STATE = "light-get-state";
const LIGHT_SET_STATE = "light-set-state"
const LIGHT_STATE = "light-state";

class Homebus extends EventEmitter {
    async start(uri) {
        this.client = new Client(uri);

        await this.client.registerListener((message) => {
            console.log("Message received:");
            console.dir(message);

            if (message.head.type === LIGHT_GET_STATE) {
                this.emit("light-get-state", {
                    messageId: message.head.id,
                    id: message.data.id
                });
            } else if (message.head.type === LIGHT_SET_STATE) {
                this.emit("light-get-state", {
                    messageId: message.head.id,
                    id: message.data.id,
                    state: message.data.state,
                    brightness: message.data.brightness,
                    color: message.data.color
                });
            }
        });
    }

    async notifyLightState(id, state, brightness, color, meta, messageId) {
        await this.client.send(LIGHT_STATE, {
            id,
            state,
            brightness,
            color,
            meta
        }, messageId);

    }

    async dispose() {
        this.removeAllListeners();
    }
}

module.exports = Homebus;

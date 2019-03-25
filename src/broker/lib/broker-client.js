"use strict";

const HomeBusClient = require("@homebus/client");

class BrokerClient {
    constructor(uri, name) {
        this.client = new HomeBusClient(uri);
        this.id = name;
        this.persistant = true;
    }

    send(message) {
        // Prevent loops, if this broker has already seen the message
        // don't send it to it again.
        if (message.brokers.some(({ name }) => name === this.id)) {
            return;
        }

        return this.client.sendRaw(message);
    }
}

module.exports = BrokerClient;

"use strict";

const assert = require("assert");
const EventEmitter = require("events");
const { TradfriClient, discoverGateway, AccessoryTypes } = require("node-tradfri-client");

class Gateway extends EventEmitter {
    constructor() {
        super();

        this.lights = {};
        this.pending = {};
    }

    async start(securityKey) {
        await this._connect(securityKey);

        await this.tradfri.observeDevices();
    }

    broadcastState(id, messageId) {
        const device = this.lights[id];

        assert(device, `No device with id ${id} found`);

        // TODO: messageId will be wrong, we set brightness, color and state and will get three messages if all change values...
        messageId = messageId || this.pending[id];
        delete this.pending[id];

        this.emit("light-state", {
            messageId,
            id,
            state: device.lightList[0].onOff ? "on" : "off",
            brightness: device.lightList[0].dimmer,
            color: device.lightList[0].color,
            meta: {
                type: device.name
            }
        });
    }

    _registerEventHandlers() {
        this.tradfri.on("device updated", (device) => {
            try {
                if (device.type === AccessoryTypes.lightbulb) {
                    this.lights[device.instanceId] = device;

                    this.broadcastState(device.instanceId);
                }
            } catch (error) {
                console.error(error);
            }
        });

        this.tradfri.on("device removed", (instanceId) => {
            delete this.lights[instanceId];

            // TODO: Broadcast
        });

        this.tradfri.on("group updated", (group) => {
            console.log("group updated");
            console.dir(group);
        });

        this.tradfri.on("group removed", (instanceId) => {
            console.log("group removed", instanceId);
        });
    }

    async _connect(securityKey) {
        const gwinfo = await discoverGateway();

        assert(gwinfo, "Could not find a IKEA gateway");

	    this.tradfri = new TradfriClient(gwinfo.addresses[0], {
            watchConnection: true
        });

        this._registerEventHandlers();

	    const { identity, psk } = await this.tradfri.authenticate(securityKey);

        await this.tradfri.connect(identity, psk);

        await this.tradfri.observeDevices();
    }

    async setState(id, state, brightness, color, messageId) {
        this.pending[id] = messageId; // TODO: List?

        const light = this.lights[id].lightList[0];

        if (typeof brightness !== "undefined") {
            await light.setBrightness(brightness);
        }

        if (typeof color !== "undefined") {
            await light.setColor(color);
        }

        if (typeof state !== "undefined") {
            if (state === "on") {
                await light.turnOn();
            } else if (state === "off") {
                await light.turnOff();
            } else if (state === "toggle") {
                await light.toggle();
            }
        }
    }

    async dispose() {
        this.tradfri.destroy();
    }
}

module.exports = Gateway;

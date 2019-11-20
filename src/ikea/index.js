"use strict";

const yargs = require("yargs");
const Homebus = require("./lib/homebus");
const Gateway = require("./lib/gateway");

const argv = yargs
.usage("Usage: $0 <command> [options]")
.alias("u", "uri")
.nargs("u", 1)
.describe("u", "URI to HomeBus broker")
.alias("s", "securitykey")
.nargs("s", 1)
.describe("s", "IKEA Gateway security key")
.demandOption([ "u", "s" ])
.help("h")
.alias("h", "help")
.argv;

const start = async () => {
    const homebus = new Homebus();
    const gateway = new Gateway();

    homebus.on("light-get-state", ({ messageId, id }) => {
        gateway.broadcastState(id, messageId);
    });

    homebus.on("light-set-state", ({ messageId, id, state, brightness, color }) => {
        gateway.setState(id, state, brightness, color, messageId);
    });

    gateway.on("light-state", ({ messageId, id, state, brightness, color, meta}) => {
        homebus.notifyLightState(id, state, brightness, color, meta, messageId);
    });

    await homebus.start(argv.uri);
    await gateway.start(argv.securitykey);
};

start();

"use strict";

/* eslint-disable no-console */

const yargs = require("yargs");
const prettyjson = require("prettyjson");
const Client = require("@homebus/client");

const argv = yargs
.usage("Usage: $0 <command> [options]")
.alias("u", "uri")
.nargs("u", 1)
.describe("u", "URI to HomeBus broker")
.demandOption([ "u" ])
.help("h")
.alias("h", "help")
.argv;

const start = async () => {
    const client = new Client(argv.uri);

    await client.registerListener((message) => {
        console.log("Message received:");
        console.log(prettyjson.render(message));
    });
};

start();

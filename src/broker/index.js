"use strict";

const fs = require("fs-extra");
const yargs = require("yargs");
const Main = require("./lib/main");
const Hooks = require("./lib/hooks");

const argv = yargs
.usage("Usage: $0 <command> [options]")
.alias("c", "config")
.nargs("c", 1)
.describe("c", "Use configuration file")
.demandOption([ "c" ])
.help("h")
.alias("h", "help")
.argv;

const hooks = new Hooks();

const start = async () => {
    const opts = await fs.readJson(argv.config);
    const main = new Main(opts);

    hooks.setup(() => main.dispose());

    await main.start();
};

start();

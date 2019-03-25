"use strict";

/* eslint-disable node/no-unpublished-require */
/* global test expect beforeAll afterAll afterEach */

const os = require("os");
const path = require("path");
const getPort = require("get-port");
const fs = require("fs-extra");
const Client = require("../client");
const Main = require("../broker/lib/main");
const Deferred = require("./deferred");

let main;
let opts;

beforeAll(async () => {
    opts = {
        name: "test",
        port: await getPort(),
        queuesPath: await fs.mkdtemp(path.join(os.tmpdir(), "homebus-"))
    };
});

test("Simple send message with no tokens", async () => {
    main = new Main(opts);
    const client = new Client(`http://localhost:${opts.port}`);

    await main.start();

    await client.send("test", {
        hello: "world"
    });
});

test("Simple send message with token", async () => {
    const token = "ABC123";
    main = new Main({
        ...opts,
        tokens: [ token ]
    });
    const client = new Client(`http://${token}@localhost:${opts.port}`);

    await main.start();

    await client.send("test", {
        hello: "world"
    });
});

test("Send message and receive it", async () => {
    const token = "ABC123";
    main = new Main({
        ...opts,
        tokens: [ token ]
    });
    const client = new Client(`http://${token}@localhost:${opts.port}`);

    await main.start();

    const resolveOn = new Deferred();

    await client.registerListener((msg) => resolveOn.resolve(msg));

    const id = await client.send("test", {
        hello: "world"
    });

    const msg = await resolveOn.promise;

    expect(msg.head.id).toEqual(id);
    expect(msg.head.type).toEqual("test");
    expect(msg.data).toEqual({
        hello: "world"
    });
    expect(msg.brokers[0].name).toEqual(opts.name);
});

test("Send message and receive it after reconnect", async () => {
    const token = "ABC123";
    main = new Main({
        ...opts,
        tokens: [ token ]
    });
    const client = new Client(`http://${token}@localhost:${opts.port}/myQueue`);

    await main.start();

    const ws = await client.registerListener(() => {});

    ws.close();

    const id = await client.send("test", {
        hello: "world"
    });

    const resolveOn = new Deferred();

    await client.registerListener((msg) => resolveOn.resolve(msg));

    const msg = await resolveOn.promise;

    expect(msg.head.id).toEqual(id);
    expect(msg.head.type).toEqual("test");
    expect(msg.data).toEqual({
        hello: "world"
    });
    expect(msg.brokers[0].name).toEqual(opts.name);
});


afterEach(async () => {
    if (main) {
        await main.dispose();
    }
});

afterAll(async () => {
    await fs.remove(opts.queuesPath);
});


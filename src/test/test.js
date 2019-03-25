"use strict";

/* eslint-disable node/no-unpublished-require */
/* global describe it expect beforeAll beforeEach afterAll afterEach */

const os = require("os");
const path = require("path");
const getPort = require("get-port");
const fs = require("fs-extra");
const Client = require("../client");
const Main = require("../broker/lib/main");
const Deferred = require("./deferred");

describe("Single broker", () => {
    let main;
    let opts;

    beforeAll(async () => {
        opts = {
            name: "test",
            port: await getPort(),
            queuesPath: await fs.mkdtemp(path.join(os.tmpdir(), "homebus-"))
        };
    });

    beforeEach(async () => {
        await fs.emptyDir(opts.queuesPath);
    });

    afterEach(async () => {
        if (main) {
            await main.dispose();
        }
    });

    afterAll(async () => {
        await fs.remove(opts.queuesPath);
    });

    it("Simple send message with no tokens", async () => {
        main = new Main(opts);
        const client = new Client(`http://localhost:${opts.port}`);

        await main.start();

        await client.send("test", {
            hello: "world"
        });
    });

    it("Simple send message with token", async () => {
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

    it("Send message and receive it", async () => {
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

    it("Send message and receive it after reconnect", async () => {
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
});

describe("Multiple brokers", () => {
    let main1;
    let main2;
    let opts1;
    let opts2;
    const token1 = "ABC123";
    const token2 = "123ABC";

    beforeAll(async () => {
        opts2 = {
            name: "test2",
            port: await getPort(),
            queuesPath: await fs.mkdtemp(path.join(os.tmpdir(), "homebus-")),
            tokens: [ token2 ]
        };

        opts1 = {
            name: "test1",
            port: await getPort(),
            queuesPath: await fs.mkdtemp(path.join(os.tmpdir(), "homebus-")),
            tokens: [ token1 ],
            remotes: {
                "test2": `http://${token2}@localhost:${opts2.port}`
            }
        };
    });

    beforeEach(async () => {
        await fs.emptyDir(opts1.queuesPath);
        await fs.emptyDir(opts2.queuesPath);
    });

    afterEach(async () => {
        if (main1) {
            await main1.dispose();
        }

        if (main2) {
            await main2.dispose();
        }
    });

    afterAll(async () => {
        await fs.remove(opts1.queuesPath);
        await fs.remove(opts2.queuesPath);
    });

    it("Send message to one broker and receive it at another", async () => {
        main1 = new Main(opts1);
        main2 = new Main(opts2);

        const client1 = new Client(`http://${token1}@localhost:${opts1.port}`);
        const client2 = new Client(`http://${token2}@localhost:${opts2.port}/myQueue`);

        await main1.start();
        await main2.start();

        const ws = await client2.registerListener(() => {});

        ws.close();

        const id = await client1.send("test", {
            hello: "world"
        });

        const resolveOn = new Deferred();

        await client2.registerListener((msg) => resolveOn.resolve(msg));

        const msg = await resolveOn.promise;

        expect(msg.head.id).toEqual(id);
        expect(msg.head.type).toEqual("test");
        expect(msg.data).toEqual({
            hello: "world"
        });
        expect(msg.brokers[0].name).toEqual(opts1.name);
        expect(msg.brokers[1].name).toEqual(opts2.name);
    });
});

"use strict";

const log = {
    info: (...args) => {
        log._print("info", ...args);
    },
    error: (...args) => {
        log._print("error", ...args);
    },
    warn: (...args) => {
        log._print("warn", ...args);
    },
    _print: (type, ...args) => {
        const params = [
            new Date().toISOString(),
            type.toUpperCase().padEnd(5),
            ...args
        ];

        if (type === "error") {
            // eslint-disable-next-line no-console
            console.error(...params);
        } else {
            // eslint-disable-next-line no-console
            console.log(...params);
        }
    }
};

module.exports = log;

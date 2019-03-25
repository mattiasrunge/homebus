"use strict";

class Deferred {
    constructor(resolveNow = false) {
        this.resolved = false;
        this.rejected = false;
        this.finished = false;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = (...args) => {
                this.rejected = false;
                this.resolved = true;
                this.finished = true;

                return resolve(...args);
            };
            this.reject = (...args) => {
                this.rejected = true;
                this.resolved = false;
                this.finished = true;

                return reject(...args);
            };
        });

        resolveNow && this.resolve();
    }
}

module.exports = Deferred;

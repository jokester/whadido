"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mutex_1 = require("./mutex");
describe("", () => {
    it("provides mutex", () => {
        const sharedRes = [];
        const mutexRes = new mutex_1.MutexResource(sharedRes);
        for (let i = 0; i < 1000; i++) {
            const current = i;
            mutexRes.queue((release, s) => {
                if (current % 2 === 0) {
                    release();
                }
                else if (current % 5 === 0) {
                    setImmediate(release);
                }
                else if (current % 111 === 0) {
                    s.push(current);
                    release();
                }
                else {
                    release();
                }
            });
        }
        return new Promise((resolve, reject) => {
            mutexRes.queue((release, s) => {
                chai_1.expect(s).deep.eq([111, 333, 777, 999]);
                release();
                resolve();
            });
        });
    });
});
//# sourceMappingURL=mutex.spec.js.map
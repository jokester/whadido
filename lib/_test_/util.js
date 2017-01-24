"use strict";
const tslib_1 = require("tslib");
const mocha_typescript_1 = require("mocha-typescript");
const chai_1 = require("chai");
const mutex_1 = require("../util/mutex");
let TestMutexResource = class TestMutexResource {
    testMutex() {
        const sharedRes = [];
        const mutexRes = new mutex_1.MutexResource(sharedRes);
        for (let i = 0; i < 1000; i++) {
            const current = i;
            mutexRes.queue((release, s) => {
                if (current % 2 === 0) {
                    release();
                }
                else if (current % 3 === 0) {
                    setTimeout(release);
                }
                else if (current % 5 === 0) {
                    // s.push(current);
                    release();
                }
                else {
                    release();
                }
            });
        }
        return new Promise((resolve, reject) => {
            mutexRes.queue((release, s) => {
                chai_1.expect(s).deep.eq([]);
                release();
                resolve();
            });
        });
    }
};
tslib_1.__decorate([
    mocha_typescript_1.test,
    mocha_typescript_1.timeout(10e3),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestMutexResource.prototype, "testMutex", null);
TestMutexResource = tslib_1.__decorate([
    mocha_typescript_1.suite
], TestMutexResource);
//# sourceMappingURL=util.js.map
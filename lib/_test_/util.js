"use strict";
const tslib_1 = require("tslib");
const mocha_typescript_1 = require("mocha-typescript");
const chai_1 = require("chai");
const mutex_1 = require("../util/mutex");
const lru_1 = require("../util/lru");
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
let TestSingleThreadedLRU = class TestSingleThreadedLRU {
    createLRU(capacity) {
        return new lru_1.SingleThreadedLRU(capacity);
    }
    toInspectable(s) {
        return s;
    }
    calcKeyCount(keys) {
        const v = {};
        for (const k of keys) {
            v[k] = 1 + (v[k] || 0);
        }
        return v;
    }
    create() {
        const lru = this.createLRU(10333);
        chai_1.expect(lru.capacity).to.eq(10333);
        chai_1.expect(this.createLRU(1048576)).instanceof(lru_1.SingleThreadedLRU);
        chai_1.expect(() => this.createLRU(1048577)).to.throw();
    }
    testInternal1() {
        const lru = this.createLRU(1);
        // lru with non-private properties
        const lru$ = this.toInspectable(lru);
        chai_1.expect(lru$.recentKeys).deep.eq([]);
        chai_1.expect(lru$.recentKeyCount).deep.eq({});
        const k1 = "k1", k2 = "k2", k3 = "k3";
        // initial status
        chai_1.expect(lru$.recentKeys).deep.eq([]);
        chai_1.expect(lru$.recentKeyCount).deep.eq({});
        // #1: get() or contain() on a non-existent key: should not cause squeeze
        chai_1.expect(lru.contain("k1")).eq(false);
        chai_1.expect(lru$.recentKeys).deep.eq([]);
        chai_1.expect(lru$.recentKeyCount).deep.eq({});
        chai_1.expect(lru.get(k2)).eq(null);
        chai_1.expect(lru$.recentKeys).deep.eq([]);
        chai_1.expect(lru$.recentKeyCount).deep.eq({});
        // #2: put new key
        lru.put(k1, "put#2");
        chai_1.expect(lru$.values).deep.eq({ k1: "put#2" });
        chai_1.expect(lru$.recentKeys).deep.eq([k1]);
        chai_1.expect(lru$.recentKeyCount).deep.eq({ k1: 1 });
        // #3: put existing key, not causing squeeze
        lru.put(k1, "put#3");
        chai_1.expect(lru$.values).deep.eq({ k1: "put#3" });
        chai_1.expect(lru$.recentKeys).deep.eq([k1, k1]);
        chai_1.expect(lru$.recentKeyCount).deep.eq(this.calcKeyCount(lru$.recentKeys));
        // #4: put new key & swap out least recent key
        lru.put(k2, "put#4");
        chai_1.expect(lru$.values).deep.eq({ k2: "put#4" });
        chai_1.expect(lru$.recentKeys).deep.eq([k2]);
        chai_1.expect(lru$.recentKeyCount).deep.eq(this.calcKeyCount(lru$.recentKeys));
        // #5: put existing key, not causing swap out
        lru.put(k2, "put#5");
        chai_1.expect(lru$.values).deep.eq({ k2: "put#5" });
        chai_1.expect(lru$.recentKeys).deep.eq([k2, k2]);
        chai_1.expect(lru$.recentKeyCount).deep.eq(this.calcKeyCount(lru$.recentKeys));
        // #6: put existing key & remove nonnecessary key
        lru.put(k2, "put#6");
        chai_1.expect(lru$.values).deep.eq({ k2: "put#6" });
        chai_1.expect(lru$.recentKeys).deep.eq([k2]);
        chai_1.expect(lru$.recentKeyCount).deep.eq(this.calcKeyCount(lru$.recentKeys));
    }
    testInternal2() {
        const lru = this.createLRU(2);
        // lru with non-private properties
        const lru$ = this.toInspectable(lru);
        chai_1.expect(lru$.recentKeys).deep.eq([]);
        chai_1.expect(lru$.recentKeyCount).deep.eq({});
        const k1 = "k1", k2 = "k2", k3 = "k3";
        lru.put(k1, k1);
        for (let v = 0; v < 5; v++) {
            lru.put(k2, k2);
        }
        chai_1.expect(lru$.recentKeys).deep.eq([k1, k2, k2, k2, k2, k2]);
        chai_1.expect(lru$.recentKeyCount).deep.eq(this.calcKeyCount(lru$.recentKeys));
    }
    testSwap1() {
        const lru = this.createLRU(2);
        const k1 = "k1", k2 = "k2", k3 = "k3";
        for (const k of [k1, k2, k3, k3, k3, k2, k2, k3, k3, k1]) {
            lru.put(k, k);
        }
        chai_1.expect(lru.currentSize()).eq(2);
        chai_1.expect(lru.contain(k2)).eq(false);
        chai_1.expect(lru.contain(k1)).eq(true);
        chai_1.expect(lru.contain(k3)).eq(true);
        // swapout until last (k1)
        lru.swapOut(1);
        chai_1.expect(lru.currentSize()).eq(1);
        chai_1.expect(lru.contain(k1)).eq(true);
        chai_1.expect(lru.contain(k3)).eq(false);
    }
    testSwap2() {
        const lru = this.createLRU(2);
        const k1 = "k1", k2 = "k2", k3 = "k3";
        for (const k of [k1, k2, k3, k3, k3, k2, k2, k3, k3, k1]) {
            lru.put(k, k);
        }
        chai_1.expect(lru.currentSize()).eq(2);
        chai_1.expect(lru.contain(k2)).eq(false);
        chai_1.expect(lru.contain(k1)).eq(true);
        chai_1.expect(lru.contain(k3)).eq(true);
        chai_1.expect(lru.get(k3)).eq(k3);
        chai_1.expect(lru.currentSize()).eq(2);
        // swapout until last (k3)
        lru.swapOut(1);
        chai_1.expect(lru.currentSize()).eq(1);
        chai_1.expect(lru.contain(k1)).eq(false);
        chai_1.expect(lru.contain(k3)).eq(true);
    }
};
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestSingleThreadedLRU.prototype, "create", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestSingleThreadedLRU.prototype, "testInternal1", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestSingleThreadedLRU.prototype, "testInternal2", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestSingleThreadedLRU.prototype, "testSwap1", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestSingleThreadedLRU.prototype, "testSwap2", null);
TestSingleThreadedLRU = tslib_1.__decorate([
    mocha_typescript_1.suite
], TestSingleThreadedLRU);
//# sourceMappingURL=util.js.map
import { expect } from "chai";

import { ExclusiveTask, MutexResource } from "../util/mutex";
import { SingleThreadedLRU } from "../util/lru";
import { } from "../util/type";

describe("", () => {
    it("provides mutex", () => {
        const sharedRes: number[] = [];
        const mutexRes = new MutexResource(sharedRes);

        for (let i = 0; i < 1000; i++) {
            const current = i;
            mutexRes.queue((release, s) => {
                if (current % 2 === 0) {
                    release();
                } else if (current % 5 === 0) {
                    setImmediate(release);
                } else if (current % 111 === 0) {
                    s.push(current);
                    release();
                } else {
                    release();
                }
            });
        }

        return new Promise<void>((resolve, reject) => {
            mutexRes.queue((release, s) => {
                expect(s).deep.eq([111, 333, 777, 999]);
                release();
                resolve();
            });
        });

    });
});

// @suite
// class TestMutexResource {

//     @test
//     @timeout(10e3)
//     testMutex() {
//     }

// }

// @suite
// class TestSingleThreadedLRU {

//     createLRU(capacity: number) {
//         return new SingleThreadedLRU<string>(capacity);
//     }

//     toInspectable<T>(s: SingleThreadedLRU<T>) {
//         return s as any as {
//             values: { [key: string]: T }
//             recentKeys: string[]
//             recentKeyCount: { [key: string]: number }
//         }
//     }

//     calcKeyCount(keys: string[]) {
//         const v: { [key: string]: number } = {};
//         for (const k of keys) {
//             v[k] = 1 + (v[k] || 0);
//         }
//         return v;
//     }

//     @test
//     create() {
//         const lru = this.createLRU(10333);
//         expect(lru.capacity).to.eq(10333);

//         expect(this.createLRU(1048576)).instanceof(SingleThreadedLRU);
//         expect(() => this.createLRU(1048577)).to.throw();
//     }

//     @test
//     testInternal1() {
//         const lru = this.createLRU(1);

//         // lru with non-private properties
//         const lru$ = this.toInspectable(lru);
//         expect(lru$.recentKeys).deep.eq([]);
//         expect(lru$.recentKeyCount).deep.eq({});

//         const k1 = "k1", k2 = "k2", k3 = "k3";
//         // initial status
//         expect(lru$.recentKeys).deep.eq([]);
//         expect(lru$.recentKeyCount).deep.eq({});

//         // #1: get() or contain() on a non-existent key: should not cause squeeze
//         expect(lru.contain("k1")).eq(false);
//         expect(lru$.recentKeys).deep.eq([]);
//         expect(lru$.recentKeyCount).deep.eq({});
//         expect(lru.get(k2)).eq(null);
//         expect(lru$.recentKeys).deep.eq([]);
//         expect(lru$.recentKeyCount).deep.eq({});

//         // #2: put new key
//         lru.put(k1, "put#2");
//         expect(lru$.values).deep.eq({ k1: "put#2" });
//         expect(lru$.recentKeys).deep.eq([k1]);
//         expect(lru$.recentKeyCount).deep.eq({ k1: 1 });

//         // #3: put existing key, not causing squeeze
//         lru.put(k1, "put#3");
//         expect(lru$.values).deep.eq({ k1: "put#3" });
//         expect(lru$.recentKeys).deep.eq([k1, k1]);
//         expect(lru$.recentKeyCount).deep.eq(this.calcKeyCount(lru$.recentKeys));

//         // #4: put new key & swap out least recent key
//         lru.put(k2, "put#4");
//         expect(lru$.values).deep.eq({ k2: "put#4" });
//         expect(lru$.recentKeys).deep.eq([k2]);
//         expect(lru$.recentKeyCount).deep.eq(this.calcKeyCount(lru$.recentKeys));

//         // #5: put existing key, not causing swap out
//         lru.put(k2, "put#5");
//         expect(lru$.values).deep.eq({ k2: "put#5" });
//         expect(lru$.recentKeys).deep.eq([k2, k2]);
//         expect(lru$.recentKeyCount).deep.eq(this.calcKeyCount(lru$.recentKeys));

//         // #6: put existing key & remove nonnecessary key
//         lru.put(k2, "put#6");
//         expect(lru$.values).deep.eq({ k2: "put#6" });
//         expect(lru$.recentKeys).deep.eq([k2]);
//         expect(lru$.recentKeyCount).deep.eq(this.calcKeyCount(lru$.recentKeys));
//     }

//     @test
//     testInternal2() {
//         const lru = this.createLRU(2);

//         // lru with non-private properties
//         const lru$ = this.toInspectable(lru);
//         expect(lru$.recentKeys).deep.eq([]);
//         expect(lru$.recentKeyCount).deep.eq({});

//         const k1 = "k1", k2 = "k2", k3 = "k3";
//         lru.put(k1, k1);
//         for (let v = 0; v < 5; v++) {
//             lru.put(k2, k2);
//         }
//         expect(lru$.recentKeys).deep.eq([k1, k2, k2, k2, k2, k2]);
//         expect(lru$.recentKeyCount).deep.eq(this.calcKeyCount(lru$.recentKeys));
//     }

//     @test
//     testSwap1() {
//         const lru = this.createLRU(2);
//         const k1 = "k1", k2 = "k2", k3 = "k3";
//         for (const k of [k1, k2, k3, k3, k3, k2, k2, k3, k3, k1]) {
//             lru.put(k, k);
//         }
//         expect(lru.currentSize()).eq(2);
//         expect(lru.contain(k2)).eq(false);
//         expect(lru.contain(k1)).eq(true);
//         expect(lru.contain(k3)).eq(true);

//         // swapout until last (k1)
//         lru.swapOut(1);
//         expect(lru.currentSize()).eq(1);
//         expect(lru.contain(k1)).eq(true);
//         expect(lru.contain(k3)).eq(false);
//     }

//     @test
//     testSwap2() {
//         const lru = this.createLRU(2);
//         const k1 = "k1", k2 = "k2", k3 = "k3";
//         for (const k of [k1, k2, k3, k3, k3, k2, k2, k3, k3, k1]) {
//             lru.put(k, k);
//         }
//         expect(lru.currentSize()).eq(2);
//         expect(lru.contain(k2)).eq(false);
//         expect(lru.contain(k1)).eq(true);
//         expect(lru.contain(k3)).eq(true);
//         expect(lru.get(k3)).eq(k3);
//         expect(lru.currentSize()).eq(2);

//         // swapout until last (k3)
//         lru.swapOut(1);
//         expect(lru.currentSize()).eq(1);
//         expect(lru.contain(k1)).eq(false);
//         expect(lru.contain(k3)).eq(true);
//     }
// }
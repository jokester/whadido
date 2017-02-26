import { expect } from 'chai';

import { liftA2 } from '../util/transforms';

describe("liftA2", () => {
    it("lifts a sync function to promise", async (done) => {
        const liftedPlus = liftA2((a: number, b: number) => a + b);
        const sum = await liftedPlus(3, Promise.resolve(5));
        expect(sum).eq(8);
        done();
    })
});
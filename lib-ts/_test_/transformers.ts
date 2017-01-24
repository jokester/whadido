import { suite, test } from 'mocha-typescript';
import { expect } from 'chai';

import { liftA2 } from '../util/transforms';

@suite
class TestTransformers {
    @test
    async liftA2() {
        const liftedPlus = liftA2((a: number, b: number) => a + b);
        const sum = await liftedPlus(3, Promise.resolve(5));
        expect(sum).eq(8);
    }
}
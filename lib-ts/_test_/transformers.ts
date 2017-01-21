import { suite, test } from 'mocha-typescript';
import { expect } from 'chai';

import { liftA2 } from '../util/transforms';

@suite class TestTransformers {
    @test liftA2() {
        return liftA2((a: number, b: number) => a + b)(3, Promise.resolve(5)).then(sum => expect(sum).eq(8));
    }
}
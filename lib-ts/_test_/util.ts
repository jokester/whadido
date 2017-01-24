import { suite, test, timeout } from 'mocha-typescript';
import { expect } from 'chai';

import { ExclusiveTask, MutexResource } from '../util/mutex';

@suite class TestMutexResource {

    @test
    @timeout(10e3)
    testMutex() {
        const sharedRes: number[] = [];
        const mutexRes = new MutexResource(sharedRes);

        for (let i = 0; i < 1000; i++) {
            const current = i;
            mutexRes.queue((release, s) => {
                if (current % 2 === 0) {
                    release();
                } else if (current % 3 === 0) {
                    setTimeout(release);
                } else if (current % 5 === 0) {
                    // s.push(current);
                    release();
                } else {
                    release();
                }
            });
        }

        return new Promise<void>((resolve, reject) => {
            mutexRes.queue((release, s) => {
                expect(s).deep.eq([]);
                release();
                resolve();
            });
        });
    }

}

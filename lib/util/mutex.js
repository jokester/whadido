"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AdaptiveResPool {
    constructor(minRes, maxRes, callback) {
        this.minRes = minRes;
        this.maxRes = maxRes;
        this.callback = callback;
    }
}
exports.AdaptiveResPool = AdaptiveResPool;
class MutexResourcePool {
    constructor(resArray) {
        this.taskQueue = [];
        this.setImmediateAvailable = (typeof setImmediate === "function");
        this.resPool = resArray.map(r => new MutexResource(r));
    }
    queue(task) {
        const r = this.resPool.shift();
        if (r) {
            r.queue((release, res) => {
                task(() => {
                    release();
                    this.resPool.push(r);
                    this.runQueue();
                }, res);
            });
        }
        else {
            this.taskQueue.push(task);
        }
    }
    runQueue() {
        if (this.taskQueue.length) {
            const t = this.taskQueue.shift();
            this.queue(t);
        }
    }
}
exports.MutexResourcePool = MutexResourcePool;
/**
 * A resource manager that holds and schedules mu-exclusive task
 *
 */
class MutexResource {
    constructor(res) {
        this.taskQueue = [];
        this.setImmediateAvailable = (typeof setImmediate === "function");
        this.nextTickAvailable = (typeof process === "object" && process.nextTick);
        /**
         * whether the resource is being occupied by a task
         */
        this.locked = false;
        this.res = res;
    }
    /**
     * Add a task to queue. The task will be runned when time is appropriate
     */
    queue(task) {
        this.taskQueue.push(task);
        if (this.setImmediateAvailable)
            this.runQueue();
        else
            this.runQueueSlow();
    }
    /**
     * Queue tasks with setImmediate (it's *much* faster)
     */
    runQueue() {
        if (this.locked)
            return;
        this.locked = true;
        const firstTask = this.taskQueue.shift();
        /** whether release() for this task get called */
        let released = false;
        firstTask(() => {
            if (released)
                throw new Error(`release() for this task have been called`);
            this.locked = false;
            released = true;
            if (this.taskQueue.length)
                setImmediate(() => this.runQueue());
        }, this.res);
    }
    /**
     * Queue tasks with setTimeout (slower but available in browser)
     */
    runQueueSlow() {
        if (this.locked)
            return;
        this.locked = true;
        const firstTask = this.taskQueue.shift();
        /** whether release() for this task get called */
        let released = false;
        setTimeout(firstTask, 0, () => {
            if (released)
                throw new Error(`release() for this task have been called`);
            this.locked = false;
            released = true;
            if (this.taskQueue.length)
                setTimeout(() => this.runQueueSlow());
        }, this.res);
    }
    ;
    /**
     * run tasks with process.nextTick
     * (not faster, so not using it)
     */
    runQueueAlt() {
        if (this.locked)
            return;
        this.locked = true;
        const firstTask = this.taskQueue.shift();
        /** whether release() for this task get called */
        let released = false;
        process.nextTick(firstTask, () => {
            if (released)
                throw new Error(`release() for this task have been called`);
            this.locked = false;
            released = true;
            if (this.taskQueue.length)
                process.nextTick(() => this.runQueue());
        }, this.res);
    }
}
exports.MutexResource = MutexResource;
//# sourceMappingURL=mutex.js.map
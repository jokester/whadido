"use strict";
/**
 * A resource manager that holds and schedules mu-exclusive task
 *
 */
class MutexResource {
    constructor(res) {
        this.taskQueue = [];
        this.setImmediateAvailable = (typeof setImmediate === "function");
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
        setImmediate(firstTask, () => {
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
}
exports.MutexResource = MutexResource;
//# sourceMappingURL=mutex.js.map
/**
 * A task that uses resource of type T exclusively
 * 
 * NOTE:
 *
 * 1. A task *must* call release() *once* after it no longer requires the res.
 * Otherwise the next task will never get called.
 *
 * 2. A task *must* not throw, as it will be executed in a new call stack,
 * and throwing may cause node.js process to exit.
 *
 * FIXME change params to (release, res) so as to remind caller
 */
export interface ExclusiveTask<T> {
    (res: T, release: () => void): void
}

/**
 * A resource manager that holds and schedules mu-exclusive task
 * 
 */
export class MutexResource<T> {
    private readonly res: T;
    private readonly taskQueue: ExclusiveTask<T>[] = [];
    private readonly setImmediateAvailable = (typeof setImmediate === "function");

    /**
     * whether the resource is being occupied by a task
     */
    private locked = false;

    constructor(res: T) {
        this.res = res;
    }

    /**
     * Add a task to queue. The task will be runned when time is appropriate
     */
    queue(task: ExclusiveTask<T>) {
        this.taskQueue.push(task);
        if (this.setImmediateAvailable)
            this.runQueue();
        else
            this.runQueueSlow();
    }

    /**
     * Queue tasks with setImmediate (it's faster)
     */
    private runQueue() {
        if (this.locked)
            return;

        this.locked = true;
        const firstTask = this.taskQueue.shift();

        /** whether release() for this task get called */
        let released = false;

        setImmediate(firstTask,
            this.res,
            () => {
                if (released)
                    throw new Error(`release() for this task have been called`);
                this.locked = false;
                released = true;

                if (this.taskQueue.length)
                    setImmediate(() => this.runQueue());
            });
    }

    /**
     * Queue tasks with setTimeout (it's faster)
     */
    private runQueueSlow() {
        if (this.locked)
            return;

        this.locked = true;
        const firstTask = this.taskQueue.shift();

        /** whether release() for this task get called */
        let released = false;

        setTimeout(
            firstTask,
            0,
            this.res,
            () => {
                if (released)
                    throw new Error(`release() for this task have been called`);
                this.locked = false;
                released = true;

                if (this.taskQueue.length)
                    setImmediate(() => this.runQueueSlow());
            });
    };
}

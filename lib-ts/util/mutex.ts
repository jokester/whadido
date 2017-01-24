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
    (release: () => void, res: T): void
}

/**
 * A resource manager that holds and schedules mu-exclusive task
 * 
 */
export class MutexResource<T> {
    private readonly res: T;
    private readonly taskQueue: ExclusiveTask<T>[] = [];
    private readonly setImmediateAvailable = (typeof setImmediate === "function");
    private readonly nextTickAvailable = (typeof process === "object" && process.nextTick);
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
     * Queue tasks with setImmediate (it's *much* faster)
     */
    private runQueue() {
        if (this.locked)
            return;

        this.locked = true;
        const firstTask = this.taskQueue.shift();

        /** whether release() for this task get called */
        let released = false;

        setImmediate(firstTask,
            () => {
                if (released)
                    throw new Error(`release() for this task have been called`);
                this.locked = false;
                released = true;

                if (this.taskQueue.length)
                    setImmediate(() => this.runQueue());
            },
            this.res);
    }

    /**
     * Queue tasks with setTimeout (slower but available in browser)
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
            () => {
                if (released)
                    throw new Error(`release() for this task have been called`);
                this.locked = false;
                released = true;

                if (this.taskQueue.length)
                    setTimeout(() => this.runQueueSlow());
            },
            this.res);
    };

    /**
     * run tasks with process.nextTick
     * (not faster, so not using it)
     */
    private runQueueAlt() {
        if (this.locked)
            return;

        this.locked = true;
        const firstTask = this.taskQueue.shift();

        /** whether release() for this task get called */
        let released = false;

        process.nextTick(firstTask,
            () => {
                if (released)
                    throw new Error(`release() for this task have been called`);
                this.locked = false;
                released = true;

                if (this.taskQueue.length)
                    process.nextTick(() => this.runQueue());
            },
            this.res);
    }
}

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
    (release: () => void, res: T): void;
}

export interface ResourceHolder<T> {
    queue(task: ExclusiveTask<T>): void;
}

export interface AdaptiveResPoolCallback<T> {
    createRes(): T;
    disposeRes(res: T): void;
}

export class AdaptiveResPool<T> {
    constructor(private minRes: number, private maxRes: number, private readonly callback: AdaptiveResPoolCallback<T>) {

    }
}

export class MutexResourcePool<T> implements ResourceHolder<T> {
    private readonly resPool: MutexResource<T>[];
    private readonly taskQueue: ExclusiveTask<T>[] = [];
    private readonly setImmediateAvailable = (typeof setImmediate === "function");

    constructor(resArray: T[]) {
        this.resPool = resArray.map(r => new MutexResource(r));
    }

    queue(task: ExclusiveTask<T>) {
        const r = this.resPool.shift();
        if (r) {
            r.queue((release, res) => {
                task(() => {
                    release();
                    this.resPool.push(r);
                    this.runQueue();
                }, res);
            });
        } else {
            this.taskQueue.push(task);
        }
    }

    private runQueue() {
        if (this.taskQueue.length) {
            const t = this.taskQueue.shift();
            this.queue(t);
        }
    }
}

/**
 * A resource manager that holds and schedules mu-exclusive task
 *
 */
export class MutexResource<T> implements ResourceHolder<T> {
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
    }

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

        const release = () => {
            if (released)
                throw new Error(`release() for this task have been called`);
            this.locked = false;
            released = true;

            if (this.taskQueue.length)
                process.nextTick(() => this.runQueue());
        };

        process.nextTick(
            () => {
                try {
                    firstTask(release, this.res);
                } finally {
                    if (!released)
                        release();
                }
            });
    }
}
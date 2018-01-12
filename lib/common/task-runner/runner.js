"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//
const targetStack = [];
/**
 * Tasks cannot be recursively depended like A <- B <- A
 * A task is guaranteed to run at most once.
 */
class TaskRunner {
    constructor(taskDef) {
        this.results = new Map();
        if (taskDef instanceof Map)
            this.taskDef = new Map(taskDef);
        else if (taskDef instanceof Object) {
            this.taskDef = new Map;
            for (const name in taskDef) {
                this.taskDef.set(name, taskDef[name]);
            }
        }
        else
            throw new Error(`expect taskDef to be Map or Object`);
    }
    run(target) {
        return Promise.resolve(this.runSync(target));
    }
    /**
     * Run task and throw()
     *
     * @param {string} target
     * @returns {Promise<any>}
     *
     * @memberOf TaskRunner
     */
    runSync(target) {
        // Array#indexOf() may be bad in performance
        // but we can have a better `stack` for error message
        if (targetStack.indexOf(target) !== -1) {
            const err = new Error(`Cyclic dependicies: ${targetStack.concat([target]).join(" <- ")}`);
            targetStack.length = 0;
            throw err;
        }
        const task = this.taskDef.get(target);
        if (!task)
            throw new Error(`Task not defined: ${target}`);
        targetStack.push(target);
        const deps = (this.taskDef.get(target).dep || []).map(depName => {
            if (!this.results.has(depName)) {
                this.results.set(depName, this.runSync(depName));
            }
            return this.results.get(depName);
        });
        targetStack.pop();
        return Promise.all(deps).then(depResults => {
            return task.run.apply(task.thisArg, depResults);
        });
    }
}
exports.TaskRunner = TaskRunner;
//# sourceMappingURL=runner.js.map
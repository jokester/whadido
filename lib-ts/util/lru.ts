/**
 * A LRU cache for string-indexed values
 * @author Wang Guan
 */

/**
 * LRU cache for string-indexed, non-falsy values
 *
 * NOTE all methods are "thread-safe",
 * i.e. they do no use timeout/promise/async,await,
 *      and will not run before/after function calls.
 * 
 * WARNING there may be marginal case when the key
 * conflicts with JS's builtin property names.
 * (uuid/guid/sha/md5 are safe for keys though)
 * 
 * @export
 * @class SingleThreadedLRU
 * @template T {type} type of cached values, must be non-falsy
 */
export class SingleThreadedLRU<T> {
    private readonly values: { [key: string]: T } = {};

    /**
     * Keys recently used in get() and put()
     *
     * Essentially the last elements in a unlimited ordered list of used keys.
     */
    private readonly recentKeys: string[] = [];
    /**
     * #occurance of key in recentKeys
     */
    private readonly recentKeyCount: { [key: string]: number } = {};

    constructor(readonly capacity: number) {
        if (~~capacity !== capacity)
            throw new Error(`capacity must be a integer`);
        else if (capacity > (1 << 20) || capacity < 1) {
            throw new Error(`capacity too large: ${capacity}`);
        }
    }

    /**
     * Query if key exists in cache
     * (not mutating state in any way)
     * 
     * @param {string} key
     * @returns {boolean} it exists
     * 
     * @memberOf SingleThreadLRU
     */
    contain(key: string): boolean {
        return !!this.values.hasOwnProperty(key);
    }

    /**
     *
     *
     * @param {string} key
     * @param {T} value must not be falsey
     *
     * @memberOf SingleThreadedLRU
     */
    put(key: string, value: T) {
        if (!value)
            throw new Error(`falsy-value`);
        this.values[key] = value;
        this.refreshKey(key);
        this.swapOut(this.capacity);
    }

    /**
     *
     *
     * @param {string} key
     * @returns {T} value if it exists in cache, null otherwise
     *
     * @memberOf SingleThreadedLRU
     */
    get(key: string): T {
        const value = this.values[key];
        if (value)
            this.refreshKey(key);
        // no need to squeeze(): get() only change order of recent-used keys
        return value || null;
    }

    /**
     * Swap out least recent values
     *
     * @param {number} targetSize loop until falls under targetSize
     *
     * @memberOf SingleThreadedLRU
     */
    swapOut(targetSize: number) {
        while (Object.keys(this.values).length > targetSize) {
            const k = this.recentKeys.shift();
            const restOccurance = this.recentKeyCount[k] = this.recentKeyCount[k] - 1;

            if (!k || (restOccurance < 0))
                throw new Error(`squeeze: illegal state : k=${k} / keys=${JSON.stringify(this.recentKeyCount)}`);
            else if (restOccurance === 0) {
                /**
                 * k is the last occurance of same key in this.recentKeys,
                 * so it's safe to remove it from values
                 */
                delete this.values[k];
                delete this.recentKeyCount[k];
            }
        }
    }

    /**
     * Current size of values
     * 
     * @returns {number} recently used 
     * 
     * @memberOf SingleThreadedLRU
     */
    currentSize(): number {
        return Object.keys(this.values).length;
    }

    /**
     * Refresh a key when it get used
     */
    private refreshKey(key: string) {
        if (!this.values[key])
            throw new Error(`refreshKey: called when key='${key}' is not in this.values`);
        this.recentKeys.push(key);
        this.recentKeyCount[key] = 1 + (this.recentKeyCount[key] || 0);

        // reduce keys when available, to prevent a long squeezeCache()
        if (this.recentKeys.length > this.capacity * 2)
            this.squeezeRecentKeys();
    }


    /**
     * Remove first ones from recent keys if they have other occurances
     */
    private squeezeRecentKeys() {
        while (this.recentKeys.length > this.capacity) {
            const k = this.recentKeys[0];
            const restOccurance = this.recentKeyCount[k];
            if (k && restOccurance > 1) {
                this.recentKeys.shift();
                --this.recentKeyCount[k];
            } else {
                break; // while
            }
        }
    }
}
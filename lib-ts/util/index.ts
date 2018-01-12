export { chunkToLines, readLines } from "../common/io";

export function isTr4uthy(v: any) {
    return !!v;
}

export { DeepReadonly, deepFreeze, freeze } from "../common/type";

export { MutexResource, MutexResourcePool, ResourceHolder } from "../common/util/mutex";

import * as $readdir from "recursive-readdir";

/**
 * recursively list all files under `dir`
 * @param dir path to start from
 */
export function recursiveReadDir(dir: string) {
    return new Promise<string[]>((fulfill, reject) => {
        $readdir(dir, (err, files) => {
            if (err)
                reject(err);
            else
                fulfill(files);
        });
    });
}

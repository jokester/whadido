const fs = require('fs');
const path = require('path');

function writeFile(absPath: string, content: string): Promise<void> {
    return new Promise<void>(function (fulfill, reject) {
        fs.writeFile(absPath, content, function (err: any) {
            if (err) {
                reject(err);
            }
            else
                fulfill();
        });
    });
}

function prettyJson(val: any) {
    return JSON.stringify(val, null, 4);
}

function genAbsPath(filename: string) {
    return path.join(__dirname, '..', '..', 'tmp', filename);
}

export function logAsJSON(filename: string): (v: any) => Promise<void> {
    return writeLog(filename, prettyJson);
}

export function writeLog(filename: string, transformer: (val: any) => string) {
    return (v: string | Buffer) => writeFile(genAbsPath(filename), transformer(v));
}

export function logError(filename: string) {
    const abspath = path.join(__dirname, '..', '..', 'tmp', filename);
    // after successful write, throw again
    return (err: any) => {
        const message = err.toString ? err.toString() : ('' + err);
        return writeFile(abspath, message).then(() => { throw err })
    }
}

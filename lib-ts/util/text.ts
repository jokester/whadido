const fs = require("fs");

export function chunkToLines(chunk: string | Buffer) {
    return chunk.toString().split(/\r\n|\r|\n/);
}

export function readFile(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, function (err: any, content: string) {
            if (err)
                reject(err);
            else
                resolve(content);
        });
    });
}

export function readLines(filename: string) {
    return readFile(filename).then(chunkToLines);
}
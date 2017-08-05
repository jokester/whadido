"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Format of ts types
 */
const isIdentifier = /^\w+$/;
/**
 * @param tokens tokens returned by TSType#
 */
function format(tokens, indentBase) {
    let currentLine = "";
    const lines = [];
    if (indentBase === undefined)
        indentBase = 4;
    let indent = 0;
    tokens.forEach((t, index) => {
        const prevT = tokens[index - 1];
        const nextT = tokens[index + 1];
        currentLine = currentLine || spaces(indent);
        if (t === ":") {
            currentLine += ": ";
        }
        else if (t === "{" && nextT === "}") {
            currentLine += " {";
            indent += indentBase;
        }
        else if (t === "{") {
            currentLine += " {";
            lines.push(currentLine);
            indent += indentBase;
            currentLine = null;
        }
        else if (t === "}" && prevT === "{") {
            currentLine += "}";
            lines.push(currentLine);
            indent -= indentBase;
            currentLine = null;
        }
        else if (t === "}") {
            lines.push(currentLine);
            indent -= indentBase;
            lines.push(spaces(indent) + "}");
            currentLine = null;
        }
        else if (t === ";") {
            currentLine += ";";
            lines.push(currentLine);
            currentLine = null;
        }
        else {
            currentLine += t;
            if (isIdentifier.exec(t) && isIdentifier.exec(nextT)) {
                currentLine += " ";
            }
        }
    });
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines.filter(nonBlankLine);
}
exports.format = format;
/**
 * @param len num of spaces
 */
function spaces(len) {
    const spaces = [];
    for (let index = 0; index < len; index++) {
        spaces.push(" ");
    }
    return spaces.join("");
}
function nonBlankLine(line) {
    return !(/^\s*$/.exec(line));
}
//# sourceMappingURL=format.js.map
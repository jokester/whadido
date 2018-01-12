"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Infer TS types for a JSON-serializable value
 */
function infer(value) {
    const jsType = typeof value;
    if (value === null || value === undefined) {
        return new TSAny();
    }
    else if (jsType === "number" || value instanceof Number) {
        return new TSNumber();
    }
    else if (jsType === "string" || value instanceof String) {
        return new TSString();
    }
    else if (jsType === "boolean") {
        return new TSBoolean();
    }
    else if (value instanceof Array) {
        return new TSArray(value);
    }
    else if (jsType === "object") {
        return new TSObject(value);
    }
    else
        throw new Error(`cannot recognize value: {${value}}`);
}
exports.infer = infer;
/**
 * base class of (unnamed) types
 */
class TSType {
}
exports.TSType = TSType;
/**
 * Can be used when ES6 named parameter is not avaiable (e.g. node v4)
 */
function namedArg(absent, value) {
    return (value === undefined) ? absent : value;
}
/**
 * "any"
 */
class TSAny extends TSType {
    generateCode() {
        return [`any`];
    }
}
/**
 * key (propName: string) -- value (propType: TSType) pairs
 */
class TSObject extends TSType {
    constructor(value) {
        super();
        this.propTypes = {};
        this.optional = false;
        const keys = Object.keys(value);
        keys.forEach(k => {
            this.propTypes[k] = infer(value[k]);
        });
    }
    /**
     * set all props to be optional
     */
    setOptional(optional, recursive) {
        this.optional = optional;
        recursive = namedArg(recursive, false);
        if (recursive)
            for (let key in this.propTypes) {
                if (this.propTypes.hasOwnProperty(key)) {
                    const propType = this.propTypes[key];
                    if (propType instanceof TSObject) {
                        propType.setOptional(optional);
                    }
                }
            }
    }
    generateCode() {
        let result = [];
        result.push("{");
        const keys = Object.keys(this.propTypes);
        keys.forEach(childName => {
            // TODO different grammer on functions
            const childType = this.propTypes[childName];
            let childTypeTokens = null;
            if (1 > 2) {
                childTypeTokens = childType.generateCode();
            }
            else {
                childTypeTokens = [this.optional ? `${childName}?` : childName, ":"]
                    .concat(childType.generateCode());
            }
            if (!(childType instanceof TSObject)) {
                childTypeTokens.push(";");
            }
            result = result.concat(childTypeTokens);
        });
        result.push("}");
        return result;
    }
}
exports.TSObject = TSObject;
/**
 * [a] (currently only homogeneous array is supported)
 *
 * FIXME support non-homogeneous array via union types
 */
class TSArray extends TSType {
    constructor(value) {
        super();
        if (value.length === 0) {
            this.memberType = new TSAny();
        }
        else {
            this.memberType = infer(value[0]);
        }
    }
    generateCode() {
        return this.memberType.generateCode().concat(["[]"]);
    }
}
/**
 * type that is just a name
 * e.g. primitive types, or other types defined by name
 */
class TSTypeRef extends TSType {
    constructor(name) {
        super();
        this.name = name;
    }
    generateCode() {
        return [this.name];
    }
}
exports.TSTypeRef = TSTypeRef;
class TSNumber extends TSTypeRef {
    constructor() { super("number"); }
}
class TSString extends TSTypeRef {
    constructor() { super("string"); }
}
exports.TSString = TSString;
class TSBoolean extends TSTypeRef {
    constructor() { super("boolean"); }
}
/**
 * what else can void do? only be return value?
 */
class TSVoid extends TSTypeRef {
    constructor(a) { super("void"); }
}
//# sourceMappingURL=infer.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Generate ts declarations (mostly basic types with names, and ADT types)
 * @copyright Wang Guan
 * FIXME consider type hierarchys
 */
const infer_1 = require("./infer");
class NamedType {
    constructor(name, type) {
        this.name = name;
        this.type = type;
    }
    generateCode() {
        const tokens = [this.name, ":"].concat(this.type.generateCode());
        if (!(this.type instanceof infer_1.TSObject)) {
            tokens.push(";");
        }
        return tokens;
    }
}
exports.NamedType = NamedType;
class TSInterface extends infer_1.TSType {
    constructor(name, type) {
        super();
        this.name = name;
        this.type = type;
    }
    generateCode() {
        return ["export", "interface", this.name].concat(this.type.generateCode());
    }
}
exports.TSInterface = TSInterface;
class NamedUnionType extends infer_1.TSType {
    constructor(name, union) {
        super();
        this.name = name;
        this.union = union;
    }
    generateCode() {
        const tokens = ["export", "type", this.name, " = "];
        this.union.forEach((value, index, union) => {
            tokens.push(value);
            if (index < union.length - 1) {
                tokens.push(" | ");
            }
        });
        tokens.push(";");
        return tokens;
    }
}
exports.NamedUnionType = NamedUnionType;
/**
 * Simple: NO param names /  / etc.
 */
class TSNamedSimpleFunction extends infer_1.TSType {
    constructor(name, paramTypes, retType) {
        super();
        this.name = name;
        this.paramTypes = paramTypes;
        this.retType = retType;
    }
    /**
     * generates like
     */
    generateCode() {
        let tokens = [this.name, "("];
        this.paramTypes.forEach((value, index) => {
            tokens.push(`param${1 + index}`, ":", ...value.generateCode());
        });
        tokens.push(")", ":");
        tokens = tokens.concat(this.retType.generateCode());
        return tokens;
    }
}
exports.TSNamedSimpleFunction = TSNamedSimpleFunction;
//# sourceMappingURL=decl.js.map
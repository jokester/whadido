"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const preact = require("preact");
class FilePicker extends preact.Component {
    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
    }
    handleChange(ev) {
        const input = ev.target;
        const file0 = input.files[0];
        const { onTextRead } = this.props;
        if (file0 && onTextRead) {
            const reader = new FileReader();
            reader.addEventListener("load", (loaded) => {
                onTextRead(reader.result);
            });
            reader.readAsText(file0, "utf8");
        }
    }
    render() {
        return preact.h("input", { type: "file", onChange: this.handleChange });
    }
}
exports.FilePicker = FilePicker;
//# sourceMappingURL=file-picker.js.map
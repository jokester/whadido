"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const preact = require("preact");
const reflog_preview_1 = require("./reflog-preview");
const file_picker_1 = require("./file-picker");
const container = document.getElementById("reflog-preview");
class App extends preact.Component {
    render() {
        if (this.state.refdump) {
            return preact.h(reflog_preview_1.ReflogPreview, { reflogDump: this.state.refdump });
        }
        else {
            return preact.h(file_picker_1.FilePicker, { onTextRead: (text) => { this.setState({ refdump: JSON.parse(text) }); } });
        }
    }
}
if ($$webpack_dev && module.hot) {
    // dev w/ HMR: hot-reload components and re-render
    console.info("configuring webpack HMR");
    module.hot.accept(["./reflog-preview"], function () {
        console.log("accept handler get called", [].slice.call(arguments));
        preact.render(preact.h(App, null), container, container.firstChild);
    });
}
else if ($$webpack_dev) {
    // dev w/o HMR
    console.info("webpack HMR not available");
}
preact.render(preact.h(App, null), container, container.firstChild);
//# sourceMappingURL=dev.js.map
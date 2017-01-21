"use strict";
const React = require("react");
const ReactDOM = require("react-dom");
const ui_1 = require("./ui");
function startApp(div) {
    /**
     * TODO create store / etc
     */
    ReactDOM.render(React.createElement(ui_1.AppRoot, null), div);
}
exports.startApp = startApp;
//# sourceMappingURL=app.js.map
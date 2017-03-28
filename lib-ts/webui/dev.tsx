import * as preact from "preact";

import { RefDump } from "../analyze";
import { ReflogPreview } from "./reflog-preview";
import { FilePicker } from "./file-picker";

declare const $$webpack_dev: boolean;

type HMRModule = typeof module & {
    hot?: {
        accept(dependencies: string | string[],
            callback: (updatedDependencies: any[]) => void): void
        accept(moduleName: string, callback: () => void): void
    }
};

const container = document.getElementById("reflog-preview");

class App extends preact.Component<{}, { refdump: RefDump[] }> {
    render() {
        if (this.state.refdump) {
            return <ReflogPreview reflogDump={this.state.refdump} />;
        } else {
            return <FilePicker
                onTextRead={(text) => { this.setState({ refdump: JSON.parse(text) }); }} />;
        }
    }
}

if ($$webpack_dev && (module as HMRModule).hot) {
    // dev w/ HMR: hot-reload components and re-render

    console.info("configuring webpack HMR");
    (module as HMRModule).hot.accept(["./reflog-preview"], function () {
        console.log("accept handler get called", [].slice.call(arguments));
        preact.render(<App />, container, container.firstChild as any);
    });
} else if ($$webpack_dev) {
    // dev w/o HMR
    console.info("webpack HMR not available");
}

preact.render(<App />, container, container.firstChild as any);

import * as preact from 'preact';

declare const $$webpack_dev: boolean;

type HMRModule = typeof module & {
    hot?: {
        accept(dependencies: string | string[],
            callback: (updatedDependencies: any[]) => void): void
        accept(moduleName: string, callback: () => void): void
    }
}

const container = document.getElementById("reflog-preview");

import { ReflogPreview } from './reflog-preview';

if ($$webpack_dev && (module as HMRModule).hot) {
    // dev w/ HMR: hot-reload './m', './greeting' and re-render

    console.info("configuring webpack HMR");
    (module as HMRModule).hot.accept(["./reflog-preview"], function () {
        console.log("accept handler get called", [].slice.call(arguments));
        preact.render(<ReflogPreview />, container, container.firstChild);
    });
} else if ($$webpack_dev) {
    // dev w/o HMR
    console.info("webpack HMR not available");
}

preact.render(<ReflogPreview />, container, container.firstChild);


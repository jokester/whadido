import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as m from './model';
import { AppRoot } from './ui';

export function startApp(div: HTMLDivElement) {
    /**
     * TODO create store / etc
     */
    ReactDOM.render(<AppRoot />, div);
}
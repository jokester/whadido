import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ReflogPreview } from './reflog-preview/reflog-preview';
import { FilePicker } from './reflog-preview/file-picker';
import { RefHistory } from '../analyze/ref-state';
import { WebAnalyzer } from './reflog-preview/web-analyzer';

type HMRModule = typeof module & {
  hot?: {
    accept(dependencies: string | string[], callback: (updatedDependencies: any[]) => void): void;
    accept(moduleName: string, callback: () => void): void;
  };
};

function renderApp() {
  const container = document.getElementById('reflog-preview') as HTMLDivElement;
  ReactDOM.render(<App />, container);
}

/**
 * A viewer to show reflog (json) in browser.
 */
const App: React.FunctionComponent<{}> = () => {
  const [refDump, setRefDump] = React.useState<RefHistory[]>([]);

  if (refDump && refDump.length) {
    return <WebAnalyzer history={refDump} />;
  }
  return <FilePicker onTextRead={text => setRefDump(JSON.parse(text))} />;
};

if ((module as HMRModule).hot) {
  // w/ HMR: hot-reload components and re-render
  console.info('configuring webpack HMR');
  (module as HMRModule).hot!.accept(['./reflog-preview'], function() {
    console.log('accept handler get called', [].slice.call(arguments));
    renderApp();
  });
} else {
  // w/o HMR
  console.info('webpack HMR not available');
}

renderApp();

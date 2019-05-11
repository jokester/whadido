import React, { useState } from 'react';
import { buildState, countReflog, RefHistory, unbuildState } from '../../analyze/ref-state';
import { Operation } from '../../analyze/operations';
import { topParser } from '../../analyze';

export interface WhadidoDump {
  input: {
    refHistory: RefHistory[];
    refCount: number;
  };

  outputs: {
    operations: Operation[];
    rest: RefHistory[];
    restCount: number;
  }[];
}

function analyzeForWeb(refHistory: RefHistory[]): WhadidoDump {
  const initState = buildState(refHistory);
  const numReflogs = countReflog(initState);
  const results = topParser(initState);
  const input = {
    refHistory,
    refCount: countReflog(initState),
  };
  const outputs = results.map(result => ({
    operations: result.output,
    rest: unbuildState(refHistory, result.rest),
    restCount: countReflog(result.rest),
  }));
  return { input, outputs };
}

export const WebAnalyzer: React.FunctionComponent<{ history: RefHistory[] }> = props => {
  const [dump] = useState<WhadidoDump>(() => analyzeForWeb(props.history));
  return <div>hii</div>;
};

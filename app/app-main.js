"use strict";

const startApp = require('../lib/app').startApp;
// import {  } from ;

const div = document.querySelector('#app-root');
setTimeout(startApp, 0, div);
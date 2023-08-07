import { pluginFactory } from "./plugin-factory.js";

/*
NOTE:
-----

Import map logic mostly taken from vite-plugin-import-maps (https://github.com/pakholeung37/vite-plugin-import-maps).

It's been modified to suit single-spa.

LEGAL NOTICE
------------

vite-plugin-import-maps was under the MIT license at the time this project borrowed from it.
*/

export const vitePluginSingleSpa = pluginFactory();
export default vitePluginSingleSpa;

# vite-plugin-single-spa

> Vite plug-in to convert Vite-based projects to single-spa root or micro-frontend applications.

This Vite plug-in is an **opinionated** way of making Vite-based front-end projects work with 
[single-spa](https://github.com/single-spa/single-spa).

## Quickstart

> **NOTE**:  This document assumes the use of TypeScript Vite projects.  However, all of this applies to JavaScript 
projects as well.  Just know that any file name with extension `.ts` probably exists as a `.js` file.

Install the NPM package as a development dependency.

```bash
npm i -D vite-plugin-single-spa
```

> In reality, what is installed as development dependency is a matter of how you build your final product.  For 
example, if you want to use `npm` with `--omit=dev` to build the project, then you'll need all packages used by Vite's 
build command to have been installed as regular dependencies.  It is up to you how you end up installing the package 
(dev or regular).

Now, in `vite.config.ts`, import the `vitePluginSingleSpa` function from it.  It is the default export but it is also 
a named export:

```typescript
// Either works.
import vitePluginSingleSpa from 'vite-plugin-single-spa';
import { vitePluginSingleSpa } from 'vite-plugin-single-spa';
```

This is the plug-in factory function.  Create the plug-in by invoking the function.  Pass the plug-in options as 
argument to the function call.  The following is the content of `vite.config.ts` of a **Vite + Svelte** project 
created with `npm create vite@latest`.

```typescript
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import vitePluginSingleSpa from 'vite-plugin-single-spa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte(), vitePluginSingleSpa({ /* options go here */})],
});
```

The options passed to the plug-in factory function determine the type of project (root or micro-frontend).  For 
micro-frontend projects, the server port is required, while for root projects the type is required.

Additionally for micro-frontend projects, the file `src/spa.ts/js/jsx/tsx` must be created.  This file becomes the 
main export of the project and should export the `single-spa` lifecycle functions.

## single-spa Root Projects

The `single-spa` *root project* (referred to as *root config* within the `single-spa` documentation) is the project 
that loads all other micro-frontends and the one that has the `single-spa` package installed, and the one that 
typically calls `registerApplication()` and `start()`.  The `single-spa` developers advertise as a best practice to 
make a root project that uses no framework.  In other words, that your root project be devoided of all user interface 
elements.  This is a view I don't share, and this plug-in is capable of making a suitable Vite + XXX root project.  In 
the end, the choice is yours.

### Root Project Options

The plug-in options available to root projects are dictated by the following TypeScript type:

```typescript
export type SingleSpaRootPluginOptions = {
    type: 'root';
    importMaps?: {
        type?: 'importmap' | 'overridable-importmap' | 'systemjs-importmap' | 'importmap-shim';
        dev?: string | string[];
        build?: string | string[];
    };
    imo?: boolean | string | (() => string);
    imoUi?: boolean | 'full' | 'popup' | 'list' | {
        variant?: boolean | 'full' | 'popup' | 'list';
        buttonPos?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
        localStorageKey?: string;
    };
};
```

The `type` property is mandatory for root projects and must be the string `'root'`, as seen.  The other options 
pertain to the use of import maps and the `import-map-overrides` package.  Long story short:  Vite, while in 
development mode, inserts the script `@vite/client` as first child in the HTML page's `<head>` element, and this makes 
the import maps non-functional, at least for the native `importmap` type.  The solution:  Make this plug-in add both 
the import map script and the `import-map-overrides` package as first children of the `<head>` HTML element.

The `imo` option is used to control the inclusion of `import-map-overrides`.  Set it to `false` to exclude it; set to 
`true` to include its latest version from **JSDelivr**.  However, production deployments should never let unknown 
versions of packages to be loaded without prior testing, so it really isn't good practice to just say "include the 
latest version".  Instead, specify the desired package version as a string.  The current recommended version of 
`import-map-overrides` is **v3.1.0** (but always check for yourself).

```typescript
vitePluginSingleSpa({
    type: 'root',
    imo: '3.1.0'
})
```

Just like the case of the latest version, this will also use the **JSDelivr** network.

> **IMPORTANT**:  Even if you request `import-map-overrides` to be included, it won't be included if no import maps 
are present.

If you wish to change the source of the package from **JSDelivr** to something else, then provide a function that 
returns the package's URL.

```typescript
vitePluginSingleSpa({
    type: 'root',
    imo: () => `https://my.cdn.example.com/import-map-overrides@3.1.0`
})
```

The `imoUi` property controls the inclusion of the `import-map-overrides` user interface.  The property's default 
value is `true`, which is equivalent to `full`.  The values `full`, `popup` and `list` refer to the type of user 
interface.  Refer to the package's documentation in case this is confusing.

By default, the user interface will be configured to appear in the bottom right corner and become visible on the 
presence of the `imo-ui` local storage variable.  If any of this is inconvenient, specify the value of `imoUi` as an 
object with the `variant`, `buttonPos` and `localStorageKey` properties set to your liking.

We finally reach the `importMaps` section of the options.  Use this section to specify the import map type and file 
names.  The default behavior is to automatically import maps from the file `src/importMap.dev.json` whenever Vite runs 
in `serve` mode (when you run the project with `npm run dev`), or the file `src/importMap.json` whenever vite runs in 
`build` mode (when you run `npm run build`).  Note, however, that if you have no need to have different import maps, 
then you can omit `src/importMap.dev.json` and just create `src/importMap.json`.

Usually, the development import map would look like this:

```json
{
    "imports": {
        "@learnSspa/spa01": "http://localhost:4101/src/spa.ts",
        "@learnSspa/spa02": "http://localhost:4102/src/spa.ts"
    }
}
```

This is because, while using `npm run dev`, no bundling takes place, so we directly reference the module in the `/src` 
folder.

Building the micro-frontend, on the other hand, produces a `spa.js` bundle at the root of the `dist` folder, so the 
building import map would look like this:

```json
{
    "imports": {
        "@learnSspa/spa01": "http://localhost:4101/spa.js",
        "@learnSspa/spa02": "http://localhost:4102/spa.js"
    }
}
```

Of course, that would be if you were building to **test locally** the build using `npm run preview`.  Whenever 
building for deployment, it will be more like this:

```json
{
    "imports": {
        "@learnSspa/spa01": "/spa01-prefix/spa.js",
        "@learnSspa/spa02": "/spa02-prefix/spa.js"
    }
}
```

The above is a popular Kubernetes deployment option:  Set the K8s ingress up so that requests that start with the 
micro-frontend prefix are routed to the pod that serves that micro-frontend.  In the end the final look of the import 
map is up to you and your deployment setup.

Now, what if you want or need to specify a different file name for your import maps?  No problem.  Use 
`importMaps.dev` to specify the serve-time import map file; use `importMaps.buid` to specify the build-time import map 
file.

As seen in the TypeScript definition, you can specify the type of import map you want.  The four choices are the four 
possible options for the `import-map-overrides` package, and if not specified, it will default to 
`overridable-importmap`.  Once again, I deviate from `single-spa`'s recommendation of using `SystemJS` as the module 
import solution.  Long story short:  Native import maps, except for one bug, seem to work just fine, and I am pro 
minimizing package dependencies in projects.  Furthermore, if you read the 
[Vite ecosystem page](https://single-spa.js.org/docs/ecosystem-vite/), you'll see that `SystemJS` is recommended 
because, and I quote:

> since browser support for Import Maps is still pending

This is no longer the case as seen in the [caniuse](https://caniuse.com/?search=import%20map) website.

If you're confused about all this import map type thing, read all about this import map topic in the 
[import-map-overrides](https://github.com/single-spa/import-map-overrides) website.

#### Using More Import Map Files

> Since **v0.3.0**

In `single-spa` applications, it is common to need shared modules, and it so happens to be very practical to list them 
as import map entries.  For example, one could have something like this:

```json
{
    "imports": {
        "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js",
        "react": "https://cdn.jsdelivr.net/npm/react@18.2.0/+esm",
        "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm",
        "@learnSspa/mifeA": "http://localhost:4101/src/spa.tsx"
    }
}
```

Because those shared entries (`vue`, `react`, `react-dom`) need to be specified for both Vite modes (`serve` and 
`build`), the most practical thing is to have a third import map file that is used in both scenarios.  To support this 
kind of import map construction, the properties `importMaps.dev` and `importMaps.build` can also accept an array of 
string values to specify multiple file names.  If you opt for this option, there is no "default file by omission" and 
you must specify all your import map files explicitly.

Create 3 import map JSON files:  `src/importMap.json`, `src/importMap.dev.json` and `src/importMap.shared.json`.  Now 
specify the import map files as an array:

```typescript
vitePluginSingleSpa({
    type: 'root',
    importMaps: {
        dev: ['src/importMap.dev.json', 'src/importMap.shared.json'],
        build: ['src/importMap.json', 'src/importMap.shared.json'],
    }
})
```

This is of course a mere suggestion.  Feel free to arrange your import maps any way you feel is best.  Two, three or 
50 import map files.  Create import map files until your heart is content.

## single-spa Micro-Frontend Projects

A micro-frontend project in `single-spa` is referred to as a micro-frontend or a *parcel*.  Micro-frontends are the 
ultimate goal:  Pieces of user interface living as entirely separate projects.

### Micro-Frontend Project Options

The plug-in options available to micro-frontend projects are dictated by the following TypeScript type:

```typescript
export type SingleSpaMifePluginOptions = {
    type?: 'mife';
    serverPort: number;
    spaEntryPoints?: string | string[];
    projectId?: string;
};
```

The `type` property may be omitted, but if specified, it must be the string `'mife'`.

The `serverPort` property is relevant to the correct configuration of `single-spa` and therefore, it is something this 
package must know, or things will become harder to configure between the micro-frontends and the root project.

Especifically, micro-frontend projects are linked to the root project by means of its import map.  During development, 
the import map will usually point to the micro-frontend's entry file with a full URL similar to 
`http://localhost:4444/src/spa.ts`, where `4444` is the server's port number.  It is very difficult to imagine a 
`single-spa` project that works with dynamic ports.

> Since **v0.4.0**

The `spaEntryPoints` property has a default value of `src/spa.ts` and is used to specify all the files that export 
`single-spa` modules (modules that export `bootstrap`, `mount` and `unmount`).  Most of the time, there is only one 
such file (the one that exports the micro-frontend), but if the micro-frontend exposes parcels, those are specified 
here as well.  If you need to specify more than one file, use an array of strings.

The default file name is certainly handy, but it is opinionated:  It is a TypeScript file (the plug-in's author's 
preference).  If your file name differs, even if only by file extension, use `spaEntryPoints` to specify it.

> Since **v0.2.0**

At the bottom we see `projectId`.  This is necessary for CSS tracking.  In a `single-spa`-enabled application, there 
will be (potentially) many micro-frontends coming and going in and out of the application's page.  The project ID is 
used to name the CSS bundles during the micro-frontend building process.  Then, at runtime, this identifier is used to 
discriminate among all the CSS link elements in the page to properly mount and unmount them.  If not provided, the 
plug-in will use the project's name from `package.json`.  Make sure the project has a name, or provide a value for 
this property.

> **NOTE**:  The `projectId` value will be trimmed to 20 characters if a longer value is found/specified.

## Mounting and Unmounting CSS

> Since **v0.2.0**

Vite comes with magic that inserts a micro-frontend's CSS in the root project's index page when it is mounted.  One 
more thing to love about Vite, for sure.  However, this is lost when the project is built.

This plug-in provides an extension module that provides ready-to-use `single-spa` lifecycle functions for the bundled 
CSS.  It is very simple to use.  The following is an example of the spa entry file `src/spa.tsx` of a Vite + React 
project created with `npm create vite@latest`:

```typescript
import React from 'react';
import ReactDOMClient from 'react-dom/client';
// @ts-ignore
import singleSpaReact from 'single-spa-react';
import App from './App';
import { cssLifecycle } from 'vite-plugin-single-spa/ex';

const lc = singleSpaReact({
    React,
    ReactDOMClient,
    rootComponent: App,
    errorBoundary(err: any, _info: any, _props: any) {
        return <div>Error: {err}</div>
    }
});

export const bootstrap = [cssLifecycle.bootstrap, lc.bootstrap];
export const mount = [cssLifecycle.mount, lc.mount];
export const unmount = [cssLifecycle.unmount, lc.unmount];
```

All you have to do to harness this functionality is to import `cssLifecycle` from the extension module named 
`vite-plugin-single-spa/ex`, and return the functions as shown above.  This should work for any framework, not just 
React.

## Vite Environment Information

> Since **v0.2.0**

The same extension module that provides CSS lifecycle functions also provides basic information about the Vite 
environment.  Especifically, it exports the `viteEnv` object which is described as:

```typescript
export const viteEnv: {
    serving: boolean,
    built: boolean,
    mode: string
};
```

The `serving` property will be true if the project is being served by Vite in `serve` mode.  The `built` property will 
be true if the project is being run after being built.  The `mode` property is just the mode used when Vite was run, 
and by default is the string `development` for `serve` mode, and `production` for builds.

> Unlike `cssLifecycles` which is only useful to micro-frontend projects, `viteEnv` is available to root projects as 
well.

To make use of it for whatever purpose, import it:

```typescript
import { viteEnv } from 'vite-plugin-single-spa/ex';
```

## In-Depth Coverage On the Topic

This plug-in was born as the result of investigating `single-spa`, **Svelte** and the general use of Vite-based 
projects.  This investigation was documented in the form of a blog 
[in hashnode](https://webjose.hashnode.dev/series/single-spa-and-svelte).  Feel free to read it in order to fully 
understand how this plug-in works and the reasons behind its behavior.

## Roadmap

- [x] Multiple import map files per Vite command (to support shared dependencies marked `external` in Vite)
- [x] Multiple `single-spa` entry points
- [ ] Option to set development entry point
- [ ] SvelteKit?

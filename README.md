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

Additionally for micro-frontend projects, the file `src/spa.ts|js|jsx|tsx` must be created.  This file becomes the 
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
the import map script and the `import-map-overrides` package as first children of the `<head>` HTML element.  Why did 
I tell the story?  Just so you know that it is impossible to use `import-map-overrides` with Vite "by hand" in `serve` 
mode.

The `imo` option is used to control the inclusion of `import-map-overrides`.  Set it to `false` to exclude it; set to 
`true` to include its latest version from **JSDelivr**.  However, production deployments should never let unknown 
versions of packages to be loaded without prior testing, so it really isn't good practice to just say "include the 
latest version".  Instead, specify the desired package version as a string.

> Check for [releases of import-map-overrides](https://github.com/single-spa/import-map-overrides/releases).

```typescript
vitePluginSingleSpa({
    type: 'root',
    imo: '4.2.0'
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
    imo: () => `https://my.cdn.example.com/import-map-overrides@4.2.0`
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
import map for builds would look like this:

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
[import-map-overrides](https://github.com/single-spa/import-map-overrides) home page.

**UPDATE**:  It seems that `single-spa` v7 is aiming towards working with native modules and native import maps, as 
several peripheral tools have already received updates to default away from `SystemJS` (`create-single-spa`, for 
instance).  What will the final shape be?  I don't know.  We'll have to wait and see when the time comes, and if this 
plug-in continues to be required at all.

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
    assetFileNames?: string;
    cssStrategy?: 'singleMife' | 'multiMife' | 'none';
};
```

The `type` property may be omitted, but if specified, it must be the string `'mife'`.

The `serverPort` property is relevant to the correct configuration of `single-spa` and therefore, it is something this 
package must know, or things will become harder to configure between the micro-frontends and the root project.

Specifically, micro-frontend projects are linked to the root project by means of its import map.  During development, 
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

> Since **v0.6.0**

The `assetFileNames` option works as documented in [Rollup's documentation](https://rollupjs.org/configuration-options/#output-assetfilenames), 
with one exception:  It can only be a string.  Functions may not be passed at this time.  If this is something that 
people need, open an issue in the project's repository and request it.

> `projectId`:  Since **v0.2.0**; `cssStrategy`:  Since **v0.4.0**

At the bottom we see `projectId` and `cssStrategy`.  These are necessary for CSS mounting and unmounting.  In a 
`single-spa`-enabled application, there will be (potentially) many micro-frontends coming and going in and out of the 
application's page.  The project ID is used to name the CSS bundles during the micro-frontend building process.  Then, 
at runtime, this identifier is used to discriminate among all the CSS link elements in the page to properly mount and 
unmount them.  If not provided, the plug-in will use the project's name from `package.json`.  Make sure the project 
has a name, or provide a value for this property.

> **NOTE**:  The `projectId` value will be trimmed to 20 characters if a longer value is found/specified.

The `cssStrategy` has to do with what you, the developer, want to do with the exported micro-frontend/parcel.  Read 
the following section to understand this fully.

## Mounting and Unmounting CSS

> Since **v0.4.0**

> **IMPORTANT**:  CSS lifecycle logic has been completely replaced by a new algorithm as of **v0.4.0**.  The previous 
> `cssLifecycle` object is no longer available, and in its stead you can import the `cssLifecycleFactory` function.

This plug-in provides an extension module that provides ready-to-use `single-spa` lifecycle functions for the bundled 
CSS.  It is very simple to use.  The following is an example of the spa entry file `src/spa.tsx` of a *Vite + React* 
project created with `npm create vite@latest`:

```typescript
import React from 'react';
import ReactDOMClient from 'react-dom/client';
// @ts-expect-error
import singleSpaReact from 'single-spa-react';
import App from './App';
import { cssLifecycleFactory } from 'vite-plugin-single-spa/ex';

const lc = singleSpaReact({
    React,
    ReactDOMClient,
    rootComponent: App,
    errorBoundary(err: any, _info: any, _props: any) {
        return <div>Error: {err}</div>
    }
});
// IMPORTANT:  Because the file is named spa.tsx, the string 'spa'
// must be passed to the call to cssLifecycleFactory.
const cssLc = cssLifecycleFactory('spa', /* optional factory options */);
export const bootstrap = [cssLc.bootstrap, lc.bootstrap];
export const mount = [cssLc.mount, lc.mount];
export const unmount = [cssLc.unmount, lc.unmount];
```

The lifecycle factory algorithm needs to know which entry point it should be creating the lifecycle object for, so it 
is very important that the name passed to the factory coincides *exactly* with the file name (minus the extension).

The object created by the factory (in the example, stored in the `cssLc` variable), **must** be used for every 
exported/created `single-spa` lifecycle object that comes out of the same file (module).

**NOTE**:  The optional factory options control the behavior of the FOUC-prevention feature and what is logged to the 
console.

### Console Logging

> Since **v0.7.0**

The option named `logger` in the options parameter of the `cssLifecycleFactory()` function can be used to control what 
gets logged to the browser's console from the CSS mounting algorithms.  Its default value is `true` and means "log to 
the console".  If set to `false`, then nothing is logged to the console.

There is a third possiblity:  To provide a custom logger object.  The logger only needs to implement the 4 console 
methods `debug()`, `info()`, `warn()` and `error()`.  Use this approach if you need fine-grained control over what 
gets logged to the console, or to even do fancier logging, such as posting the console entries to a remote structured 
log storage, like a **Seq** server.

### CSS Strategy

The `cssLifecycleFactory` function covers both CSS strategies (`singleMife` and `multiMife`).

This new CSS mounting algorithm supports multiple SPA entry points, with single or multiple exports per entry point, 
and mixing micro-frontends with parcels in the same project should also be possible.  If you intend to either mount 
multiple instances of the same parcel or micro-frontend, or export more than one `single-spa` lifecycle object, you 
**must** set the options' `cssStrategy` property to `multiMife`.

If, however, your project simply exports a single micro-frontend or a single parcel that doesn't expect to be 
instantiated more than once simultaneously, then `cssStrategy` can be set to `singleMife`, which is the default value 
for this property.

> **IMPORTANT**:  Most likely, the default value in v1.0.0 will be `multiMife`.  It is actually feasible that the 
`singleMife` strategy might disappear completely, since nobody seems to be using `single-spa`'s `unloadApplication` 
function.

#### Deactivating CSS Mounting

> Since **v0.6.0**

The CSS mounting algorithm in this package relies on some naming convention around bundled CSS files.  If you plan to 
roll out your own CSS mounting algorithm, you may set `cssStrategy` to `none`.  This will effectively deactivate the 
CSS bundle renaming that takes place during building.  This also deactivates `cssLifecycleFactory`.

> Currently investigating if usage of `cssLifecycleFactory` can be detected in order to emit a warning.

### FOUC Prevention

> Since **v0.7.0**

The object created with the `cssLifecycleFactory()` function prevents FOUC (flash of unstyled content) by delaying the 
mounting operation until all the CSS files that the plug-in handles (the CSS bundles created by Vite) are loaded and 
ready to be used by the browser.  This is implemented by subscribing to the LINK element's `load` and `error` events, 
and only returning if the CSS loads, an error occurs, or the specified time elapses (a timeout event).

The following options, which are set when calling `cssLifecycleFactory()`, control the behavior of this feature:

```typescript
export type CssLifecycleFactoryOptions = {
    logger?: boolean | ILogger;
    loadTimeout?: number;
    failOnTimeout?: boolean;
    failOnError?: boolean;
};
```

> Refer to **Console Logging** previously in this document to see about the `logger` option.

Set the `loadTimeout` property to the amount of time to wait for the `load` or `error` events to fire before taking 
action.  Which action?  That depends on the other two properties.

When set to `true`, `failOnTimeout` throws an error that aborts the micro-frontend mounting process, but when set to 
`false`, only a warning is logged to the console.

The last property, `failOnError`, works identically to `failOnTimeout`, except that it applies to the times where the 
CSS fetching process fails.

The default values are, respectively, 1500ms, `false` and `false`.

#### FOUC Prevention Known Facts & Issues

1. `single-spa`, by default, emits minified error message #31 if the mounting process takes 3000ms or more.  Avoid 
setting `loadTimeout` to 3000ms or higher.
2. The CSS mounting algorithm dismounts CSS by disabling CSS LINK elements, and then, if necessary, these are 
re-enabled.  Even though a network call might be generated in the Network tab of the developer tools at the time of 
re-enabling, a `load` event is never fired, meaning that FOUC prevention can only work on the very first time the CSS 
is mounted.

### Important Notes About Generating Multiple Instances of a Parcel or Micro-Frontend

While an incredible library, `single-spa` was not designed to support the mounting of more than one instance of a 
micro-frontend simultaneously, but some of us like this idea.  This CSS mounting algorithm pretend to support as much 
as possible this scenario, as well as the mounting of multiple instances of the same parcel.  However, `single-spa` is 
not really prepared for this, so do this at your own risk.

Speaking of which, there is a bug in the `singleSpaSvelte()` function exported by the `single-spa-svelte` NPM package 
that prevents exporting the way `single-spa` recommends.  Detailed information can be found in 
[this blog post](https://webjose.hashnode.dev/single-spa-parcels-and-vite-plugin-single-spa) or in the 
[logged issue at GitHub](https://github.com/single-spa/single-spa-svelte/issues/28).  The blog post and the issue were 
written prior to the existence of `vite-plugin-single-spa` **v0.4.0**, so make the necessary changes in the proposed 
workaround.

While I haven't tested every helper for every framework/library, there is the possibility that the bug found in the 
`single-spa-svelte` package may exist in others, in which case the factory workaround may work for those too.

### Why You Must Choose the CSS Strategy

The new algorithm is robust and seems to work just fine under the conditions set by the `singleMife` strategy, but 
there is a price to pay:  This new algorithm is incompatible with the idea of using `single-spa`'s `unloadApplication` 
for the purposes of HMR.  In order to allow people to keep the possibility of using `unloadApplication`, the user can 
choose the `singleMife` strategy to keep this HMR ability.

> **IMPORTANT, AGAIN**: Nobody seems to care about `unloadApplication`, so CSS strategies might disappear in v1.0.0.

## Vite Environment Information

> Since **v0.2.0**

The same extension module that provides CSS lifecycle functions also provides basic information about the Vite 
environment.  Specifically, it exports the `viteEnv` object which is described as:

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

> Unlike `cssLifecycleFactory` which is only useful to micro-frontend projects, `viteEnv` is available to root 
projects as well.

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
- [x] Single-SPA parcels
- [x] Multiple `single-spa` entry points
- [x] Logging options
- [x] Asset file name pattern
- [x] CSS `load` event to prevent FOUC
- [x] Logger object for cssLifecycleFactory to allow full control of what renders in the console
- [ ] Input file name pattern?
- [ ] Specify import maps as objects instead of file names
- [ ] Possibly remove the need for CSS strategies (modify `multiMife` so it can re-bootstrap safely)
- [ ] CSS `blocking="render"` attribute on injected LINK elements (experimental feature)? Instead of `load` event to 
prevent FOUC.
- [ ] Allow media query specification for injected CSS LINK elements? (not sure if this is relevant to this plug-in)
- [ ] Option to set development entry point? (there might be a simpler solution)
- [ ] SvelteKit support for root projects?
- [ ] Dual behavior for built projects, as in "this is a standalone website that can also be a MFE".

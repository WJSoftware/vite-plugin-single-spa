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
example, if you want to use `npm ci` to build the project, then you'll need all packages used by Vite's build command 
to have been installed as regular dependencies.  It is up to you how you end up installing the package (dev or 
regular).

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

Except for the options, which are explained below, this should be it for root projects.  For micro-frontend projects, 
the file `src/spa.ts` must be created.  This file becomes the main export of the project and should export the 
`single-spa` lifecycle functions.

## single-spa Root Projects

The `single-spa` *root project* (referred to as *root config* within the `single-spa` documentation) is the project 
that loads all other micro-frontends and the one that has the `single-spa` package installed, and the one that 
typically calls `registerApplication()` and `start()`.  The `single-spa` developers advertise as a best practice, to 
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
        dev?: string;
        build?: string;
    };
    imo?: boolean | string | (() => string);
};
```

The `type` property is mandatory for root projects and must be the string `'root'`, as seen.  The other options 
pertain to the use of import maps and the `import-map-overrides` package.  Long story short:  Vite, while in 
development mode, inserts the script `@vite/client` as first child in the HTML page's `<head>` element, and this makes 
the import maps non-functional, at least for the native `importmap` type.  The solution:  Make this plug-in add both 
the import map script and the `import-map-overrides` package as first children of the `<head>` HTML element, as a post 
action.

The `imo` option is used to control the inclusion of `import-map-overrides`.  Set it to `false` to exclude it; set to 
`true` to include its latest version from the **JSDelivr**.  However, production deployments should never let unknown 
versions of packages to be loaded without prior testing, so it really isn't good practice to just say "include the 
latest version".  Instead, specify the desired package version as a string.  The current recommended version of 
`import-map-overrides` is **v2.4.2** because **v3.0.0** (the latest at the time of this writing) doesn't work.

```typescript
    vitePluginSingleSpa({
        type: 'root',
        imo: '2.4.2'
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
        imo: () => `https://my.cdn.example.com/import-map-overrides@2.4.2`
    })
```

We finally reach the `importMaps` section of the options.  Use this section to specify file names and the import map 
type.  The default behavior is to automatically import maps from the file `src/importMap.dev.json` whenever Vite runs 
in `serve` mode (when you run the project with `npm run dev`), or the file `src/importMap.json` whenever vite runs in 
`build` mode (when you run `npm run build`).  Note, however, that if you have no need to have different import maps, 
then you can omit `src/importMap.dev.json` and just create `src/importMap.json`.

#### Hiatus:  Odd Behavior of Vite's `base` Configuration Property

The previous paragraph brings an important topic:  Even when Vite's documentation clerly states that `base` is used 
both while serving and building, it doesn't respect full URL's while serving.  A full URL is a URL that starts with 
the scheme (`http` or `https`).  Any full URL specified as base, which is what `single-spa` projects need, is reduced 
to its path.

Because of this, this package's documentation has the following to say:

1. Please support the discussion at [Vite's GitHub repository](https://github.com/vitejs/vite/discussions/13927) by 
upvoting it.  It requests Vite's core team to study the possibility to respect full URL's (known in code as external 
URL's) in all modes, not just `build`.
2. As a workaround for correct micro-frontend asset loading, use a set of import maps that use a compiled version of 
your micro-frontends, and serve them using `npm run preview`.  This requires that you first run `npm run build`.

Usually, the development import maps would look like this:

```json
{
    "imports": {
        "@learnSspa/spa01": "http://localhost:4101/src/spa.ts",
        "@learnSspa/spa02": "http://localhost:4102/src/spa.ts"
    }
}
```

This is because, while using `npm run dev`, no bundling takes place.  If you decide that you cannot properly test or 
develop your micro-frontend with the assets missing (images, fonts, etc.), then you'll have to use `npm run preview` 
and this requires the import maps to point to the built, or bundled, `spa.js`:

```json
{
    "imports": {
        "@learnSspa/spa01": "http://localhost:4101/spa.js",
        "@learnSspa/spa02": "http://localhost:4102/spa.js"
    }
}
```

---

Back to configuring import maps...

What if you want or need to specify a different file name for your import maps?  No problem.  Use `importMaps.dev` to 
specify the serve-time import map file; use `importMaps.buid` to specify the build-time import map file.

As seen in the TypeScript definition, you can specify the type of import map you want.  The four choices are the four 
possible options for the `import-map-overrides` package, and if not specified, it will default to 
`overridable-importmap`.  Once again, I deviate from `single-spa`'s recommendation of using `SystemJS` as the module 
import solution.  Long story short:  Native import maps, except for one bug, seem to work just fine, and I am pro 
minimizing package dependencies in projects.

> Read all about this import map topic in the [import-map-overrides](https://github.com/single-spa/import-map-overrides) 
website.

## single-spa Micro-Frontend Projects

A micro-frontend project in `single-spa` is referred as a micro-frontend or a *parcel*.  Micro-frontends are the 
ultimate goal:  Pieces of user interface living as entirely separate projects.

### Micro-Frontend Project Options

The plug-in options available to micro-frontend projects are dictated by the following TypeScript type:

```typescript
/**
 * Defines the plug-in options for Vite projects that are single-spa micro-frontentds.
 */
export type SingleSpaMifePluginOptions = {
    type?: 'mife';
    serverPort: number;
    deployedBase?: string;
    spaEntryPoint?: string;
};
```

The `type` property may be omitted, but if specified, it must be the string `'mife'`.

The `serverPort` property is relevant to the correct configuration of `single-spa` and therefore, it is something this 
package must know, or things will become harder to configure between the micro-frontends and the root project.

Especifically, micro-frontend projects are linked to the root project by means of its import map.  During development, 
the import map will usually point to the micro-frontend's entry file with a full URL similar to 
`http://localhost:4444/src/spa.ts`, where `4444` is the server's port number.  This URL host name and port values must 
be set as the Vite project's `base` string for assets (images, fonts, etc.) to be properly served during development.

> **IMPORTANT**:  As already mentioned, `base` has an odd behavior that makes this base-setting exercise futile, so 
please upvote the [GitHub discussion](https://github.com/vitejs/vite/discussions/13927) that wants to start a change 
on this topic.

The `deployedBase` property is applied as Vite's `base` property during build (`npm run build`).  Specify what makes 
sense to your project.  For example, a Kubernetes deployment under a single domain name would probably use path 
prefixes for the individual micro-frontends, such as `/mifeA`.  Use this property to specify this prefix.

> **IMPORTANT**:  This version of the plug-in has code to set the base to `http://localhost:<server port>` if building 
and `deployedBase` is empty.  This has been made like this to support the workaround of working locally the 
micro-frontend by means of building and previewing.

The last property, `spaEntryPoint`, has a default value of `src/spa.ts` and is used to specify the module that exports 
all of the `single-spa`'s lifecycle functions (`bootstrap`, `mount` and `unmount`).  If your entry module's file name 
differs, use this property to specify it.  Note that if your project is not using TypeScript, you'll still have to 
specify this property just to change the file extension.

## In-Depth Coverage On the Topic

This plug-in was born as the result of investigating `single-spa`, **Svelte** and the general use of Vite-based 
projects.  This investigation was documented in the form of a blog 
[in hashnode](https://webjose.hashnode.dev/series/single-spa-and-svelte).  Feel free to read it in order to fully 
understand how this plug-in works and the reasons behind its behavior.  You'll also find helpful examples about almost 
anything related to this topic, including `single-spa` entry modules that mount and unmount CSS.

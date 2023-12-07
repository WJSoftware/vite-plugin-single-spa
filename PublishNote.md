> This plug-in is still experimental.  Feel free to provide feedback and even contribute.

## Changelog

### v0.6.0

+ Added `assetFileNames` to the micro-frontend options to freely control the asset bundle names.
+ Added the `none` CSS strategy value to deactivate CSS renaming.
+ Fix:  Correct export of `cssLifecycleFactory` while in Vite's `serve` mode.

### v0.5.1

+ Support for Vite v5.
+ Corrected the JsDoc for `cssLifecycleFactory`.
+ Added `exports` field to package.json for better Intellisense (requires TypeScript v4.7 or better).  Now VS Code 
will correctly autocomplete when you start typing `import csslifec` (will autocomplete to 
`import { cssLifecycleFactory } from 'vite-plugin-single-spa/ex'`).  The same goes for `import viteen`.
+ Changed the return type of `cssLifecycleFactory` to be explicit that it does **not** provide the `update` function.

### v0.4.0

+ Support for multiple entry point files.
+ Support for multiple `single-spa` exports (in one or multiple files), or multiple instances of the same parcel or 
micro-frontend.
+ Major change in CSS Mounting.  Be sure to read about it.
+ Logging options (not documented, but Intellisense should reveal them).

#### BREAKING CHANGES

+ The `cssLifecycle` object has been removed.  Use `cssLifecycleFactory` instead.
+ The `spaEntryPoint` property has been renamed to `spaEntryPoints`.

---

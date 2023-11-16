> This plug-in is still experimental.  Feel free to provide feedback and even contribute.

## Changelog

### v0.4.0

+ Support for multiple entry point files.
+ Support for multiple `single-spa` exports (in one or multiple files), or multiple instances of the same parcel or 
micro-frontend.
+ Major change in CSS Mounting.  Be sure to read about it.
+ Logging options (not documented, but Intellisense should reveal them).

#### BREAKING CHANGES

+ The `cssLifecycle` object has been removed.  Use `cssLifecycleFactory` instead.
+ The `spaEntryPoint` property has been renamed to `spaEntryPoints`.

> This plug-in is in the early experimental stages.  Feel free to provide feedback and even contribute.

## Changelog

### v0.0.3

+ Deleted the root options `includeImo` and `imoVersion` in favor of a single `imo` option.
+ Documented options' properties in JSDoc.
+ Made the `serverPort` option mandatory.
+ Moved the setting of Vite's `base` property to the `build` command to support working locally with `npm run preview`.
+ Added logging the resolved value of `base` so it is visible in the console when building or serving.
---

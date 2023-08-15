> This plug-in is still experimental, but looks promising.  Feel free to provide feedback and even contribute.

## Changelog

### v0.1.0

+ Plug-in now adds by default the <import-map-overrides-full> HTML element to the body of the root project's index 
page.
+ **AUTOMATIC CSS LIFECYCLES!**  Use the dynamic modue "vite-plugin-single-spa/ex" in the micro-frontend to mount and 
unmount CSS.
+ Removed manifest and target settings.  They were too opinionated.  Set them yourself if you want.

### v0.0.3

+ Deleted the root options `includeImo` and `imoVersion` in favor of a single `imo` option.
+ Documented options' properties in JSDoc.
+ Made the `serverPort` option mandatory.
+ Moved the setting of Vite's `base` property to the `build` command to support working locally with `npm run preview`.
+ Added logging the resolved value of `base` so it is visible in the console when building or serving.
---

> This plug-in is still experimental.  Feel free to provide feedback and even contribute.

## Changelog

### v0.2.0

+ Support for split CSS (happens when lazy loading components).
+ Asset serving while in serve mode!

#### Breaking Changes

+ The `deployedBase` configuration property is now gone.  Configure your deployment base as per usual using Vite's 
`base` property.

### v0.1.0

+ Plug-in now adds by default the <import-map-overrides-full> HTML element to the body of the root project's index 
page.
+ **AUTOMATIC CSS LIFECYCLES!**  Use the dynamic modue "vite-plugin-single-spa/ex" in the micro-frontend to mount and 
unmount CSS.
+ Removed manifest and target settings.  They were too opinionated.  Set them yourself if you want.

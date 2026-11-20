# vite-plugin-single-spa

> ⚠️ **DEPRECATION NOTICE**
> 
> This package is now deprecated.  Migrate your projects to [CollageJS](https://collagejs.dev) for the next evolution of this plug-in, seek another micro-frondends solution, or stay on `single-spa` at your own discretion.

![CollageJS](https://raw.githubusercontent.com/collagejs/core/HEAD/src/logos/collagejs-512.svg)

## CollageJS:  An Evolution to single-spa and This Plug-In

[Website and documentation](https://collagejs.dev)

[CollageJS' Core Repository](https://github.com/collagejs/collagejs)

I created *CollageJS* as an evolution of the excellent `single-spa` routing library for micro-frontends.  *CollageJS* drops the routing capabilities and focuses only on mounting, unmounting and updating micro-frontends.  Routing can be accomplished with one of the *many* routers in existence, both framework-agnostic and framework-specific.

## Migration

Since *CollageJS* doesn't provide routing, the "difficult" part is substituting routing with a router of your own preference.  The migration guide (URL below) proposes an alternative and even a template project for quick-starting migrations of root projects.

Once routing is sorted, migrating dozens of `single-spa` micro-frontend/parcel projects powered by `vite-plugin-single-spa` to *CollageJS* can be done in one day.

[Migration Guide from single-spa](https://collagejs.dev/guides/migration-from-single-spa)

## Advantages of Migrating

- Vite v8 plug-ins
- Auto-externalization of import map entries, even in micro-frontend projects while in DEV mode (`npm run dev`)
- New import map-overriding package with a modern user interface
- Adapters for more modern frameworks and framework versions
- Ability to mount in shadow DOM
- Better CSS mounting logic that is no longer dependant on Vite's `base` option
- Etc.

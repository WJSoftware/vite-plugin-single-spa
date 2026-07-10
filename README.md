# vite-plugin-single-spa

As you may or may not know, `single-spa` creator [Joel/Jolyn Denning passed away in 2025](https://github.com/single-spa/single-spa/issues/1361#issuecomment-3991093643) ([obituary](https://www.broomheadfuneralhome.com/obituary/joel-denning)).  This, *in my very own personal opinion*, also means the death of `single-spa`.

It's been a fun ride, and it is now time to move on.

![CollageJS](https://raw.githubusercontent.com/collagejs/core/HEAD/src/logos/collagejs-512.svg)

## You're Invited to CollageJS!

I would like to let you all know that I have created an alternative, inspired by the concept of `single-spa` parcels.  I have named it *CollageJS*.

This is the main repository:  [CollageJS Repository][https://github.com/collagejs/collagejs]

I strongly believe that `single-spa` users will feel it very familiar, especially the ones using `vite-plugin-single-spa` (this plug-in).  Its documentation site is not yet up and running but should go live soon.

Head over to *CollageJS* and give it a try.  While more focused and smaller, it does pack very interesting new features, such as:

1. Auto-externalization of anything in the import map while running Vite's dev server (`npm run dev`)
2. Static imports from micro-frontends (named *CollageJS* pieces) is allowed; no more dynamic `import()` everywhere!
3. Ability to mount *CollageJS* pieces in shadow DOM
4. Ability to mount multiple copies of the same *CollageJS* piece
5. All written in TypeScript from day 1
6. A modern version of `import-map-overrides` named `@collagejs/imo`
7. The ability to package *CollageJS* pieces in NPM packages (`@collagejs/imo`'s user interface is a *CollageJS* piece)
8. More to come, hopefully including SSR support
> This plug-in is still experimental.  Feel free to provide feedback and even contribute.

## Call for Feedback

A poll about the use of `single-spa`'s `unloadApplication()` function has been opened.  It will help the development 
of this plug-in if you could [visit this poll](https://github.com/WJSoftware/vite-plugin-single-spa/discussions/98) 
and voted.

> **Please vote even if you don't know about this function (it is a possible vote option).**

## Changelog

### v0.7.0

+ **FEATURE**:  FOUC prevention.  CSS mounting now awaits the `load` event of CSS LINK elements before mounting the 
micro-frontends.

### v0.6.1

+ Fix:  Dynamic CSS links from other micro-frontends were being disabled by unloading a micro-frontend using the 
`singleMife` or `multiMife` CSS strategy if said links were loaded after the micro-frontend.
+ Fix:  Dynamic CSS links would not be tracked under the `multiMife` CSS strategy after unloading all parcels of a 
project and then loading another.

---

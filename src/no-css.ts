const noCss = () => Promise.resolve();

export const cssLifecycle = {
    bootstrap: noCss,
    mount: noCss,
    unmount: noCss
};

const noCss = () => Promise.resolve();

export function cssLifecycleFactory(entryPoint: string) {
    return {
        bootstrap: noCss,
        mount: noCss,
        unmount: noCss
    };
};

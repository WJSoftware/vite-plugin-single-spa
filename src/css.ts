/// <reference types="vite/client" />

let linkEls: HTMLLinkElement[];
const cssFiles = ['{CSS_FILE_LIST}'];

function bootstrap() {
    linkEls = [];
    const base = import.meta.env.BASE_URL;
    if (cssFiles.length === 0) {
        return Promise.resolve();
    }
    for (let css of cssFiles) {
        const el = globalThis.document.createElement('link');
        el.rel = 'stylesheet';
        el.href = base + (base.endsWith('/') ? '' : '/') + css;
        linkEls.push(el);
    }
    return Promise.resolve();
}

function mount() {
    if (cssFiles.length === 0) {
        return Promise.resolve();
    }
    for (let el of linkEls) {
        globalThis.document.head.appendChild(el);
    }
    return Promise.resolve();
}

function unmount() {
    if (cssFiles.length === 0) {
        return Promise.resolve();
    }
    for (let el of linkEls) {
        globalThis.document.head.removeChild(el);
    }
    return Promise.resolve();
}

export const cssLifecycle = {
    bootstrap,
    mount,
    unmount
};

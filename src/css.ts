/// <reference types="vite/client" />

let observer: MutationObserver | undefined;
let vpssLinkEls: HTMLLinkElement[];
let autoLinkEls: HTMLLinkElement[] = [];
const projectId = '{vpss:PROJECT_ID}';
const cssFiles = ['{vpss:CSS_FILE_LIST}'];

function isLinkElement(el: Node): el is HTMLLinkElement {
    return el.nodeName === 'LINK';
}

function observeHead() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            if (m.addedNodes.length > 0) {
                m.addedNodes.forEach(an => {
                    if (isLinkElement(an) && an.rel === 'stylesheet' && an.href.indexOf(`vpss(${projectId})`)) {
                        (!an.getAttribute('data-vpss') ? vpssLinkEls : autoLinkEls).push(an);
                    }
                });
            }
        });
    });
    observer.observe(globalThis?.document?.head, {
        childList: true
    });
    return observer;
}

function bootstrap() {
    observer?.disconnect();
    observer = observeHead();
    vpssLinkEls?.forEach(el => globalThis.document.head.removeChild(el));
    vpssLinkEls = [];
    const base = import.meta.env.BASE_URL;
    if (cssFiles.length === 0) {
        return Promise.resolve();
    }
    for (let css of cssFiles) {
        const el = globalThis.document.createElement('link');
        el.rel = 'stylesheet';
        el.href = base + (base.endsWith('/') ? '' : '/') + css;
        el.setAttribute('data-vpss', 'true');
        el.disabled = true;
        globalThis.document.head.appendChild(el);
    }
    return Promise.resolve();
}

function mount() {
    if (cssFiles.length > 0) {
        for (let el of vpssLinkEls) {
            el.disabled = false;
        }
    }
    for (let el of autoLinkEls) {
        el.disabled = false;
    }
    return Promise.resolve();
}

function unmount() {
    if (cssFiles.length > 0) {
        for (let el of vpssLinkEls) {
            el.disabled = true;
        }
    }
    for (let el of autoLinkEls) {
        el.disabled = true;
    }
    return Promise.resolve();
}

export const cssLifecycle = {
    bootstrap,
    mount,
    unmount
};

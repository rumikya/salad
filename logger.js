export const DEBUG_MODE = false;


export const logger = DEBUG_MODE ? {
    log: console.log.bind(console),
    info: console.info.bind(console),

    error: console.error.bind(console),
    warn: console.warn.bind(console)
} : {
    log: () => {},
    info: () => {},
    error: () => { },
    warn: () => { },
}

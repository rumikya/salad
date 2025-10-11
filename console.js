const isProd = !window.location.hostname.includes('localhost') && !window.location.hostname.includes("127.0.0.1");
const profile = isProd ? 'prod' : 'dev';

// Example usage
const originalConsoleLog = window.console.log;
const originalConsoleInfo = window.console.info;
const originalConsoleError = window.console.error;
const originalConsoleWarn = window.console.warn;

window.console.log = function (...args) {
    if(profile == "prod") return;
    originalConsoleLog(...args);
}

window.console.info = function (...args) {
    if(profile == "prod") return;
    originalConsoleInfo(...args);
}

window.console.error = function (...args) {
    if(profile == "prod") return;
    originalConsoleError(...args);
}

window.console.warn = function (...args) {
    if(profile == "prod") return;
    originalConsoleWarn(...args);
}

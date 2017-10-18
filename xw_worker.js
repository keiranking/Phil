let onRuntimeInitialized;
let emscriptenPromise = new Promise((resolve, reject) => {
    onRuntimeInitialized = resolve;
});
var Module = {
    wasmBinaryFile: "third_party/glucose-3.0/simp/xwsolve.wasm",
    onRuntimeInitialized: onRuntimeInitialized
};
importScripts('third_party/glucose-3.0/simp/xwsolve.js');
function process(data) {
    FS.writeFile('/wordlist', data[0]);
    FS.writeFile('/puz', data[1]);
    let isQuick = data[2];
    console.log('calling main');
    let args = ['-no-pre', '/wordlist', '/puz'];
    if (isQuick) {
        args.splice(0, 0, '-thresh1=13', '-thresh2=10');
    }
    Module.callMain(args);
    if (EXITSTATUS == 0) {
        postMessage(['done', FS.readFile('/puz', {encoding: 'utf8'})]);
    } else {
        postMessage(['unsat']);
    }
}
let messagePromise = new Promise((resolve, reject) => {
    onmessage = function(e) {
        resolve(e.data);
    }
});
emscriptenPromise.then((dummy) => {
    messagePromise.then((data) => {
        process(data);
        // As of now, each invocation of the worker processes
        // exactly one puzzle. It might be a good idea to keep
        // the worker alive for multiple puzzles.
        close();
    });
});

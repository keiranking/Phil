let onRuntimeInitialized;
let emscriptenPromise = new Promise((resolve, reject) => {
    onRuntimeInitialized = resolve;
});
var Module = {
    wasmBinaryFile: "third_party/glucose-3.0/simp/xwsolve.wasm",
    onRuntimeInitialized: onRuntimeInitialized,
};
importScripts('third_party/glucose-3.0/simp/xwsolve.js');
onmessage = function(e) {
    emscriptenPromise.then((dummy) => {
        let cmd = e.data;
        switch (cmd[0]) {
            case 'run':
                FS.writeFile('/wordlist', cmd[1]);
                FS.writeFile('/puz', cmd[2]);
                let isQuick = cmd[3];
                console.log('calling main');
                let args = ['-no-pre', '/wordlist', '/puz'];
                if (isQuick) {
                  // args.splice(0, 0, '-compute-forced', '-thresh1=13', '-thresh2=10');
                  args.splice(0, 0, '-thresh1=13', '-thresh2=10');
                }
                Module.callMain(args);
                break;
            case 'cancel':
                Module.ccall('cancel', 'void', [], []);
                break;
        }
    });
}

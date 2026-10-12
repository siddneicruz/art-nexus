// Copia o jogo (pasta jogo/) para www/, que é o que o Capacitor empacota no APK.
const fs = require("fs"), path = require("path");
fs.rmSync("www", { recursive: true, force: true });
fs.cpSync("jogo", "www", { recursive: true });
fs.rmSync(path.join("www", "sw.js"), { force: true });   // no app o próprio APK já guarda os arquivos
let h = fs.readFileSync("www/index.html", "utf8");
fs.writeFileSync("www/index.html", h);
console.log("www pronto");

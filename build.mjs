// Inlines src/ into one self-contained dist/index.html: CSS into <style>, the ES
// modules concatenated into one IIFE (imports stripped, JSON imports replaced by
// consts). No runtime fetches; the page works from file:// and any static host.
// Naive by design: modules must use single-line `import`/`export const|let|function`
// forms and unique top-level names across files. The checks below enforce that.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(root, f), 'utf8');

// Fixed order = evaluation order. state.js must precede studio.js (module-scope
// `const W = S.write`), utils.js precedes everything.
const ORDER = ['utils.js','state.js','data.js','audio.js','notation.js','keyboard.js','engine.js','studio.js','midi.js','main.js'];

const inlinedJson = new Set();
let js = '';
for (const f of ORDER) {
  let code = read('src/' + f);
  code = code.replace(/^import\s+(\w+)\s+from\s+'\.\/([\w.-]+\.json)'\s+with\s*\{\s*type:\s*'json'\s*\};?\s*$/gm, (_, name, file) => {
    if (inlinedJson.has(name)) return '';
    inlinedJson.add(name);
    return `const ${name} = ${JSON.stringify(JSON.parse(read('src/' + file)))};`;
  });
  code = code.replace(/^import\s[^\n]*$/gm, '');
  code = code.replace(/^export\s+(?=(const|let|function|async function)\b)/gm, '');
  js += `// ---------- ${f} ----------\n` + code.trim() + '\n\n';
}

const leftover = js.match(/^(import|export)\b.*$/m);
if (leftover) { console.error('build: unhandled module syntax: ' + leftover[0]); process.exit(1); }

const bundle = `(() => {\n'use strict';\n${js}})();`;
const html = read('src/page.html')
  .split('/*__MIDDLE_C_CSS__*/').join(read('src/themes.css').trim())
  .split('//__MIDDLE_C_JS__').join(bundle);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
console.log(`dist/index.html: ${(html.length / 1024).toFixed(1)} KB`);

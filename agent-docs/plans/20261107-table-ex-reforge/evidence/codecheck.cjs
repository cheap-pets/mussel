// 终验辅助：对指定文件做 HEAD vs 工作区「去注释代码流」对比。
// 用法：node codecheck.cjs <file> ...
// 输出：每个文件 CODE-IDENTICAL（零代码 token 变更）或 CODE-DIFF + 差异行（old→new）。
// 注释剥离：// 与 /* */（js/scss/vue），vue 另支持 <!-- -->；字符串内的 // 不剥离。
const { execSync } = require('child_process');

function stripComments(src, mode) {
  const lines = [];
  let cur = '';
  let state = 'code'; // code | line | block | html
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const c2 = src.substr(i, 2);
    if (c === '\n') {
      lines.push(cur); cur = '';
      if (state === 'line') state = 'code';
      i++; continue;
    }
    if (state === 'code') {
      if (mode === 'vue' && src.substr(i, 4) === '<!--') { state = 'html'; i += 4; continue; }
      if (c === '"' || c === "'" || c === '`') {
        const q = c; cur += c; i++;
        while (i < n && src[i] !== q && src[i] !== '\n') {
          if (src[i] === '\\') { cur += src.substr(i, 2); i += 2; continue; }
          cur += src[i]; i++;
        }
        if (i < n && src[i] === q) { cur += q; i++; }
        continue;
      }
      if (c2 === '//') { state = 'line'; i += 2; continue; }
      if (c2 === '/*') { state = 'block'; i += 2; continue; }
      cur += c; i++; continue;
    }
    if (state === 'line') { i++; continue; }
    if (state === 'block') { if (c2 === '*/') { state = 'code'; i += 2; } else i++; continue; }
    if (state === 'html') { if (src.substr(i, 3) === '-->') { state = 'code'; i += 3; } else i++; continue; }
  }
  lines.push(cur);
  return lines;
}

function codeStream(src, mode) {
  return stripComments(src, mode)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 0);
}

function lcsDiff(a, b) {
  const m = a.length, nn = b.length;
  // LCS DP（限制规模：>5000 行直接报错防爆炸）
  if (m * nn > 25e6) return [{ type: 'TOOBIG', oldCount: m, newCount: nn }];
  const dp = new Int32Array((m + 1) * (nn + 1));
  const W = nn + 1;
  for (let i = m - 1; i >= 0; i--) {
    for (let j = nn - 1; j >= 0; j--) {
      dp[i * W + j] = a[i] === b[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    }
  }
  const out = [];
  let i = 0, j = 0;
  while (i < m && j < nn) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) { out.push({ type: 'del', idx: i, text: a[i] }); i++; }
    else { out.push({ type: 'add', idx: j, text: b[j] }); j++; }
  }
  while (i < m) { out.push({ type: 'del', idx: i, text: a[i] }); i++; }
  while (j < nn) { out.push({ type: 'add', idx: j, text: b[j] }); j++; }
  return out;
}

function modeOf(f) {
  if (f.endsWith('.vue')) return 'vue';
  if (f.endsWith('.scss')) return 'scss';
  return 'js';
}

const files = process.argv.slice(2);
for (const f of files) {
  let oldSrc;
  try { oldSrc = execSync(`git show HEAD:${f}`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { console.log(`FILE ${f}\n  NO-HEAD-BASELINE (untracked/new): ${e.status}`); continue; }
  const fs = require('fs');
  let newSrc;
  try { newSrc = fs.readFileSync(f, 'utf8'); }
  catch (e) { console.log(`FILE ${f}\n  DELETED-IN-WORKTREE`); continue; }
  const mode = modeOf(f);
  const a = codeStream(oldSrc, mode);
  const b = codeStream(newSrc, mode);
  const d = lcsDiff(a, b);
  if (d.length === 0) {
    console.log(`FILE ${f}\n  CODE-IDENTICAL（去注释代码流零差异，codeLines old=${a.length} new=${b.length}）`);
  } else {
    console.log(`FILE ${f}\n  CODE-DIFF（${d.length} 个差异片段）`);
    for (const seg of d.slice(0, 300)) {
      console.log(`    ${seg.type === 'del' ? '-' : '+'} ${seg.text}`);
    }
    if (d.length > 300) console.log(`    ... 其余 ${d.length - 300} 片段省略`);
  }
}

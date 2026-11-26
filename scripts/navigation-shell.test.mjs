import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("the initial reveal stays open across tab and history navigation", () => {
  let pathname = "/profile";
  const effects = [];
  const root = { dataset: {} };
  const callbacks = new Map();
  let nextId = 0;
  const schedule = callback => { const id = ++nextId; callbacks.set(id, callback); return id; };
  const cancel = id => callbacks.delete(id);
  const listeners = new Map();
  const window = {
    setTimeout: schedule,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
  };
  const document = { documentElement: root, body: { childNodes: [] }, querySelector: () => null };
  class MutationObserver { observe() {} disconnect() {} }
  const source = readFileSync(new URL("../app/components/AppShellLifecycle.tsx", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, document, window, MutationObserver,
    requestAnimationFrame: schedule, cancelAnimationFrame: cancel, clearTimeout: cancel,
    require: name => name === "react" ? { useEffect: callback => effects.push(callback) } : { usePathname: () => pathname },
  });
  const render = () => { effects.length = 0; module.exports.default(); return effects[0](); };
  let cleanup = render();
  assert.equal(root.dataset.oneShellReady, "false");
  listeners.get("1muslim:profile-ready")();
  // The frame check may run before the scheduled reveal, just as in a browser.
  for (const [id, callback] of [...callbacks]) { callbacks.delete(id); callback(); }
  assert.equal(root.dataset.oneShellReady, "true");
  for (const next of ["/posts", "/", "/profile", "/posts"]) {
    cleanup?.();
    pathname = next;
    cleanup = render();
    assert.equal(root.dataset.oneShellReady, "true");
    assert.equal(root.dataset.oneRoute, next === "/" ? "welcome" : "app");
  }
  assert.equal(existsSync(new URL("../app/loading.tsx", import.meta.url)), false);
  const nav = readFileSync(new URL("../app/components/GlobalNavigation.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(nav, /dataset\.oneShellReady\s*=/);
});

test("Qur'an Library and Studio do not render the social bottom navigation",()=>{
  const nav=readFileSync(new URL("../app/components/GlobalNavigation.tsx",import.meta.url),"utf8");
  const magazine=readFileSync(new URL("../app/quran-library/quran-magazine.css",import.meta.url),"utf8");
  assert.match(nav,/if\(pathname\?\.startsWith\("\/quran"\)\|\|pathname\?\.startsWith\("\/elm-tent\/quran"\)\)return null/);
  assert.match(magazine,/body:has\(\.qm-page\)\{padding-bottom:env\(safe-area-inset-bottom,0px\)!important\}/);
  // Ordinary routes keep using the global dock.
  assert.match(nav,/return <>\s*<header className=\{"oneGlobalNav"/);
});

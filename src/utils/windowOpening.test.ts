import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

test('first opening maximizes before showing the window', () => {
  const calls: string[] = [];
  const handlers: Record<string, () => void> = {};
  class WindowStub {
    webContents = { setWindowOpenHandler() {}, on() {}, send() {} };
    once(event: string, cb: () => void) { handlers[event] = cb; }
    on() {}
    loadFile() {}
    maximize() { calls.push('maximize'); }
    show() { calls.push('show'); }
  }
  runInNewContext(readFileSync('electron/main.cjs', 'utf8'), {
    __dirname: 'electron',
    require: (id: string) => id === 'path' ? { join: (...parts: string[]) => parts.join('/') } : {
      BrowserWindow: WindowStub, Menu: { setApplicationMenu() {} }, ipcMain: { on() {} }, shell: {},
      app: { requestSingleInstanceLock: () => true, on() {}, whenReady: () => ({ then: (cb: () => void) => cb() }) },
    },
  });
  assert.ok(handlers['ready-to-show']);
  handlers['ready-to-show']();
  assert.deepEqual(calls, ['maximize', 'show']);
});

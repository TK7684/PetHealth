import { build } from 'esbuild';

// Node.js built-in modules that need stubbing for CF Workers
const NODE_BUILTINS = [
  'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
  'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'http2',
  'https', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks',
  'process', 'punycode', 'querystring', 'readline', 'repl', 'stream',
  'string_decoder', 'sys', 'timers', 'tls', 'tty', 'url', 'util', 'v8',
  'vm', 'wasi', 'worker_threads', 'zlib',
];

build({
  entryPoints: ['workers/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: 'workers/index.js',
  target: 'es2022',
  // Externalize packages that can't be bundled or are dynamically loaded
  external: [
    'mysql2',  // still referenced by old code paths, will tree-shake
  ],
  plugins: [{
    // Stub ALL Node.js built-in modules — not available in CF Workers
    name: 'stub-node-builtins',
    setup(build) {
      const builtinsPattern = new RegExp('^(' + NODE_BUILTINS.join('|') + ')$');
      const nodePrefixPattern = /^node:(.+)$/;

      build.onResolve({ filter: builtinsPattern }, (args) => {
        return { path: args.path, namespace: 'node-stub' };
      });

      build.onResolve({ filter: nodePrefixPattern }, (args) => {
        return { path: args.path, namespace: 'node-stub' };
      });

      build.onLoad({ filter: /.*/, namespace: 'node-stub' }, (args) => {
        const modName = args.path.replace(/^node:/, '');
        if (modName === 'crypto') {
          return {
            contents: `
              export default {};
              export const createHash = () => ({ update: () => ({ digest: () => '' }) });
              export const randomBytes = (n) => new Uint8Array(n);
              export const createHmac = () => ({ update: () => ({ digest: () => '' }) });
            `,
            loader: 'js',
          };
        }
        if (modName === 'path') {
          return {
            contents: `
              export const join = (...p) => p.join('/');
              export const resolve = (...p) => p.join('/');
              export const extname = () => '';
              export const basename = (p) => p.split('/').pop();
              export const dirname = (p) => p.split('/').slice(0, -1).join('/');
              export const sep = '/';
              export default { join, resolve, extname, basename, dirname, sep };
            `,
            loader: 'js',
          };
        }
        if (modName === 'url') {
          return {
            contents: `
              export const parse = (u) => new URL(u);
              export const format = (u) => String(u);
              export default { parse, format };
            `,
            loader: 'js',
          };
        }
        if (modName === 'stream') {
          return {
            contents: `
              class Readable { pipe() { return this; } on() { return this; } emit() { return false; } }
              class Writable { write() {} end() {} }
              class Transform extends Readable {}
              class PassThrough extends Transform {}
              class Duplex extends Readable {}
              export { Readable, Writable, Transform, PassThrough, Duplex };
              export default { Readable, Writable, Transform, PassThrough, Duplex };
            `,
            loader: 'js',
          };
        }
        if (modName === 'events') {
          return {
            contents: `
              class EventEmitter {
                on(e, fn) { return this; }
                once(e, fn) { return this; }
                emit(e, ...a) { return false; }
                removeListener() { return this; }
                removeAllListeners() { return this; }
              }
              export { EventEmitter };
              export default { EventEmitter };
            `,
            loader: 'js',
          };
        }
        if (modName === 'util') {
          return {
            contents: `
              export const promisify = (fn) => fn;
              export const inspect = (o) => String(o);
              export const isDate = (o) => o instanceof Date;
              export const inherits = () => {};
              export const format = (...a) => a.join(' ');
              export const debuglog = () => () => {};
              export const callbackify = (fn) => fn;
              export default { promisify, inspect, isDate, inherits, format, debuglog, callbackify };
            `,
            loader: 'js',
          };
        }
        if (modName === 'buffer') {
          return {
            contents: `
              class Buffer {
                static from() { return new Buffer(); }
                static alloc(n) { return new Uint8Array(n); }
                static isBuffer() { return false; }
                toString() { return ''; }
                slice() { return this; }
              }
              export { Buffer };
              export default { Buffer };
            `,
            loader: 'js',
          };
        }
        if (modName === 'process') {
          return {
            contents: `
              const process = {
                env: {},
                nextTick: (fn, ...a) => Promise.resolve().then(() => fn(...a)),
                version: 'v18.0.0',
                versions: { node: '18.0.0' },
                platform: 'linux',
                cwd: () => '/',
                exit: (c) => {},
              };
              export default process;
            `,
            loader: 'js',
          };
        }
        if (modName === 'zlib') {
          return {
            contents: `
              const noop = () => ({ on: () => ({ on: () => {} }), pipe: () => ({ on: () => {} }) });
              export const createGzip = noop;
              export const createGunzip = noop;
              export const createDeflate = noop;
              export const createInflate = noop;
              export const constants = {};
              export default { createGzip, createGunzip, createDeflate, createInflate };
            `,
            loader: 'js',
          };
        }
        if (modName === 'assert') {
          return {
            contents: `
              export default function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
              export const ok = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };
              export const equal = (a, b) => { if (a !== b) throw new Error('Expected equal'); };
              export const strictEqual = equal;
            `,
            loader: 'js',
          };
        }
        if (modName === 'timers') {
          return {
            contents: `
              export const setTimeout = globalThis.setTimeout;
              export const setInterval = globalThis.setInterval;
              export const clearTimeout = globalThis.clearTimeout;
              export const clearInterval = globalThis.clearInterval;
              export default { setTimeout, setInterval, clearTimeout, clearInterval };
            `,
            loader: 'js',
          };
        }
        // Generic stub for everything else
        return {
          contents: `export default {};`,
          loader: 'js',
        };
      });
    },
  }, {
    name: 'handle-dynamic-imports',
    setup(build) {
      // Stub AWS SDK packages — not available on CF Workers
      build.onResolve({ filter: /^@aws-sdk\// }, (args) => {
        return { path: args.path, namespace: 'module-stub' };
      });
      // Stub storage and stripe modules (post-MVP, dynamically imported)
      build.onResolve({ filter: /\/storage$|\/stripe$/ }, (args) => {
        if (args.path.includes('server') || args.path.startsWith('../server')) {
          return { path: args.path, namespace: 'module-stub' };
        }
      });
      // mysql2 stays external (tree-shaken, never called in D1 path)
      build.onResolve({ filter: /^mysql2/ }, (args) => {
        return { external: true };
      });

      build.onLoad({ filter: /.*/, namespace: 'module-stub' }, (args) => {
        if (args.path.startsWith('@aws-sdk/client-s3')) {
          return {
            contents: `
              export class S3Client { send() { return Promise.resolve({}); } config = {}; }
              export class PutObjectCommand { constructor() {} }
              export class GetObjectCommand { constructor() {} }
              export class DeleteObjectCommand { constructor() {} }
            `,
            loader: 'js',
          };
        }
        if (args.path.startsWith('@aws-sdk/s3-request-presigner')) {
          return {
            contents: `export const getSignedUrl = () => Promise.resolve('');`,
            loader: 'js',
          };
        }
        return { contents: 'export {};', loader: 'js' };
      });
    },
  }],
}).catch(() => process.exit(1));

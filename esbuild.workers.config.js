import { build } from 'esbuild';

build({
  entryPoints: ['workers/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node', // Use node platform with nodejs_compat flag
  outfile: 'workers/index.js',
  // Don't use packages: 'external' - we need to bundle tRPC and other compatible packages
  // Only externalize incompatible packages explicitly
  target: 'es2022',
  // Mark Node.js built-ins and incompatible packages as external
  external: [
    '../server/stripe',
    '../server/storage',
    'server/storage',
    'mysql2',
    // 'drizzle-orm/mysql2', // Removed - will be stubbed by plugin
    // AWS SDK packages (Node.js only, not compatible with Workers)
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    // Node.js built-ins (will be provided by nodejs_compat)
    'crypto',
    'net',
    'tls',
    'events',
    'stream',
    'util',
    'process',
    'buffer',
    'url',
    'zlib',
    'timers',
    'string_decoder',
    'assert',
    'os',
    'node:os',
    'path',
    'node:path',
    'fs',
    'node:fs',
    'http',
    // 'node:http', // Removed - will be stubbed by plugin
    'https',
    // 'node:https', // Removed - will be stubbed by plugin
  ],
  // Use plugins to handle dynamic imports and mark incompatible packages as external
  // IMPORTANT: Plugins run in order - stubs must come BEFORE the general external handler
  plugins: [{
    // Stub drizzle-orm/mysql2 - must run FIRST
    name: 'stub-drizzle-mysql2',
    setup(build) {
      build.onResolve({ filter: /^drizzle-orm\/mysql2$/ }, (args) => {
        return {
          path: args.path,
          namespace: 'drizzle-mysql2-stub',
        };
      });
      
      build.onLoad({ filter: /.*/, namespace: 'drizzle-mysql2-stub' }, () => {
        return {
          contents: `
            export function drizzle() {
              throw new Error("MySQL (drizzle-orm/mysql2) is not supported in Cloudflare Workers. Please migrate to Cloudflare D1 (SQLite) using drizzle-orm/d1. See WORKERS_DATABASE.md for instructions.");
            }
            export default drizzle;
          `,
          loader: 'js',
        };
      });
    },
  }, {
    // Stub unsupported Node.js modules - must run BEFORE general handler
    name: 'stub-node-modules',
    setup(build) {
      build.onResolve({ filter: /^node:(os|tty|fs|path|http|https)$/ }, () => {
        return { path: 'node-stub', namespace: 'node-stub' };
      });
      
      build.onLoad({ filter: /.*/, namespace: 'node-stub' }, () => {
        return {
          contents: 'export default {};',
          loader: 'js',
        };
      });
    },
  }, {
    name: 'handle-dynamic-imports',
    setup(build) {
      // Mark AWS SDK packages as external FIRST (highest priority) - catch ALL variations
      build.onResolve({ filter: /.*/ }, (args) => {
        // Check if it's an AWS SDK package
        if (args.path.startsWith('@aws-sdk/')) {
          return { external: true };
        }
        // Check if it's storage or stripe modules - mark as external
        if (args.path.includes('/storage') && (args.path.includes('server') || args.path.startsWith('../server'))) {
          return { external: true };
        }
        if (args.path.includes('/stripe') && (args.path.includes('server') || args.path.startsWith('../server'))) {
          return { external: true };
        }
        // Check if it's mysql2 (but NOT drizzle-orm/mysql2 - that will be stubbed)
        if (args.path === 'mysql2' || args.path.startsWith('mysql2/')) {
          return { external: true };
        }
        // Don't handle drizzle-orm/mysql2 here - let the stub plugin handle it
        // Let other imports through
        return undefined;
      });
      
      // Prevent loading storage and stripe files to avoid bundling incompatible dependencies
      build.onLoad({ filter: /storage\.(ts|js)$/ }, () => {
        // Return empty module - storage will be loaded dynamically at runtime
        return {
          contents: 'export {};',
          loader: 'js',
        };
      });
      
      build.onLoad({ filter: /stripe\.(ts|js)$/ }, () => {
        // Return empty module - stripe will be loaded dynamically at runtime
        return {
          contents: 'export {};',
          loader: 'js',
        };
      });
    },
  }],
}).catch(() => process.exit(1));


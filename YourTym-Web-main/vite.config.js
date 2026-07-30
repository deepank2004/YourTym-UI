import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import vitePluginBundleObfuscator from 'vite-plugin-bundle-obfuscator';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_BASE_URL?.trim() || 'https://www.yourtym.in';

  const gatewayProxy = {
    target: apiTarget,
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/api\/gateway/, ''),
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isProduction
        ? [
            vitePluginBundleObfuscator({
              apply: 'build',
              autoExcludeNodeModules: true,
              log: false,
              threadPool: true,
              options: {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.5,
                deadCodeInjection: false,
                debugProtection: false,
                disableConsoleOutput: false,
                identifierNamesGenerator: 'hexadecimal',
                ignoreImports: true,
                selfDefending: true,
                simplify: true,
                sourceMap: false,
                splitStrings: true,
                splitStringsChunkLength: 8,
                stringArray: true,
                stringArrayCallsTransform: true,
                stringArrayCallsTransformThreshold: 0.5,
                stringArrayIndexShift: true,
                stringArrayRotate: true,
                stringArrayShuffle: true,
                stringArrayThreshold: 0.75,
                stringArrayWrappersChainedCalls: true,
                stringArrayWrappersCount: 1,
                unicodeEscapeSequence: false,
              },
            }),
          ]
        : []),
    ],
    server: { proxy: { '/api/gateway': gatewayProxy } },
    preview: { proxy: { '/api/gateway': gatewayProxy } },
    build: {
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2,
        },
        format: {
          comments: false,
        },
      },
    },
  };
});

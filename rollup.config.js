import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { builtinModules } from 'module';

export default defineConfig({
  input: {
    wilcocrypt: 'src/wilcocrypt.js',
    cli: 'src/cli.js'
  },

  output: [
    {
      dir: 'dist',
      format: 'es',
      entryFileNames: '[name].js',
      banner: (chunk) =>
        chunk.name === 'cli' ? '#!/usr/bin/env node' : null
    },
    {
      dir: 'dist',
      format: 'es',
      entryFileNames: '[name].min.js',
      banner: (chunk) =>
        chunk.name === 'cli' ? '#!/usr/bin/env node' : null,
      plugins: [terser()]
    }
  ],

  external: [
    ...builtinModules,
    ...builtinModules.map(m => `node:${m}`)
  ],

  plugins: [
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
});

import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { builtinModules } from 'module';

export default defineConfig({
  input: 'src/cli.js',
  output: {
    file: 'dist/cli.min.cjs',
    format: 'cjs',
    banner: '#!/usr/bin/env node'
  },
  external: [
    ...builtinModules,
    ...builtinModules.map((mod) => `node:${mod}`)
  ],
  plugins: [
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    replace({ preventAssignment: true, 'process.env.NODE_ENV': JSON.stringify('production') }),
    terser()
  ]
});

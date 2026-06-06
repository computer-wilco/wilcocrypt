# Changelog

All notable changes to WilcoCrypt are documented here.

---

## [2.2.1] - 2026-06-06

### Added

* **Asynchronous API**:

  * `encryptDataAsync()`
  * `decryptDataAsync()`
  * `encryptFileAsync()`
  * `decryptFileAsync()`

  These methods provide Promise-based alternatives to the existing synchronous API and integrate naturally with `async` / `await`.

### Changed

* **TypeScript definitions** significantly expanded and improved:

  * Added detailed JSDoc documentation throughout the public API.
  * Added parameter descriptions for internal helper functions.
  * Added return value documentation.
  * Added exception documentation (`@throws`) where applicable.
  * Improved overload documentation for `decryptFile()` and `decryptFileAsync()`.
  * Added payload format documentation to stream APIs.

* **Dependencies updated** to the latest compatible versions.

* **Code style** migrated from semistandard-only documentation to explicit **Prettier** formatting support.

### Documentation

* Updated `README.md` examples and feature descriptions.
* Updated `DOCS.md` API documentation.
* Improved TypeScript API reference consistency.
* Improved JSDoc coverage across the entire codebase.

---

## [2.2.0] - 2026-05-01

### Added

- **Streaming API** — `encryptFileStream(inputPath, outputPath, password, gzip?)` and `decryptFileStream(inputPath, outputPath, password, gzip?)` for memory-efficient encryption and decryption of large files using Node.js streams.
- **`decryptFile` output path** — `decryptFile` now accepts an optional `outputPath` argument. When provided, decrypted data is written directly to that file instead of being returned as a Buffer. Fully backward compatible.
- Internal `HEADER` constant (`[23, 9, 12, 3, 15, 3, 18, 25, 16, 20]`) for payload identification.
- **CLI `-o` / `--output` flag** — Decrypted output can now be written to a file via `-o <file>` instead of always piping to stdout.
- **CLI `--stdout` flag** — Explicit flag to write decrypted output to stdout (this remains the default when `-o` is omitted).
- **Version check on decryption** — The version string is now embedded in the encrypted payload and validated during decryption. Payloads from a different version are rejected with a `VERSION_MISMATCH` error.
- **GitHub issue templates** (bug report, feature request) and `issue_config.yml`.
- **`dependabot.yml`** for automated dependency updates.
- **`SECURITY.md`** with responsible disclosure policy.
- **`DOCS.md`** — full API reference, CLI docs, payload format, TypeScript usage, and security notes.

### Changed

- **Binary payload format** — The encrypted payload format has been updated. The version string is now included between the header and salt, and the auth tag has moved to the **end** of the payload (after the ciphertext) to support streaming. The new layout is:
  `[HEADER (10)] + [VERSION (dynamic)] + [salt (16)] + [iv (12)] + [ciphertext] + [authTag (16)]`
  > Payloads encrypted with v2.1.1 are not compatible with v2.2.0 and vice versa.
- **Removed `notepack.io`** — The MessagePack dependency has been dropped entirely. The custom binary format replaces the previous envelope-based approach.
- **VERSION** bumped from `2.1.1` to `2.2.0`.
- **Linting** — Codebase now enforces [semistandard](https://github.com/standard/semistandard) style (Standard JS + semicolons).
- **TypeScript types** updated with overloads for the new `decryptFile` signature and the two new stream methods.
- **README** updated with stability warning, new features, and links to `DOCS.md` and `CHANGELOG.md`.

### Internal

- Stream decryption performs early header and version validation before opening the output stream, and automatically cleans up the output file on failure.
- `_.decryptData` internal helper now accepts raw `Buffer` arguments (previously hex strings).

### Fixed Bugs

- Fixed the bug where the CLI tool would not work when running with npx or global
- Fixed package.json issue with bin not being an object

---

## [2.1.1] - 2026-04-26

First official GitHub release of WilcoCrypt.

### Added

- Full TypeScript support (`wilcocrypt.d.ts`).
- Pre-built binaries for Linux x64/arm64, macOS x64/arm64, and Windows x64.
- `WilcoCryptError` custom error class with machine-readable `code` property.
- Internal helpers: `assertKeyAndIv`, `assertPassword`, `constantTimeEqual`.

### Changed

- Removed Rollup bundle from the npm package (Rollup is still used for building binaries).
- README improvements and consistency fixes.

### Notes

- The CLI `wilcocrypt` command does not work when installed globally via npm in this release. Use the provided binaries as a workaround. This is fixed in v2.2.0.

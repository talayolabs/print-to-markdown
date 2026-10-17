#!/bin/sh
# Copy the browser builds of the runtime dependencies into extension/vendor.
set -e
cd "$(dirname "$0")/.."
cp node_modules/@mozilla/readability/Readability.js extension/vendor/Readability.js
cp node_modules/turndown/dist/turndown.js extension/vendor/turndown.js
cp node_modules/turndown-plugin-gfm/dist/turndown-plugin-gfm.js extension/vendor/turndown-plugin-gfm.js
echo "vendored:"; ls extension/vendor

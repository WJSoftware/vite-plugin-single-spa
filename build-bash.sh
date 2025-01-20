#!/bin/bash
set -e

# Run tests if not skipped
if [ "$SKIP_TESTS" != "true" ]; then
  echo "Running unit tests..."
  npm run test
fi

# Optionally upgrade version (requires additional logic for versioning)
if [ -n "$VER_UPGRADE" ]; then
  echo "Upgrading version: $VER_UPGRADE..."
  if [ -n "$PRE_ID" ]; then
    npm version "$VER_UPGRADE" --preid "$PRE_ID" --no-git-tag-version
  else
    npm version "$VER_UPGRADE" --no-git-tag-version
  fi
fi

# Clean up and compile TypeScript
rm -rf ./out
mkdir -p ./out

echo "Compiling TypeScript..."
npx tsc

# Copy .d.ts files
cp ./src/vite-plugin-single-spa.d.ts ./out/
mkdir -p ./out/ex
cp ./src/ex.d.ts ./out/ex/index.d.ts

# Publish or dry run publish
if [ "$PUBLISH" = "true" && "$SKIP_TESTS" != "true" ]; then
  echo "Publishing npm package..."
  npm publish
else
  echo "Running npm publish in dry-run mode..."
  npm publish --dry-run
fi
#!/bin/bash
set -e

#
# Default values (overridden by command-line args)
#
SKIP_TESTS=false
VER_UPGRADE=""
PRE_ID=""
PUBLISH=false

#
# Help / usage function
#
function usage() {
  echo "Usage: $0 [options]"
  echo
  echo "Options:"
  echo "  --skip-tests               Skip running unit tests"
  echo "  --ver-upgrade <version>    NPM version to upgrade (e.g., major, minor, patch, prerelease)"
  echo "  --pre-id <identifier>      Pre-release identifier (used with prerelease version)"
  echo "  --publish                  Publish the package to NPM (instead of dry-run)"
  echo "  -h, --help                 Show this help message"
  echo
  echo "Examples:"
  echo "  $0 --skip-tests"
  echo "  $0 --ver-upgrade patch"
  echo "  $0 --ver-upgrade prerelease --pre-id alpha"
  echo "  $0 --publish"
  echo "  $0 --skip-tests --publish --ver-upgrade patch"
  exit 1
}

#
# Parse command-line arguments
#
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --ver-upgrade)
      VER_UPGRADE="$2"
      shift
      shift
      ;;
    --pre-id)
      PRE_ID="$2"
      shift
      shift
      ;;
    --publish)
      PUBLISH=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

#
# 1. Run tests unless --skip-tests was provided
#
if [ "$SKIP_TESTS" != "true" ]; then
  echo "Running unit tests..."
  npm run test
fi

#
# 2. Optionally upgrade version if --ver-upgrade was provided
#
if [ -n "$VER_UPGRADE" ]; then
  echo "Upgrading version: $VER_UPGRADE..."
  if [ -n "$PRE_ID" ]; then
    npm version "$VER_UPGRADE" --preid "$PRE_ID" --no-git-tag-version
  else
    npm version "$VER_UPGRADE" --no-git-tag-version
  fi
fi

#
# 3. Clean up output folder and compile TypeScript
#
rm -rf ./out
mkdir -p ./out

echo "Compiling TypeScript..."
npx tsc

# Copy .d.ts files
cp ./src/vite-plugin-single-spa.d.ts ./out/
mkdir -p ./out/ex
cp ./src/ex.d.ts ./out/ex/index.d.ts

#
# 4. Publish or dry-run based on --publish and --skip-tests flags
#    (Preserves the original logic: if you skip tests, it won't do an actual publish)
#
if [ "$PUBLISH" = "true" ] && [ "$SKIP_TESTS" != "true" ]; then
  echo "Publishing npm package..."
  npm publish
else
  echo "Running npm publish in dry-run mode..."
  npm publish --dry-run
fi

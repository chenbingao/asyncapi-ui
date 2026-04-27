#!/bin/sh
set -eu

IMAGE_REPO="asyncapi-ui"

usage() {
  echo "Usage: $0 <version>"
  echo "Example: $0 1.0.3"
}

if [ "$#" -ne 1 ]; then
  usage >&2
  exit 1
fi

VERSION="$1"

case "$VERSION" in
  *[!0-9A-Za-z._-]* | "")
    echo "Invalid version: $VERSION" >&2
    echo "Allowed characters: letters, numbers, dot, underscore, hyphen" >&2
    exit 1
    ;;
esac

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
IMAGE_NAME="${IMAGE_NAME:-${IMAGE_REPO}}"

cd "$PROJECT_ROOT"

echo "Building local image for current architecture:"
echo "  ${IMAGE_NAME}:${VERSION}"
echo "  ${IMAGE_NAME}:latest"

docker build \
  -t "${IMAGE_NAME}:${VERSION}" \
  -t "${IMAGE_NAME}:latest" \
  .

echo "Built:"
echo "  ${IMAGE_NAME}:${VERSION}"
echo "  ${IMAGE_NAME}:latest"

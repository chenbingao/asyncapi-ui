#!/bin/sh
set -eu

IMAGE_REPO="asyncapi-ui"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
BUILDER_NAME="${BUILDER_NAME:-asyncapi-ui-builder}"

usage() {
  echo "Usage: DOCKERHUB_USERNAME=<dockerhub-user> $0 <version>"
  echo "Example: DOCKERHUB_USERNAME=shiro $0 1.0.3"
}

if [ "$#" -ne 1 ]; then
  usage >&2
  exit 1
fi

if [ -z "${DOCKERHUB_USERNAME:-}" ]; then
  echo "DOCKERHUB_USERNAME is required." >&2
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
IMAGE_NAME="${DOCKERHUB_USERNAME}/${IMAGE_REPO}"

cd "$PROJECT_ROOT"

if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  docker buildx create --name "$BUILDER_NAME" --use >/dev/null
else
  docker buildx use "$BUILDER_NAME" >/dev/null
fi

docker buildx inspect --bootstrap >/dev/null

echo "Building and pushing multi-arch image:"
echo "  image: ${IMAGE_NAME}"
echo "  version: ${VERSION}"
echo "  platforms: ${PLATFORMS}"

docker buildx build \
  --platform "${PLATFORMS}" \
  -t "${IMAGE_NAME}:${VERSION}" \
  -t "${IMAGE_NAME}:latest" \
  --push \
  .

echo "Pushed:"
echo "  ${IMAGE_NAME}:${VERSION}"
echo "  ${IMAGE_NAME}:latest"
echo "Platforms:"
echo "  ${PLATFORMS}"

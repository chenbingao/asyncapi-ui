#!/bin/sh
set -eu

HTML_DIR="/usr/share/nginx/html"
DEFAULT_CONFIG="$HTML_DIR/config.default.json"
TARGET_CONFIG="$HTML_DIR/config.json"

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

write_default_config() {
  if [ -f "$DEFAULT_CONFIG" ]; then
    cp "$DEFAULT_CONFIG" "$TARGET_CONFIG"
  fi
}

write_env_config() {
  if [ -z "${URLS:-}" ]; then
    return 1
  fi

  echo "$URLS" | jq empty >/dev/null 2>&1 || {
    echo "Invalid URLS env: must be a JSON array" >&2
    return 1
  }

  documents_json="$(echo "$URLS" | jq '
    map(
      {
        id: ((.id // .name // .label // "document") | ascii_downcase | gsub("[^a-z0-9]+"; "-") | gsub("^-+"; "") | gsub("-+$"; "")),
        label: (.label // .name // "Document"),
        url: (.url // (if .file then ("/docs/" + .file) else empty end)),
        description: (.description // ""),
        file: (.file // ((.url // "") | sub("^/docs/"; "")))
      }
    )
  ')"

  jq -n \
    --arg title "${PAGE_TITLE:-AsyncAPI Project Docs}" \
    --arg subtitle "${PAGE_SUBTITLE:-Pure preview service with a Swagger UI style document switcher}" \
    --arg primaryName "${URLS_PRIMARY_NAME:-}" \
    --argjson documents "$documents_json" \
    '{
      title: $title,
      subtitle: $subtitle,
      primaryName: ($primaryName | if . == "" then null else . end),
      documents: $documents
    }' >"$TARGET_CONFIG"
}

write_default_config

if ! write_env_config; then
  write_default_config
fi

exec "$@"

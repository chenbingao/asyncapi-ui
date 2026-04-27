# AsyncAPI UI Preview

[中文说明](./README.zh-CN.md) | [Repository Overview](./REPOSITORY_OVERVIEW.md)

`asyncapi-ui` is a lightweight preview service for AsyncAPI documents with a Swagger UI style document switcher. It serves a static web UI through `nginx`, renders AsyncAPI specifications with the official AsyncAPI browser component, and supports runtime document configuration through environment variables.

## Quick Start

Run locally:

```bash
npm install
npm start
```

Build a local image for the current architecture:

```bash
./scripts/build-image.sh 1.0.0
```

Run with Docker Compose:

```bash
IMAGE_NAME=asyncapi-ui:1.0.0 docker compose -f docker-compose.example.yml up
```

Push a multi-architecture image to Docker Hub:

```bash
docker login
DOCKERHUB_USERNAME=yourname ./scripts/push-image.sh 1.0.0
```

## Documentation

- Chinese documentation: [README.zh-CN.md](./README.zh-CN.md)
- Repository and image overview: [REPOSITORY_OVERVIEW.md](./REPOSITORY_OVERVIEW.md)
- Compose example: [docker-compose.example.yml](./docker-compose.example.yml)

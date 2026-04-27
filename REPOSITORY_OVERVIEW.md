# Repository Overview

`asyncapi-ui` is a lightweight container image for serving AsyncAPI documentation with a Swagger UI style document switcher. The image serves a static web UI through `nginx`, renders AsyncAPI specifications with the official AsyncAPI browser component, and lets you expose multiple documents at runtime without rebuilding the image.

To use it, mount your AsyncAPI YAML or JSON files into `/usr/share/nginx/html/docs` and configure the document list with `URLS` and `URLS_PRIMARY_NAME`. Each item in `URLS` should point to a file available under `/docs`, and each `name` value is displayed in the top-right selector.

A minimal `docker-compose.yaml` example:

```yaml
version: "3.8"

services:
  asyncapi-ui:
    image: yourname/asyncapi-ui:latest
    ports:
      - "10000:8080"
    volumes:
      - /absolute/path/to/your/asyncapi-docs:/usr/share/nginx/html/docs:ro
    environment:
      - URLS_PRIMARY_NAME=Service A
      - URLS=[{"url":"/docs/service-a.yaml","name":"Service A"},{"url":"/docs/service-b.yaml","name":"Service B"}]
```

The same image can also be started with `docker run`:

```bash
docker run --rm -p 10000:8080 \
  -v /absolute/path/to/your/asyncapi-docs:/usr/share/nginx/html/docs:ro \
  -e 'URLS=[{"url":"/docs/service-a.yaml","name":"Service A"}]' \
  -e URLS_PRIMARY_NAME='Service A' \
  yourname/asyncapi-ui:latest
```


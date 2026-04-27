# AsyncAPI UI Preview

[English README](./README.md) | [Repository Overview](./REPOSITORY_OVERVIEW.md)

一个类似 `swagger-ui` 的 AsyncAPI 纯预览服务，右上角可切换多份文档。构建后产出 `dist/`，Docker 中使用 `nginx` 提供静态页面和文档文件，运行时通过环境变量生成 `config.json`。

## 本地启动

```bash
npm install
npm start
```

本地会先构建 `dist/`，再用一个简单的 Node 静态服务预览 `dist/`，默认地址是 `http://0.0.0.0:8090`。

## 构建产物

```bash
npm run build
```

构建后会生成：

- `dist/index.html`
- `dist/app.js`
- `dist/styles.css`
- `dist/assets/asyncapi/standalone.js`
- `dist/assets/asyncapi/default.min.css`
- `dist/config.default.json`
- `dist/config.json`
- `dist/docs/*`

其中 AsyncAPI 渲染器来自本地安装的官方包 `@asyncapi/react-component` 的 browser standalone 产物，不依赖外网 CDN。

## Docker 运行时配置

Docker 场景下兼容 `swagger-ui` 风格的 `URLS` 和 `URLS_PRIMARY_NAME`。容器启动时会用这些环境变量生成 `/usr/share/nginx/html/config.json`。

示例：

```yaml
version: "3.8"

services:
  asyncapi-ui:
    build: .
    ports:
      - "10000:8080"
    volumes:
      - /absolute/path/to/your/asyncapi-docs:/usr/share/nginx/html/docs:ro
    environment:
      - URLS_PRIMARY_NAME=Service A
      - URLS=[{"url":"/docs/service-a.yaml","name":"Service A"},{"url":"/docs/service-b.yaml","name":"Service B"}]
```

规则：

- `URLS` 必须是 JSON 数组。
- 每项至少要有 `url`，通常写成 `/docs/xxx.yaml`。
- `name` 会作为下拉框展示名，也会参与默认选中匹配。
- `URLS_PRIMARY_NAME` 会指定默认打开的文档。
- 没有设置 `URLS` 时，容器会回退到构建时生成的默认 `config.default.json`。

完整示例见 [docker-compose.example.yml](/Users/shiro/Code/Projects/asyncapi-ui/docker-compose.example.yml)。

可以直接参考下面这份 `docker-compose.yaml`：

```yaml
version: "3.8"

services:
  asyncapi-ui:
    image: asyncapi-ui:1.0.0
    container_name: asyncapi-ui
    ports:
      - "10000:8080"
    volumes:
      - /absolute/path/to/your/asyncapi-docs:/usr/share/nginx/html/docs:ro
    environment:
      - URLS_PRIMARY_NAME=Service A
      - URLS=[{"url":"/docs/service-a.yaml","name":"Service A"},{"url":"/docs/service-b.yaml","name":"Service B"},{"url":"/docs/service-c.yaml","name":"Service C"}]
    restart: unless-stopped
```

如果你是先本地构建镜像再试跑：

```bash
./scripts/build-image.sh 1.0.0
docker compose up
```

## Docker 构建和运行

```bash
docker build -t asyncapi-ui-preview .
docker run --rm -p 10000:8080 \
  -v /absolute/path/to/your/asyncapi-docs:/usr/share/nginx/html/docs:ro \
  -e 'URLS=[{"url":"/docs/service-a.yaml","name":"Service A"}]' \
  -e URLS_PRIMARY_NAME='Service A' \
  asyncapi-ui-preview
```

## 本地镜像构建

如果你准备先在本地用 `docker-compose` 试跑，先构建当前机器架构的本地镜像：

```bash
chmod +x scripts/build-image.sh
./scripts/build-image.sh 1.0.0
```

默认会生成：

- `asyncapi-ui:1.0.0`
- `asyncapi-ui:latest`

然后用 compose 跑：

```bash
IMAGE_NAME=asyncapi-ui:1.0.0 docker compose -f docker-compose.example.yml up
```

如果你想换本地镜像名：

```bash
IMAGE_NAME=my-asyncapi-ui ./scripts/build-image.sh 1.0.0
IMAGE_NAME=my-asyncapi-ui:1.0.0 docker compose -f docker-compose.example.yml up
```

## 多架构发布

如果你要同时发布 `x86_64` 和 `arm64`，要走 `docker buildx`，因为 Docker 本地 `load` 不能一次加载多架构镜像给 `docker-compose` 直接用。

推送脚本会一次构建并推送：

```bash
docker login
chmod +x scripts/push-image.sh
DOCKERHUB_USERNAME=yourname ./scripts/push-image.sh 1.0.0
```

默认会推送：

- `yourname/asyncapi-ui:1.0.0`
- `yourname/asyncapi-ui:latest`

默认平台：

- `linux/amd64`
- `linux/arm64`

如果你要改平台列表：

```bash
DOCKERHUB_USERNAME=yourname \
PLATFORMS=linux/amd64,linux/arm64 \
./scripts/push-image.sh 1.0.0
```

## 本地默认配置

如果你不走 Docker 运行时环境变量，默认文档列表来自 [docs/registry.json](/Users/shiro/Code/Projects/asyncapi-ui/docs/registry.json)，构建时会被转换成 `dist/config.default.json` 和 `dist/config.json`。

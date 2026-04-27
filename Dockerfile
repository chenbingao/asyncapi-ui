FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY build.mjs ./
COPY public ./public
COPY docs ./docs
RUN npm run build

FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

RUN apk add --no-cache jq

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=build /app/dist ./

RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

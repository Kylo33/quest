FROM node:22 AS builder

RUN corepack enable

WORKDIR /code

COPY package.json /code/
COPY pnpm-lock.yaml /code/
RUN pnpm install

COPY . /code/

RUN pnpm run build

FROM nginx:alpine

COPY --from=builder /code/dist /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

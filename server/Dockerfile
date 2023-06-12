FROM node:16.15.0-stretch

RUN npm i -g pnpm@8

WORKDIR /app

COPY package.json pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile
COPY ./ .

EXPOSE 5000
CMD ["pnpm", "start"]

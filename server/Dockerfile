FROM node:16.15.0-stretch

WORKDIR /shared
COPY shared/package.json shared/yarn.lock ./
RUN yarn install --frozen-lockfile

#Install and cache node_modules
WORKDIR /tmp
COPY package.json yarn.lock .
RUN yarn install --frozen-lockfile && \
    mkdir -p /app && \
    mv node_modules /app/

WORKDIR /shared
COPY shared .
RUN yarn build

WORKDIR /app
COPY server .

VOLUME /data
EXPOSE 5000
CMD ["yarn", "start"]

# HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD [ "node", "scripts/healthcheck.js" ]

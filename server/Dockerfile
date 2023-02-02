FROM node:16.15.0-stretch

WORKDIR /app

COPY ./ ./

RUN yarn install

VOLUME /data
EXPOSE 5000
CMD ["yarn", "start"]


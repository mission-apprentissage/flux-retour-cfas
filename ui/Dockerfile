# build stage
FROM node:16.6.0-stretch as build

ARG REACT_APP_ENV

ENV REACT_APP_ENV=$REACT_APP_ENV

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./
RUN yarn build

FROM node:16.6.0-alpine
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
RUN yarn global add local-web-server
EXPOSE 3000
CMD ["yarn", "serve"]

FROM node:16-bullseye

RUN apt update && apt install -y certbot curl
RUN yarn global add serve

RUN mkdir -p /etc/letsencrypt

COPY app/entrypoint.sh /
RUN chmod +x /entrypoint.sh

VOLUME /etc/letsencrypt
EXPOSE 5000

ENTRYPOINT ["/entrypoint.sh"]

FROM alpine:latest

RUN set -ex \
    && apk add --no-cache ca-certificates curl shadow build-base linux-pam-dev unzip vsftpd openssl tar bash jq bind-tools mongodb-tools \
    && rm -rf /tmp/* /var/cache/apk/*

RUN set -e \
    && mkdir -p /tmp/pam_pwdfile \
      && cd /tmp/pam_pwdfile \
      && curl -sSL https://github.com/tiwe-de/libpam-pwdfile/archive/v1.0.tar.gz | tar xz --strip 1 \
      && make install \
      && cd .. \
      && rm -rf /tmp/pam_pwdfile

COPY app/entrypoint.sh /
RUN chmod +x /entrypoint.sh

COPY app/vsftpd.conf /etc/vsftpd/

RUN set -e \
    && mkdir -p /var/log/vsftpd/ \
    && groupadd --gid 1000 virtual \
    && useradd virtual --uid 1000 --gid virtual -m -d /data/users/ -s /sbin/nologin \
    && chown -R virtual:virtual /data/users/

VOLUME /data
EXPOSE 20 21 21100-21110

CMD ["/entrypoint.sh"]

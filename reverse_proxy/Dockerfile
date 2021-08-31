FROM nginx:latest

ARG KIBANA_BASIC_AUTH

RUN apt-get update \
    && apt-get install -y logrotate nginx-extras

#Logrotate
COPY app/logrotate.d/logrotate.conf /etc/logrotate.conf
RUN chmod 644 /etc/logrotate.conf

#Nginx
COPY app/nginx /etc/nginx
COPY app/start.sh /opt/nginx/start.sh
RUN chmod +x /opt/nginx/start.sh

# Basic auth for kibana
RUN touch /etc/nginx/conf.d/auth/.htpasswd && echo "$KIBANA_BASIC_AUTH" > /etc/nginx/conf.d/auth/.htpasswd

VOLUME /data
CMD /opt/nginx/start.sh

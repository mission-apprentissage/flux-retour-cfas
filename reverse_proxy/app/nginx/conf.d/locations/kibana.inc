location /kibana/ { 
    auth_basic              "Restricted";
    auth_basic_user_file    /etc/nginx/conf.d/auth/.htpasswd;
    proxy_set_header        Host $host;
    proxy_set_header        X-Real-IP $remote_addr;
    proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header        X-Forwarded-Host $server_name;
    proxy_set_header        X-Forwarded-Proto $scheme;
    proxy_pass              http://kibana:5601/;
}

FROM nginx
COPY app.nginx.conf /etc/nginx/conf.d/
ADD ./dist/ /usr/share/nginx/html/

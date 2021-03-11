#for windows os
#FROM mcr.microsoft.com/windows/servercore/iis
#RUN powershell -NoProfile -Command Remove-Item -Recurse C:\inetpub\wwwroot\*
#WORKDIR /inetpub/wwwroot
#COPY ./src/MainProject .
#EXPOSE 443
#EXPOSE 80
##ENTRYPOINT ["dotnet", "DotNetSite.dll"]



FROM nginx:latest
EXPOSE 443
EXPOSE 80

RUN apt-get update && \
    apt-get install -y openssl && \
    mkdir /etc/nginx/ssl

RUN openssl req -x509 -newkey rsa:2048  -passin pass:'YOUR_SECURE_PASSWORD' -keyout "/etc/nginx/ssl/key.pem" -out "/etc/nginx/ssl/cert.pem" -days 365 -nodes \
        -subj "/C=US/ST=Washington/L=Seattle/O=leenet/OU=IT Department/CN=*.leenet.lol"

#COPY ./Utils/Docker/cert.pem /etc/nginx/ssl/cert.pem

#COPY ./Utils/Docker/key.pem /etc/nginx/ssl/key.pem

COPY ./Utils/Docker/ssl.pass /etc/nginx/ssl/ssl.pass

#COPY ./Utils/Docker/leenet.pass /etc/nginx/ssl/ssl.pass

COPY ./Utils/Docker/default.conf /etc/nginx/conf.d/default.conf

COPY ./client /var/www/html

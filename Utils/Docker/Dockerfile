#for windows os
#FROM mcr.microsoft.com/windows/servercore/iis
#RUN powershell -NoProfile -Command Remove-Item -Recurse C:\inetpub\wwwroot\*
#WORKDIR /inetpub/wwwroot
#COPY ./src/MainProject .
#EXPOSE 443
#EXPOSE 80
##ENTRYPOINT ["dotnet", "DotNetSite.dll"]



FROM nginx:latest
#EXPOSE 443
EXPOSE 80
WORKDIR /usr/share/nginx/html
COPY ./client .

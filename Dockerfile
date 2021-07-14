FROM node:latest

LABEL maintainer="haisam.ido@gmail.com"

RUN mkdir openmct
WORKDIR /openmct

# Mounting a volume would be better
ADD . .

RUN rm -rf dist
RUN rm -rf node_modules

RUN npm install

EXPOSE 8080
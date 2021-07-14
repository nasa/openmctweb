FROM node:alpine

WORKDIR /openmct

RUN apk update && apk upgrade \
  && apk add --no-cache git

COPY package.json ./

RUN npm install 

COPY . ./

RUN npm run build:prod

EXPOSE 8080

CMD ["npm", "start"]
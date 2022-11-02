FROM node:14-alpine as builder

LABEL maintainer="reachout@krishansaini.com"

COPY ./package*.json ./

RUN npm i

FROM node:14-alpine

EXPOSE 80

WORKDIR /app

COPY --from=builder node_modules node_modules
COPY . /app

CMD npm start

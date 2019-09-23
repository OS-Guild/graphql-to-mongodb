FROM node:10-alpine as dependencies

WORKDIR /service
COPY package.json ./
RUN yarn

COPY ./src ./src

CMD ["yarn", "start"]
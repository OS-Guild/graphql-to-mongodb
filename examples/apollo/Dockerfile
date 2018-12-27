FROM node:10-alpine as dependencies

WORKDIR /service
COPY package.json yarn.lock ./
RUN yarn

COPY ./src ./src

CMD ["yarn", "start"]
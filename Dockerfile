FROM node:14

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn

COPY . .

RUN yarn build

ENV PORT 80

EXPOSE 80

CMD yarn start
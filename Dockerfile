FROM node:22-alpine

RUN apk add --no-cache git

WORKDIR daedalOS
COPY . .

RUN yarn
RUN yarn build

CMD yarn serve

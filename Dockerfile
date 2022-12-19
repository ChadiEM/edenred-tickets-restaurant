FROM alpine:3.17

RUN apk add --no-cache chromium=~108 nodejs npm dumb-init

COPY package*.json ./
RUN npm install

RUN mkdir /app
COPY *.js /app

USER guest

ENV NODE_PATH='/usr/lib/node_modules'

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/edenred.js"]
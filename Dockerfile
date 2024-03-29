FROM alpine:3.17

RUN apk --no-cache upgrade && apk add --no-cache chromium=~109 nodejs npm dumb-init

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

RUN mkdir /app
COPY *.js /app

USER guest

ENV NODE_PATH='/usr/lib/node_modules'

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/edenred.js"]
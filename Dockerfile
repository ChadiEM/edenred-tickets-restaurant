FROM alpine

RUN apk add --no-cache chromium nodejs npm dumb-init

COPY package*.json ./
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install

RUN mkdir /app
COPY *.js /app

USER guest

ENV NODE_PATH='/usr/lib/node_modules'

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/edenred.js"]
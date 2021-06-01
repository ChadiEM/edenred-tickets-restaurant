FROM alpine

RUN apk add --no-cache chromium nodejs npm \
  && PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install -g puppeteer --unsafe-perm=true \
  && npm install express winston

RUN mkdir /app

ADD *.js /app

USER guest

ENTRYPOINT NODE_PATH='/usr/lib/node_modules' node /app/edenred.js
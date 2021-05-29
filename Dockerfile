FROM alpine

RUN apk add --no-cache chromium nodejs npm \
  && PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install -g puppeteer --unsafe-perm=true

ADD *.js ./

USER guest

ENTRYPOINT NODE_PATH='/usr/lib/node_modules' node edenred.js
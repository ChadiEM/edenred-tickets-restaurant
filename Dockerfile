FROM alpine

RUN apk add --no-cache chromium nodejs npm dumb-init \
  && PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install -g puppeteer --unsafe-perm=true \
  && npm install express winston

RUN mkdir /app

ADD *.js /app

USER guest

ENV NODE_PATH='/usr/lib/node_modules'

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/edenred.js"]
FROM alpine:3.17 as builder

RUN apk --no-cache upgrade && apk add --no-cache nodejs npm

RUN mkdir /app
WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY *.js /app/
RUN npm run build


FROM alpine:3.17

RUN apk --no-cache upgrade && apk add --no-cache chromium=~108 nodejs dumb-init

RUN mkdir /app
WORKDIR /app

COPY --from=builder /app/dist/edenred.js /app/

USER guest

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/edenred.js"]
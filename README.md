# Edenred Tickets Restaurants

A chrome-based tickets restaurant updater (because there's a CAPTCHA to resolve).
Exposes data on /tr endpoint.

## How to start
### Generate initial cookie seed
```
pip3 install -r requirements.txt
python3 seed.py
```

Login, solve the CAPTCHA, and hit enter. The cookie file will be saved on disk.

### Start

#### Regular
```shell
NODE_PATH='/usr/lib/node_modules' \
  EDENRED_USER=<login@company.com> \
  EDENRED_PASS=<pass> \
  EDENRED_COOKIE="$(cat path/to/cookie)" \
  node edenred.js
```
#### Docker
```shell
docker run -ti --rm \
  --cap-add=SYS_ADMIN \
  --env EDENRED_USER=<login@company.com> \
  --env EDENRED_PASS=<pass> \
  --env EDENRED_COOKIE="$(cat path/to/cookie)" \
  -p 8080:8080 \
  chadiem/edenred-tickets-restaurant
```

### Access data

Data can be accessed at http://localhost:8080/tr
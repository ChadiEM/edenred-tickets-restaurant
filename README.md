# Edenred Tickets Restaurants

## How to start
### Generate initial seed
```
pip3 install -r requirements.txt
python3 seed.py
```

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
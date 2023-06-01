#!/bin/bash
# Tue Mar 28 15:30:14 CST 2023 @ryuujo1573

## NOTE: this can be glichy, use with caution.
set -e
SDK_VERSION=$(pnpm info qnweb-rtc version)

# read env variables.
set -a
if [[ -f ".env.local" ]]; then
  source .env.local
else
  cat >.env.local <<-cfg
    DOCKER_USERNAME=
    DOCKER_REGISTRY=
    DOCKER_PATH=
    DOCKER_CREDENTIAL=
    DOCKER_PORT=80
    SERVER_HOST=
cfg
  exit
fi
set +a

# login to registry
echo "$DOCKER_CREDENTIAL" | docker login --username=$DOCKER_USERNAME $DOCKER_REGISTRY --password-stdin

# build project -> ./dist/*
pnpm build

# build docker image
docker build -t $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION . --platform linux/amd64

# push docker image
docker push $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION

# use ssh to connect to server host and executing commands on server.
# first, pull the latest image on server.
# then, query the running containers which ancestor image is the image.
#   if there is a running one, stop it and run a new one with the same port.
#   if there is no running one, run a new one with default port from env,
#     which removes itself when stopped.
# here's the script:
ssh $SERVER_HOST <<EOF
  docker pull $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION
  if [[ \$(docker ps -q --filter ancestor=$DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION) --format='{{.ID}}\n{{.Ports}}' ]]; then
    docker stop \$(docker ps -q --filter ancestor=$DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION --format='{{.ID}}')
    docker run -d --rm --name qnweb-rtc-demo -p \$(docker port qnweb-rtc-demo | cut -d':' -f2):80 $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION
  else
    docker run -d --rm --name qnweb-rtc-demo -p $DOCKER_PORT:80 $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION
  fi
EOF

#!/bin/bash
# Tue Mar 28 15:30:14 CST 2023 @ryuujo1573

## NOTE: this can be glichy, use with caution.
set -e # exits when any line failed

read -r SDK_VERSION DEMO_VERSION < <(
  node <<JS
const demo = require('./package.json')
const dep = demo.dependencies['qnweb-rtc']
if (dep.startsWith('link:')) {
  const pkg = require(dep.slice(5) + '/package.json')
  console.log(pkg.version, demo.version)
  // process.exit(pkg.version[0])
} else {
  // process.exit(1)
}
JS
)
# if sdk version is empty, exit
if [[ -n "$SDK_VERSION" ]]; then
  echo SDK Version: $SDK_VERSION, Demo Version: $DEMO_VERSION
else
  exit 6
fi
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
    DOCKER_PORT=
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
  docker stop \$(docker ps -q --filter name=qnweb-rtc-demo)
  docker run -d --rm --name qnweb-rtc-demo -p $DOCKER_PORT:80 $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION
EOF

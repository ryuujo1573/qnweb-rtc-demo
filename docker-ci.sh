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

# [server side scripts]
# pull - query - stop & run
#   query result
#     case "66f5629bd4b2 0.0.0.0:8085->80/tcp": docker stop + run
#     case null: docker run
#   when running a new instance, use former port if available,
#     or use default port provided by `$DOCKER_PORT`.
ssh $SERVER_HOST <<EOF
docker pull $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION && \
docker ps -a -q \
  --filter ancestor=$DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION \
  --format='{{.ID}}\n{{.Ports}}' \
  | xargs -n2 bash -c '\
    ! [[ \$0 = 'bash' ]] && echo "found \$0" && docker stop \$0 | xargs echo stopped\
    ; echo "\${1:-:$DOCKER_PORT}" | grep -Po "(?<=:)[0-9]+" \
    | xargs -I% docker run --rm -p %:80 -d $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION'
EOF

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
} else {
  console.log(dep, demo.version)
}
JS
)
# if sdk version is empty, exit
if [[ -n "$SDK_VERSION" ]]; then
  echo "qnweb-rtc@$SDK_VERSION 
  demo@$DEMO_VERSION" | column -t -s@
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

if (! docker stats --no-stream &>/dev/null); then
  case "$OSTYPE" in
  darwin*)
    open /Applications/Docker.app
    ;;
  linux*)
    sudo systemctl start docker
    ;;
  esac
  # anim3=(⠋ ⠇ ⠦ ⠴ ⠸ ⠙)
  # anim2=(⠉ ⠃ ⠆ ⠤ ⠰ ⠘)
  anim=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏)
  dots=('.  ' '.. ' '...' '   ')
  i=1
  while (! docker stats --no-stream &>/dev/null); do
    t=0
    # Docker takes a few seconds to initialize
    [[ j=$((j + 1)) -gt 3 ]] && j=0
    for t in {1..10}; do
      [[ i=$((i + 1)) -gt 5 ]] && i=0
      echo -ne "\r${anim[$i]} Waiting for Docker to launch${dots[$j]} "
      sleep 0.05
      t=$((t + 1))
    done
  done

fi

# login to registry
echo "$DOCKER_CREDENTIAL" | docker login --username=$DOCKER_USERNAME $DOCKER_REGISTRY --password-stdin

# build project -> ./dist/*
pnpm build

# build docker image
docker build -t $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION . --platform linux/amd64

# push docker image
docker push $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION

ssh $SERVER_HOST <<EOF
  docker pull $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION
  docker stop \$(docker ps -q --filter name=qnweb-rtc-demo)
  docker run -d --rm --name qnweb-rtc-demo -p $DOCKER_PORT:80 $DOCKER_REGISTRY/$DOCKER_PATH:$SDK_VERSION
EOF

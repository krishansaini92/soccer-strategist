# Fantasy game - Krishan

> Simple application where football/soccer fans will create fantasy teams and will be able to sell or buy players.

## Prerequisite

> Please install docker on your machine (https://docs.docker.com/desktop/mac/install/).  
If already installed, skip this step.

## Quick Start

> *Below mentioned steps have been tested on mac and ubuntu machine. For windows, steps may differ.*

```bash

# Run in Docker

docker-compose up -d
# use -d flag to run in background

```

You should be able to access the application on [http://localhost:3333](http://localhost:3333)
> Please find APIs postman collection in the repo. You can import it using Postman and start using the APIs.

```bash

# To view container logs
docker-compose logs -f --tail=1000

# To restart container
docker-compose restart
docker-compose restart mongo # Will only restart database
docker-compose restart server # Will only restart node app

# To run application tests
docker-compose exec server npm run test

# To do code formatting
docker-compose exec server npm run fmt

# To stop docker containers
docker-compose down


```
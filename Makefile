.DEFAULT_GOAL := help

#------------------------------------------------------------------------------
# Purpose:
#   Makefile that allows one to docker build, install openmct and start openmct
#
# Author of this Makefile: 
#  Haisam Ido<haisam.ido@gmail.com>
#
# Dependencies:
#   make, docker, docker-compose
#------------------------------------------------------------------------------

openmct-install: ## Install openmct on a docker image. This uses ./Dockerfile
	docker build -t openmct:latest .

openmct-up: openmct-install openmct-down ## Start openmct in docker container, in a detached state. This uses ./docker-compose.yml
	docker-compose up -d --remove-orphans
	@echo
	@echo "Connect via http://localhost:8080"
	@echo

openmct-down: ## Stop openmct on docker conainter
	docker-compose down -v --remove-orphans

openmct-shell: ## Shell into running container
	docker exec -it openmct_openmct_1 bash

help:
	@printf "\033[37m%-30s\033[0m %s\n" "#----------------------------------------------------------------------------------"
	@printf "\033[37m%-30s\033[0m %s\n" "# Makefile targets                                                                 |"
	@printf "\033[37m%-30s\033[0m %s\n" "#----------------------------------------------------------------------------------"
	@printf "\033[37m%-30s\033[0m %s\n" "#-target-----------------------description-----------------------------------------"
	@grep -E '^[a-zA-Z_-].+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

print-%:
	@echo $* = $($*)
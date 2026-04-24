APP_NAME ?= SwiftUITemplate

.PHONY: build run clean

build:
	./build-app.sh

run:
	./run-app.sh

clean:
	rm -rf build

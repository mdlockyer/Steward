APP_NAME ?= SwiftUITemplate

.PHONY: build run clean

build:
	./Scripts/build-app.sh

run:
	./Scripts/run-app.sh

clean:
	rm -rf Build

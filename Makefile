SHELL := /bin/zsh

format-gpx:
	slugify -adc **/*.gpx

dev:
	python3 -m http.server 3000

all: fetch-coffeescript fetch-sylvester

SYLVESTER=sylvester-0-1-3.zip

fetch-coffeescript:
	curl -O http://coffeescript.org/extras/coffee-script.js

fetch-sylvester:
	curl -O http://sylvester.jcoglan.com/assets/${SYLVESTER}
	unzip ${SYLVESTER} sylvester.js
	rm ${SYLVESTER}

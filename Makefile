all: fetch-coffeescript fetch-sylvester

SYLVESTER=sylvester-0-1-3.zip

fetch-coffeescript:
	./fetch http://coffeescript.org/extras/coffee-script.js

fetch-sylvester:
	./fetch http://sylvester.jcoglan.com/assets/${SYLVESTER}
	unzip ${SYLVESTER} sylvester.js
	mv sylvester.js shady_business
	rm ${SYLVESTER}

clean:
	rm -f coffee-script.js shady_business/sylvester.js

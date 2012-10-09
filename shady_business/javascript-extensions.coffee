Array.prototype.minBy = (selector = (el) -> el) ->
	this.reduce ((a, b) ->
		[sa, sb] = [selector(a), selector(b)]
		if sa < sb then a else b)

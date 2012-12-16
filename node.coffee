window.Node = class Node
	constructor: (@position) ->
		@connections = []

	distanceFrom: (node) ->
		@position.distanceFrom node.position

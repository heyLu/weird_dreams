window.Node = class Node
	connections: []

	constructor: (@position) ->

	distanceFrom: (node) ->
		@position.distanceFrom node.position

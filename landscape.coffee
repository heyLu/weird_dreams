#randomPoint = () ->
#    Vector.create [Math.random() * 300, Math.random() * 300].map(Math.round)

window.Landscape = class Landscape
	nodes: []
	fancyNodes: []
	
	constructor: (@populationFunc, @currentNode = new Node(Vector.create [0, 0]),
	              step = Vector.create [10, 0]) ->
		@lastStep = step
		@nodes.push @currentNode

	nextNode: (currentNode = @currentNode, lastStep = @lastStep) ->
		bestPosition = @_bestPositionNode(currentNode, lastStep)
		newNode = new Node(bestPosition)
		closeNodes = @nodesCloseTo(newNode, 5)
		if closeNodes.length >= 1
			newNode = closeNodes[0]
			@fancyNodes.push newNode
			@lastStep = Vector.createFromTo currentNode.position, newNode.position
			currentNode.connections.push newNode
			@currentNode = newNode
		else
			@lastStep = Vector.createFromTo currentNode.position, bestPosition
			@nodes.push newNode
			currentNode.connections.push newNode
			@currentNode = newNode
	
	_bestPositionNode: (currentNode, lastStep) ->
		randomAngles = (@_randomWithin(-Math.PI/3, Math.PI/3) for n in [1..3])
		# continue in direction of previous node
		# rotate around random angles
		createCandidate = (angle) -> currentNode.position.add(lastStep).rotate(angle, currentNode.position)
		candidates = (createCandidate(angle) for angle in randomAngles)
		# choose node with highest population (??)
		candidates.reduce (a, b) =>
			[popA, popB] = [a, b].map @populationFunc
			if popA > popB then a else b
	
	_randomWithin: (low, high) ->
		low + Math.random() * (Math.abs low - high)
	
	nodesCloseTo: (node, minDistance) ->
		closeNodes = []
		for candidate in @nodes
			if candidate isnt node and node.distanceFrom(candidate) <= minDistance
				closeNodes.push candidate
		closeNodes
	
	@populationFromRadialHighpoints: (highpoints, maxPopulation) ->
		(node) ->
			closest = highpoints[0]
			for point in highpoints
				if point.distanceFrom(node) < closest.distanceFrom(node)
					closest = point
			300 - Math.round(closest.distanceFrom node)

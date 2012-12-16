#randomPoint = () ->
#    Vector.create [Math.random() * 300, Math.random() * 300].map(Math.round)

window.Landscape = class Landscape
	nodes: []
	fancyNodes: []
	conns: []
	
	constructor: (@populationFunc, @currentNode = new Node(Vector.create [0, 0]),
	              step = Vector.create [10, 0]) ->
		@lastStep = step
		@nodes.push @currentNode

	nextNode: (currentNode = @currentNode, lastStep = @lastStep) ->
		bestPosition = @_bestPositionNode(currentNode, lastStep)
		newNode = new Node(bestPosition)
		closeNodes = @nodesCloseTo(newNode, 15)
		closestCrossing = closeNodes[0]
		[closestIntersection, segmentStart, segmentEnd] =
			@intersectingPoints(currentNode.position, bestPosition, closeNodes)[0] or
		      [undefined, undefined, undefined]
		if closestCrossing? and closestIntersection? and
		     closestCrossing.position.distanceFrom(currentNode.position) > closestIntersection.distanceFrom(currentNode.position)
			console.log "intersection"
			newNode = new Node closestIntersection
			if newNode.position.distanceFrom(currentNode.position) < 10
				console.log "skip"
				return
			@nodes.push newNode
			segmentStart.connections[segmentStart.connections.indexOf(segmentEnd)] = newNode
			newNode.connections.push segmentEnd
			@fancyNodes.push newNode.position
			@conns.push [segmentStart.position, segmentEnd.position]
		else if closestCrossing? and closestCrossing.position.distanceFrom(newNode.position) <= 5
			console.log "crossing", Math.round(closestCrossing.position.distanceFrom(currentNode.position))
			if newNode.position.distanceFrom(currentNode.position) < 10
				console.log "skip"
				return
			newNode = closestCrossing
		else
			if newNode.position.distanceFrom(currentNode.position) < 10
				console.log "skip"
				return
			console.log "std"
			@nodes.push newNode
		@lastStep = Vector.createFromTo currentNode.position, newNode.position
		@lastStep = @lastStep.toUnitVector().multiply(10)
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
			candidateDist = node.distanceFrom(candidate)
			if candidate isnt node and candidate isnt @currentNode and candidateDist <= minDistance
					closeNodes.push candidate
		closeNodes.sort (a, b) -> a.position.distanceFrom(node.position) - b.position.distanceFrom(node.position)
	
	intersectingPoints: (segmentStart, segmentEnd, intersectionCandidates) ->
		streetSegments = []
		for ic in intersectionCandidates
			for conn in ic.connections
				streetSegments.push [Line.createFromTo(ic.position, conn.position), ic, conn]
		
		intersections = []
		nodeSegment = Line.createFromTo segmentStart, segmentEnd
		for [segment, start, end] in streetSegments
			intersection = nodeSegment.intersectionWith(segment)
			[sx, sy] = start.position.elements
			[ex, ey] = end.position.elements
			[xs, xe] = if sx < ex then [sx, ex] else [ex, sx]
			[ys, ye] = if sy < ey then [sy, ey] else [ey, sy]
			if intersection? and segmentEnd.to3D().distanceFrom(intersection) < 10 and
			     xs < intersection.e(1) < xe and
			     ys < intersection.e(2) < ye
				intersection = Vector.create [intersection.e(1), intersection.e(2)]
				intersections.push [intersection, start, end]
		#console.log intersections.map (isec) -> isec[0].distanceFrom(segmentEnd)
		intersections
	
	@populationFromRadialHighpoints: (highpoints, maxPopulation) ->
		(node) ->
			closest = highpoints[0]
			for point in highpoints
				if point.distanceFrom(node) < closest.distanceFrom(node)
					closest = point
			300 - Math.round(closest.distanceFrom node)

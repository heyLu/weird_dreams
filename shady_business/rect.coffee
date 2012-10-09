class Rect
	constructor: (@x, @y, @width, @height) ->

	outerMostPoints: (viewpoint, ctx) ->
		corners = [Vector.create([@x, @y, 0]),
			Vector.create([@x + @width, @y, 0]),
			Vector.create([@x, @y + @height, 0]),
			Vector.create([@x + @width, @y + @height, 0])]
		outerMostPoints = []
		projectionLine = Line.createFromTo(corners[0], viewpoint).rotate(Math.PI/2, corners[0])

		for corner in corners
			intersection = projectionLine.intersectionWith(Line.createFromTo(corner, viewpoint))
			corner.scale = projectionLine.scaleFactorOf intersection

			if outerMostPoints[0] is undefined or corner.scale < outerMostPoints[0].scale
				outerMostPoints[0] = corner
			if outerMostPoints[1] is undefined or corner.scale > outerMostPoints[1].scale
				outerMostPoints[1] = corner

		outerMostPoints

	shadowFromDirection: (direction, boundaries) ->
		corners = @outerMostPoints direction
		shadow = []

		for corner in corners
			intersections = []

			sourceToCorner = Line.createFromTo(direction, corner)
			for boundary in boundaries
				intersection = sourceToCorner.intersectionWith(boundary)
				if intersection?
					intersections.push intersection.round()

			sf = (el) -> sourceToCorner.scaleFactorOf el
			candidates = intersections.filter((el) -> sf(el) > 0)
			if candidates.length is 0
				return []
			shadow.push candidates.minBy(sf).round()

		if shadow[0].e(1) != shadow[1].e(1) and shadow[0].e(2) != shadow[1].e(2)
			[topLeft, topRight, bottomLeft, bottomRight] = [
				boundaries[0].anchor,
				boundaries[3].anchor,
				boundaries[2].anchor,
				Vector.create([boundaries[3].anchor.e(1), boundaries[2].anchor.e(2), 0])]
			[x1, y1] = shadow[0].elements
			[x2, y2] = shadow[1].elements
			
			if y1 is topLeft.e(1) and x2 is topLeft.e(2)
				shadow.splice 1, 0, topLeft
			else if x1 is 0 and y2 is bottomLeft.e(2)
				shadow.splice 1, 0, bottomLeft
			else if x1 is topRight.e(1) and y2 is 0
				shadow.splice 1, 0, topRight
			else if y1 is topRight.e(1) and x2 is bottomLeft.e(2)
				shadow.splice 1, 0, bottomRight
			else if y2 is topLeft.e(2) and y1 is bottomLeft.e(2)
				shadow.splice 1, 0, bottomRight, topRight

		shadow.unshift corners[0]
		shadow.push corners[1]
		shadow

	draw: (context) ->
		context.fillRect @x, @y, @width, @height

window.Rect = Rect

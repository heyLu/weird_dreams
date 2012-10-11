class Rect
	constructor: (@x, @y, @width, @height) ->

	outerMostPoints: (viewpoint, ctx) ->
		corners = [Vector.create([@x, @y, 0]),
			Vector.create([@x + @width, @y, 0]),
			Vector.create([@x, @y + @height, 0]),
			Vector.create([@x + @width, @y + @height, 0])]
		outerMostPoints = []
		closestToViewpoint = corners.minBy (c) -> c.distanceFrom(viewpoint)
		projectionLine = Line.createFromTo(closestToViewpoint, viewpoint).rotate(Math.PI/2, closestToViewpoint)

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
				throw new Error("No intersections with boundaries")
			shadow.push candidates.minBy(sf).round()

		if shadow[0].e(1) != shadow[1].e(1) and shadow[0].e(2) != shadow[1].e(2)
			[topLeft, topRight, bottomLeft, bottomRight] = [
				boundaries[0].anchor,
				boundaries[3].anchor,
				boundaries[2].anchor,
				Vector.create([boundaries[3].anchor.e(1), boundaries[2].anchor.e(2), 0])]
			[minX, minY, maxX, maxY] = [topLeft.e(1), topLeft.e(2), bottomRight.e(1), bottomRight.e(2)]
			[x1, y1] = shadow[0].elements
			[x2, y2] = shadow[1].elements
			
			if y1 is minY and x2 is minX
				shadow.splice 1, 0, topLeft
			else if x1 is minX and y2 is maxY
				shadow.splice 1, 0, bottomLeft
			else if x1 is maxX and y2 is minY
				shadow.splice 1, 0, topRight
			else if y1 is maxY and x2 is maxX
				shadow.splice 1, 0, bottomRight
			else if y2 is minY and y1 is maxY
				shadow.splice 1, 0, bottomRight, topRight
			else if y1 is minY and y2 is maxY
				shadow.splice 1, 0, topLeft, bottomLeft

		shadow.unshift corners[0]
		shadow.push corners[1]
		shadow

	draw: (context) ->
		context.fillRect @x, @y, @width, @height

window.Rect = Rect

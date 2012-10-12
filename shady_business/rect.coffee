class Rect
	constructor: (@x, @y, @width, @height) ->

	addTo: (space) ->
		moment = cp.momentForBox 1, @width, @height
		@body = space.addBody new cp.Body(1, moment)
		@body.setPos cp.v(@x + @width / 2, @y + @height / 2)

		@shape = space.addShape new cp.BoxShape(@body, @width, @height)

	update: () ->
		@x = @body.p.x - @width / 2
		@y = @body.p.y - @height / 2

	outerMostPoints: (viewpoint, ctx) ->
		[topLeft, topRight, bottomLeft, bottomRight] = [
			Vector.create([@x, @y, 0]),
			Vector.create([@x + @width, @y, 0]),
			Vector.create([@x, @y + @height, 0]),
			Vector.create([@x + @width, @y + @height, 0])]
		[vx, vy] = [viewpoint.e(1), viewpoint.e(2)]
		withinXRange = @x <= vx <= @x + @width
		withinYRange = @y <= vy <= @y + @height

		if withinXRange and vy < @y
			[topLeft, topRight]
		else if withinXRange and vy > @y + @height
			[bottomLeft, bottomRight]
		else if withinYRange and vx < @x
			[topLeft, bottomLeft]
		else if withinYRange and vx > @x + @width
			[topRight, bottomRight]
		else if vx < @x and vy < @y
			[bottomLeft, topRight]
		else if vx > @x + @width and vy < @y
			[topLeft, bottomRight]
		else if vx > @x + @width and vy > @y + @height
			[topRight, bottomLeft]
		else if vx < @x and vy > @y + @height
			[topLeft, bottomRight]

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

		[topLeft, topRight, bottomLeft, bottomRight] = [
			boundaries[0].anchor,
			boundaries[3].anchor,
			boundaries[2].anchor,
			Vector.create([boundaries[3].anchor.e(1), boundaries[2].anchor.e(2), 0])]
		[minX, minY, maxX, maxY] = [topLeft.e(1), topLeft.e(2), bottomRight.e(1), bottomRight.e(2)]
		[x1, y1] = shadow[0].elements
		[x2, y2] = shadow[1].elements
		[vx, vy] = [direction.e(1), direction.e(2)]
		
		if y1 is minY and x2 is minX or x1 is minX and y2 is minY
			shadow.splice 1, 0, topLeft
		else if y1 is minY and x2 is maxX or x1 is maxX and y2 is minY
			shadow.splice 1, 0, topRight
		else if x1 is maxX and y2 is maxY or y1 is maxY and x2 is maxX
			shadow.splice 1, 0, bottomRight
		else if x1 is minX and y2 is maxY or y1 is maxY and x2 is minX
			shadow.splice 1, 0, bottomLeft
		else if y1 is minY and y2 is maxY
			if vx < @x
				shadow.splice 1, 0, topRight, bottomRight
			else
				shadow.splice 1, 0, topLeft, bottomLeft
		else if x1 is minX and x2 is maxX
			if vy < @y
				shadow.splice 1, 0, bottomLeft, bottomRight
			else
				shadow.splice 1, 0, topLeft, topRight

		shadow.unshift corners[0]
		shadow.push corners[1]
		shadow

	draw: (context) ->
		context.fillRect @x, @y, @width, @height

window.Rect = Rect

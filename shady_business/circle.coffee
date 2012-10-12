class Circle
	constructor: (@x, @y, @radius) ->

	addTo: (space) ->
		moment = cp.momentForCircle 1, 0, @radius, cp.vzero
		@body = space.addBody new cp.Body(1, moment)
		@body.setPos cp.v(@x, @y)

		@shape = space.addShape new cp.CircleShape(@body, @radius, cp.vzero)

	update: () ->
		@x = @body.p.x
		@y = @body.p.y
	
	shadowFromDirection: () ->
		[]
	
	draw: (ctx) ->
		ctx.beginPath()
		ctx.arc @x, @y, @radius, 0, Math.PI * 2
		ctx.fill()

window.Circle = Circle

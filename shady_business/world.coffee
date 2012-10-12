# A world of quadriliteral shapes, to be drawn upon a Canvas element,
# for your viewing pleasure and great good.
class World
	constructor: () ->
		@boundaries = [Line.X, Line.Y,
			Line.create([0, 300], [1, 0]),
			Line.create([300, 0], [0, 1])]
		@shapes = []
		@lightSource = Vector.create [0, 0]

		@space = new cp.Space()
		@space.gravity = cp.v(0, 10)

		@ground = new cp.SegmentShape @space.staticBody,
			cp.v(0, 270), cp.v(300, 270), 0
		@ground.setFriction 1
		@space.addShape @ground

	add: (shape) ->
		shape.addTo @space
		@shapes.push shape

	update: (time) ->
		@space.step time

		for shape in @shapes
			shape.update()

	draw: (context) ->
		ctx.save()
		ctx.strokeStyle = "gray"
		ctx.beginPath()
		ctx.lineTo 0, 0
		ctx.lineTo 300, 0
		ctx.lineTo 300, 300
		ctx.lineTo 0, 300
		ctx.lineTo 0, 0
		ctx.stroke()
		ctx.restore()

		ctx.fillRect 0, 270, 300, 30

		for shape in @shapes
			shadow = shape.shadowFromDirection(@lightSource, @boundaries)
			context.save()
			context.fillStyle = "gray"
			context.beginPath()
			for point in shadow
				context.lineTo point.e(1), point.e(2)
			context.fill()
			context.restore()

		for shape in @shapes
			shape.draw(context)

		if World.debug
			context.save()
			context.fillStyle = "red"
			for arbiter in @space.arbiters
				for contact in arbiter.contacts
					context.fillRect contact.p.x, contact.p.y, 1, 1
			context.restore()

World.debug = false
window.World = World

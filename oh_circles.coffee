class Vector
	constructor: (p1, p2) ->
		console.log "Vector: Warning", p1, p2 unless p1? and p2?
		@x = p2.x - p1.x
		@y = p2.y - p1.y

	@fromPoint: (x, y) ->
		new Vector { x: 0, y: 0 }, { x: x, y: y }

	@random: (p1 = { x: 0, y: 0}, p2 = { x: window.innerWidth * 0.01, y: window.innerHeight * 0.01}) ->
		flippy = (n) -> if Math.random() < 0.5 then -1 else 1
		new Vector p1, { x: flippy(p2.x), y: flippy(p2.y)}

	copy: () ->
		new Vector { x: 0, y: 0 }, { x: @x, y: @y }

	length: () ->
		@_length ?= Math.sqrt(@x * @x + @y * @y)
	
	normalize: () ->
		Vector.fromPoint @x / @length(), @y / @length()
	
	add: (otherVector) ->
		Vector.fromPoint @x + otherVector.x, @y + otherVector.y
	
	mult: (scalar) ->
		Vector.fromPoint @x * scalar, @y * scalar

class Circle
	constructor: (@origin, @radius, @color = "#000", @fill = true) ->
		throw new Error "not a circle!" unless @origin? and @origin.x? and @origin.y?
		@alive = true
		@movement = new Vector({ x: 0, y: 0 }, { x: 0, y: 0 })

	@random = (x, y, radius, color, fill) ->
		x = Math.random() * (x ? window.innerWidth)
		y = Math.random() * (y ? window.innerHeight)
		radius = Math.random() * (radius ? Math.min(window.innerWidth, window.innerHeight) * (1/25))

		new Circle { x: x, y: y }, radius, color, fill

	touches: (otherCircle) ->
		console.log "Circle.touches: Warning", otherCircle unless otherCircle?
		@radius > @distance(otherCircle) - otherCircle.radius

	distance: (otherCircle) ->
		new Vector(@origin, otherCircle.origin).length()

	absorb: (otherCircle) ->
		return unless otherCircle.alive
		return unless @alive
		otherCircle.alive = false
		@radius += otherCircle.radius * 0.25
		@
	
	accelerate: (vec, emit = true) ->
		return @ unless @radius - vec.length() > 2
		@movement = @movement.add vec
		@radius -= vec.length()
		@
	
	move: () ->
		correct = (pos, r, max) ->
			if pos - r < 0
				if pos < 0 then Math.abs(pos) + r else r - pos
			else
				max - pos - r

		if @origin.x - @radius < 0 or @origin.x + @radius > w.canvas.width
			@origin.x += correct @origin.x, @radius, w.canvas.width
			@movement.x *= -1
			#console.log "x", @origin.x, @origin.y, @movement.x, @movement.y if @origin.x < 0
		else if @origin.y - @radius < 0 or @origin.y + @radius > w.canvas.height
			corr = correct @origin.y, @radius, w.canvas.height
			y = @origin.y
			@origin.y += corr
			@movement.y *= -1
			console.log "y", @origin.y, y, corr if @origin.y < 0

		@origin.x += @movement.x
		@origin.y += @movement.y
		@

	draw: (ctx) ->
		ctx.fillStyle = ctx.strokeStyle = "#fff"
		ctx[if @fill then "fillStyle" else "strokeStyle"] = if @radius > w.self.radius then "#f00" else @color

		ctx.save()

		ctx.translate @origin.x, @origin.y
		ctx.beginPath()
		ctx.arc 0, 0, @radius, 0, 360

		ctx[if @fill then "fill" else "stroke"]()

		ctx.shadowColor = "rgba(255, 255, 255, #{if @alive then 0.8 else 0.3 })"
		ctx.shadowBlur = @radius * if @radius > w.self.radius then 0.6 else 0.3
		ctx.stroke()

		ctx.restore()

class World
	constructor: () ->
		@canvas = document.createElement "canvas"
		@ctx = @canvas.getContext '2d'
		@objects = []
		@newObjects = []
		@self = new Circle.random null, null, null, "#00f"
		@self.radius = 30
		@calculating = false
		@stop = false
		@v = null

		@canvas.width  = window.innerWidth
		@canvas.height = window.innerHeight
		document.body.appendChild @canvas

		@canvas.onmousedown = (ev) =>
			switch ev.which
				when 1
					@v = new Vector(@self.origin, { x: ev.clientX , y: ev.clientY }).normalize().mult(-0.15)
					@self.accelerate @v
					#@ctx.translate ev.clientX, ev.clientY
					#@ctx.scale 2, 2
				when 2 then document.location.reload()
				when 3
					@stop = if @stop then false else true

		@canvas.onmouseup = (ev) => @v = null
		@canvas.oncontextmenu = (ev) -> false

		window.onkeydown = (ev) =>
			if ev.keyCode is 32 # space
				@stop = if @stop then false else true
				ev.preventDefault()
	
	@random: (n = Math.random() * Math.min(window.innerWidth, window.innerHeight) * 0.2) ->
		w = new World
		for i in [1..n]
			w.add Circle.random().accelerate(Vector.random().normalize().mult(Math.random()), false)
		w

	add: (obj) ->
		@objects.push obj
	
	addLater: (obj) ->
		@newObjects.push obj
	
	remove: (obj) ->
		index = @objects.indexOf obj
		return if index is -1
		@objects.splice index, 1
	
	recalc: () ->
		@objects = @objects.concat @newObjects
		@newObjects = []

		for obj in @objects
			if @self.touches(obj)
				if @self.radius > obj.radius
					@self.absorb obj
				else
					obj.absorb @self
					@self.fill = false

		for obj in @objects
			continue unless obj? # FIXME: Why is it undefined?
			@remove obj unless obj.alive

		oldObjects = (o = {}; o.__proto__ = @objects; o)

		for obj in oldObjects
			for otherObj in oldObjects
				continue if obj == otherObj

				if obj.touches(otherObj) and obj.radius > otherObj.radius
					obj.absorb otherObj

		for obj in oldObjects
			continue unless obj? # FIXME: Why is it undefined?
			@remove obj unless obj.alive

		undefined

	clear: () ->
		@ctx.clearRect 0, 0, @canvas.width, @canvas.height

	draw: () ->
		@clear()
		@ctx.fillStyle = "#333"
		@ctx.fillRect 0, 0, @canvas.width, @canvas.height
		o.draw @ctx for o in @objects
		@self.draw @ctx

	drawOnce: (obj) ->
		@draw()
		obj.draw @ctx
	
	animationLoop: () ->
		return if @stop

		if @v?
			@self.accelerate @v

		unless @calculating
			@calculating = true
			@recalc()
			@calculating = false

		for obj in @objects
			obj.move()
		@self.move()
		@draw()

window.w = World.random()
w.draw()

w.self.accelerate new Vector { x: 0, y: 0 }, { x: 0.5, y: 0.5 }, false
last = new Date().getTime()

animate = () ->
	requestAnimFrame animate
	fps = Math.round 1000 / (new Date().getTime() - last)
	document.title = "Oh, circles! (#{fps})"
	last = new Date().getTime()
	w.animationLoop(fps)
animate()

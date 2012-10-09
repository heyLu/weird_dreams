Vector.prototype.draw = (context, size = 1) ->
	context.fillRect this.e(1), this.e(2), size, size

Line.createFromTo = (p1, p2) ->
	p1 = p1.elements || p1
	p2 = p2.elements || p2
	direction = [p2[0] - p1[0], p2[1] - p1[1]]
	Line.create p1, direction

Line.prototype.draw = (context, scale = 20) ->
	context.beginPath()
	context.moveTo @anchor.e(1), @anchor.e(2)
	context.lineTo @anchor.e(1) + @direction.e(1) * scale,
		@anchor.e(2) + @direction.e(2) * scale
	context.closePath()
	context.stroke()

Line.prototype.scaleFactorOf = (vectorOnLine) ->
	(vectorOnLine.e(1) - this.anchor.e(1)) / this.direction.e(1)
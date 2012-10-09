window.canvas = canvas = document.getElementById 'stage'
window.ctx = ctx = canvas.getContext '2d'

window.lightSource = lightSource = Vector.create [70, 20, 0]
window.boundaryX = Line.create([0, 180], [1, 0])
window.boundaryY = Line.create([180, 0], [0, 1])
boundaries = [Line.X, Line.Y, boundaryX, boundaryY]

ctx.translate 50, 50
ctx.rotate -Math.PI / 16
ctx.scale 3, 3

draw = () ->
	ctx.save()
	ctx.clearRect 0, 0, canvas.clientWidth, canvas.clientHeight

	ctx.save()

	ctx.strokeStyle = "gray"
	ctx.beginPath()
	ctx.moveTo 0, 0
	ctx.lineTo 300, 0
	ctx.moveTo 0, 0
	ctx.lineTo 0, 300
	ctx.closePath()
	ctx.stroke()

	boundaryX.draw(ctx, 300)
	boundaryY.draw(ctx, 300)

	ctx.restore()

	window.r = r = new Rect(60, 60, 10, 10)
	shadow = r.shadowFromDirection lightSource, boundaries
	
	ctx.save()
	ctx.fillStyle = "blue"
	ctx.beginPath()
	for point in shadow
		ctx.lineTo point.e(1), point.e(2)
	ctx.fill()
	ctx.restore()

	lightSource.draw(ctx)

	ctx.fillRect 0, 0, 20, 20
	ctx.fillRect 30, 0, 10, 10
	ctx.fillRect 0, 50, 15, 15
	r.draw(ctx)


	ctx.restore()

draw()

canvas.onmousemove = (ev) ->
	mouseOnScreen = Vector.create [ev.clientX, ev.clientY, 1]
	[a, b, c, d, e, f] = ctx.mozCurrentTransformInverse
	transformMatrix = Matrix.create [[a, c, e], [b, d, f], [0, 0, 1]]
	mouseTransformed = transformMatrix.multiply(mouseOnScreen).round()
	window.lightSource = lightSource = Vector.create [
		mouseTransformed.e(1), mouseTransformed.e(2), 0]
	draw()

canvas.onmousedown = () ->


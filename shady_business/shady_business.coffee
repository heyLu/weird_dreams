window.canvas = canvas = document.getElementById 'stage'
window.ctx = ctx = canvas.getContext '2d'
addContextCurrentTransform(ctx)

ctx.translate 50, 50
ctx.rotate -Math.PI / 16

window.w = w = new World()
w.add new Rect(100, 100, 10, 30)
w.add new Circle(105, 50, 7.5)

w.draw(ctx)

canvas.onmousemove = () ->
	ctx.clearRect 0, 0, canvas.width, canvas.height
	w.update 1/60
	w.draw(ctx)

###
canvas.onmousemove = (ev) ->
	mouseOnScreen = Vector.create [ev.clientX, ev.clientY, 1]
	[a, b, c, d, e, f] = ctx.mozCurrentTransformInverse
	transformMatrix = Matrix.create [[a, c, e], [b, d, f], [0, 0, 1]]
	mouseTransformed = transformMatrix.multiply(mouseOnScreen).round()
	window.lightSource = lightSource = Vector.create [
		mouseTransformed.e(1), mouseTransformed.e(2), 0]
	w.draw(ctx)
###

canvas.onmousedown = () ->
	World.debug = !World.debug

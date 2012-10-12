window.canvas = canvas = document.getElementById 'stage'
window.ctx = ctx = canvas.getContext '2d'
addContextCurrentTransform(ctx)

ctx.translate 50, 50
ctx.rotate -Math.PI / 16
ctx.scale 2, 2

window.w = w = new World()
w.lightSource = Vector.create [155, 300, 0]
for n in [0..4].concat([7..11])
	w.add new Rect(n*25 + 10, 200, 10, 10)
w.add new Rect(150, 100, 10, 30)
w.add new Circle(155, 50, 7.5)

w.draw(ctx)

canvas.onmousemove = () ->

runAwayLoop = () ->
	requestAnimFrame runAwayLoop

	ctx.clearRect 0, 0, canvas.width, canvas.height
	w.update 1/60
	w.draw(ctx)
runAwayLoop()

canvas.onmousemove = (ev) ->
	mouseOnScreen = Vector.create [ev.clientX, ev.clientY, 1]
	[a, b, c, d, e, f] = ctx.mozCurrentTransformInverse
	transformMatrix = Matrix.create [[a, c, e], [b, d, f], [0, 0, 1]]
	mouseTransformed = transformMatrix.multiply(mouseOnScreen).round()
	w.lightSource = Vector.create [
		mouseTransformed.e(1), mouseTransformed.e(2), 0]
	w.lightSource.draw(ctx, "green")

canvas.onmousedown = () ->
	World.debug = !World.debug

canvas.onmouseout = () ->
	w.lightSource = Vector.create [155, 300, 0]

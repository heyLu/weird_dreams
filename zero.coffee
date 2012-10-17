canvas = document.createElement "canvas"
canvas.width  = window.innerWidth
canvas.height = window.innerHeight

document.body.appendChild canvas

window.ctx = canvas.getContext '2d'
ctx.font = "30em serif"
ctx.textAlign = "center"
ctx.textBaseline = "middle"
angle = 0

draw = () ->
	ctx.clearRect 0, 0, canvas.width, canvas.height
	ctx.save()
	ctx.translate canvas.width / 2, canvas.height / 2
	ctx.rotate angle
	angle += Math.PI / 80
	ctx.fillText "0", 0, 0
	ctx.restore()

animation = () ->
	webkitRequestAnimationFrame animation
	draw()

animation()

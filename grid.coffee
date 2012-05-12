class Grid
	constructor: (@dimension = { x: 100, y: 100 }, @elementSize = 5) ->
	
	draw: (ctx, x, y, width, height) ->
		ctx.save()

		ctx.translate x, y
		ctx.scale width / @dimension.x, height / @dimension.y

		ctx.strokeStyle = "#000"

		for xPos in [0..@dimension.x / @elementSize]
			ctx.beginPath()
			ctx.moveTo xPos * @elementSize, 0
			ctx.lineTo xPos * @elementSize, @dimension.y
			ctx.stroke()

		for yPos in [0..@dimension.y / @elementSize]
			ctx.beginPath()
			ctx.moveTo 0, yPos * @elementSize
			ctx.lineTo @dimension.x, yPos * @elementSize
			ctx.stroke()

		ctx.restore()
window.Grid = Grid

class GridOfGrids
	constructor: (@amount = { x: 3, y: 3 }, @grid = new Grid()) ->

	draw: (ctx, x, y, width, height) ->
		ctx.save()

		ctx.translate x, y
		ctx.scale(width  / (@amount.x * @grid.dimension.x + (@amount.x - 1) * @grid.elementSize),
		          height / (@amount.y * @grid.dimension.y + (@amount.y - 1) * @grid.elementSize))

		for xPos in [0..@amount.x-1]
			for yPos in [0..@amount.y-1]
				[padX, padY] = [xPos * @grid.elementSize, yPos * @grid.elementSize]
				@grid.draw ctx, padX + xPos * @grid.dimension.x, padY + yPos * @grid.dimension.y, @grid.dimension.x, @grid.dimension.y

		ctx.restore()

canvas = document.createElement "canvas"
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.body.appendChild canvas

window.ctx = canvas.getContext '2d'
size = Math.min canvas.width, canvas.height

ctx.rotate -Math.PI / 8
new GridOfGrids().draw ctx, 0, 0, size, size

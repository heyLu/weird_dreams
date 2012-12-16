# Sylvester extensions
Vector.prototype.draw = (context) ->
    context.fillRect(this.e(1), this.e(2), 1, 1)

Vector.createFromTo = (p1, p2) ->
    p1 = p1.elements || p1
    p2 = p2.elements || p2
    direction = [p2[0] - p1[0], p2[1] - p1[1]]
    Vector.create direction

Line.createFromTo = (p1, p2) ->
    p1 = p1.elements || p1
    p2 = p2.elements || p2
    direction = [p2[0] - p1[0], p2[1] - p1[1]]
    Line.create p1, direction

canvas = document.getElementById('stage')
window.ctx = canvas.getContext('2d')
ctx.scale 3, 3

highpoints = [[50, 50], [100, 50], [75, 100]].map Vector.create
window.landscape = new Landscape(Landscape.populationFromRadialHighpoints highpoints)
cur = () ->
	landscape.currentNode.position

landscape.currentNode.position.draw(ctx)
for n in [1..500]
	landscape.nextNode()

draw = (n) ->
	drawDelayed = () ->
		if landscape.nodes.length > pos
			ctx.beginPath()
			p1 = landscape.nodes[pos]
			for p2 in p1.connections
				ctx.beginPath()
				ctx.lineTo p1.position.e(1), p1.position.e(2)
				ctx.lineTo p2.position.e(1), p2.position.e(2)
				ctx.stroke()
			p1.position.draw(ctx)
			if Landscape.debug
				ctx.font = "3px sans-serif"
				ctx.fillText "#{pos}:#{Math.round p1.position.e(1)},#{Math.round p1.position.e(2)}", p1.position.e(1), p1.position.e(2)
			pos += 1
			window.setTimeout drawDelayed, n
		else
			ctx.fillStyle = "green"
			for p in landscape.fancyNodes
				p.draw(ctx)
			ctx.fillStyle = "blue"
			for [p1, p2] in landscape.conns
				p1.draw(ctx)
				p2.draw(ctx)

	pos = 0
	window.setTimeout drawDelayed, n

draw 50

for p in highpoints
	ctx.fillStyle = "red"
	p.draw(ctx)
	ctx.fillStyle = "black"

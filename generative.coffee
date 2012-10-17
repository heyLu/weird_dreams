# Sylvester extensions
Vector.prototype.draw = (context) ->
    context.fillRect(this.e(1), this.e(2), 1, 1)

Vector.createFromTo = (p1, p2) ->
    p1 = p1.elements || p1
    p2 = p2.elements || p2
    direction = [p2[0] - p1[0], p2[1] - p1[1]]
    Vector.create direction

ctx = document.getElementById('stage').getContext('2d')
ctx.scale 3, 3

highpoints = [[50, 50], [100, 50], [75, 100]].map Vector.create
window.landscape = new Landscape(Landscape.populationFromRadialHighpoints highpoints)
cur = () ->
	landscape.currentNode.position

landscape.currentNode.position.draw(ctx)
for n in [1..100]
	landscape.nextNode()

draw = (n) ->
	drawDelayed = () ->
		if nodes.length > 1
			ctx.beginPath()
			[p1, p2] = nodes[0..1]
			ctx.lineTo p1.position.e(1), p1.position.e(2)
			ctx.lineTo p2.position.e(1), p2.position.e(2)
			ctx.stroke()
			p1.position.draw(ctx)
			nodes.shift()
			window.setTimeout drawDelayed, n
		else
			ctx.fillStyle = "green"
			for p in landscape.fancyNodes
				p.position.draw(ctx)

	nodes = [].concat landscape.nodes
	window.setTimeout drawDelayed, n

draw 50

for p in highpoints
	ctx.fillStyle = "red"
	p.draw(ctx)
	ctx.fillStyle = "black"

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
ctx.beginPath()
ctx.lineTo cur().e(1), cur().e(2)
for n in [1..100]
	landscape.nextNode()
	ctx.lineTo cur().e(1), cur().e(2)
	cur().draw(ctx)
ctx.stroke()

ctx.fillStyle = "red"
for p in highpoints
    p.draw(ctx)

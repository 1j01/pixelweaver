
# @author Isaiah Odhner

tri = (gl, base_x, base_y, base_z, base_width, altitude, angle)->
	# TODO: z_tilt_angle?
	point_x = base_x + Math.sin(angle) * altitude * Math.random()
	point_y = base_y + Math.cos(angle) * altitude * Math.random()
	a_x = base_x + Math.sin(angle - Math.PI / 2) * base_width * Math.random()
	a_y = base_y + Math.cos(angle - Math.PI / 2) * base_width * Math.random()
	b_x = base_x + Math.sin(angle + Math.PI / 2) * base_width * Math.random()
	b_y = base_y + Math.cos(angle + Math.PI / 2) * base_width * Math.random()
	gl.color(1, 1, 0); gl.vertex(a_x, a_y, base_z)
	gl.color(0, 1, 1); gl.vertex(b_x, b_y, base_z)
	gl.color(1, 0, 1 * Math.random()); gl.vertex(point_x, point_y, base_z + 0.5)

class Thing
	constructor: ->
		@x = 0
		@y = 0
		@z = 0
		@angle = 0
		@speed = 0.01
		@angular_speed = 0.004
		@x -= @speed / @angular_speed
	
	update: ->
		@angle += @angular_speed
		@x += Math.sin(@angle) * @speed
		@y += Math.cos(@angle) * @speed
	
	draw: (gl)->
		gl.begin(gl.TRIANGLES)
		tri(gl, @x, @y, @z, 1, 2, @angle)
		gl.end()

run
	init: ->
		@things = [new Thing]
	
	update: ->
		thing.update() for thing in @things
	
	draw: (gl)->
		# gl.begin(gl.TRIANGLES)
		# tri(gl, 0, 0, 0, 1, 2, 20)
		# gl.end()
		thing.draw(gl) for thing in @things

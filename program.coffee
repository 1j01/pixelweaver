
# @author Isaiah Odhner

tri = (gl, base_x, base_y, base_z, base_width, altitude, angle)->
	# TODO: z_tilt_angle?
	point_x = base_x + Math.sin(angle) * altitude
	point_y = base_y + Math.cos(angle) * altitude
	a_x = base_x + Math.sin(angle - Math.PI / 2) * base_width
	a_y = base_y + Math.cos(angle - Math.PI / 2) * base_width
	b_x = base_x + Math.sin(angle + Math.PI / 2) * base_width
	b_y = base_y + Math.cos(angle + Math.PI / 2) * base_width
	gl.color(1, 1, 0); gl.vertex(a_x, a_y, base_z)
	gl.color(0, 1, 1); gl.vertex(b_x, b_y, base_z)
	gl.color(1, 0, 1 * Math.random()); gl.vertex(point_x, point_y, base_z + 0.5)

segment = (gl, base_x, base_y, base_z, width, length, angle)->
	a_1_x = base_x + Math.sin(angle - Math.PI / 2) * width
	a_1_y = base_y + Math.cos(angle - Math.PI / 2) * width
	b_1_x = base_x + Math.sin(angle + Math.PI / 2) * width
	b_1_y = base_y + Math.cos(angle + Math.PI / 2) * width
	a_2_x = base_x + Math.sin(angle - Math.PI / 2) * width + Math.sin(angle) * length
	a_2_y = base_y + Math.cos(angle - Math.PI / 2) * width + Math.cos(angle) * length
	b_2_x = base_x + Math.sin(angle + Math.PI / 2) * width + Math.sin(angle) * length
	b_2_y = base_y + Math.cos(angle + Math.PI / 2) * width + Math.cos(angle) * length
	# gl.color(0.7, 0.3, 0)
	gl.vertex(a_1_x, a_1_y, base_z)
	gl.vertex(b_1_x, b_1_y, base_z)
	gl.vertex(a_2_x, a_2_y, base_z + 0.1)
	gl.vertex(a_2_x, a_2_y, base_z)
	gl.vertex(b_2_x, b_2_y, base_z)
	# gl.color(1, 0.5, 0.1)
	gl.vertex(b_1_x, b_1_y, base_z + 0.5)

class Thing
	constructor: (props={})->
		@x = 0
		@y = 0
		@z = 0
		@angle = 0
		@speed = 0.05
		@angular_speed = 0
		@z_speed = (Math.random() * 2 - 1) / 5
		@life = 5
		@[k] = v for k, v of props
		@t = 0
	
	update: ->
		return if @life < 0
		@life -= 0.04 * Math.random()
		@t += Math.random()
		@angular_speed += (Math.random() - 0.5) / 50
		@angular_speed *= 0.99
		@angle += @angular_speed
		prev_x = @x
		prev_y = @y
		@x += Math.sin(@angle) * @speed
		@y += Math.cos(@angle) * @speed
		@y += 0.001
		@z += @z_speed
		# @x += 0.01
		dx = @x - prev_x
		dy = @y - prev_y
		# @angle = -Math.atan2(-dy, -dx) - Math.PI / 2
		# dx = prev_x - @x
		# dy = prev_y - @y
		@angle = Math.PI / 2 - Math.atan2(dy, dx)
	
	draw: (gl)->
		gl.begin(gl.TRIANGLES)
		# tri(gl, @x, @y, @z, 0.1 * Math.random(), 0.1 + 0.1 * Math.random(), @angle)
		# tri(gl, @x, @y, @z, 0.1 * @life, 0.1, @angle)
		# tri(gl, @x, @y, @z, 0.1 * @life, 0.1, @angle + Math.PI)
		gl.color(0, 0, 0, 1)
		segment(gl, @x, @y, @z, 0.11 * @life, 0.1, @angle)
		gl.color(1, 1, 1, 1)
		segment(gl, @x, @y, @z, 0.1 * @life, 0.1, @angle)
		gl.end()


things = [new Thing(y: -4)]

@update = ->
	thing.update() for thing in things
	
	for thing in things
		# if Math.random() < 0.1 and thing.life > 0.2
		if thing.t * 10 > thing.life ** 4 and thing.life > 2
			thing.life /= 2
			thing_a = new Thing(thing)
			thing_b = new Thing(thing)
			thing_a.x += Math.sin(thing.angle - Math.PI / 2) * thing.life * 0.1
			thing_a.y += Math.cos(thing.angle - Math.PI / 2) * thing.life * 0.1
			thing_b.x += Math.sin(thing.angle + Math.PI / 2) * thing.life * 0.1
			thing_b.y += Math.cos(thing.angle + Math.PI / 2) * thing.life * 0.1
			thing_a.angular_speed -= (Math.random() - 0.2) / 15
			thing_b.angular_speed += (Math.random() - 0.2) / 15
			things.push(new Thing(thing_a))
			things.push(new Thing(thing_b))
			thing.life = 0
		if Math.random() < 0.1 and 3 > thing.life > 0.2
		# if ??? and 3 > thing.life > 0.2
			new_thing = new Thing(thing)
			# new_thing.life -= 1
			new_thing.life *= 0.8
			# new_thing.x += Math.sin(thing.angle - Math.PI / 2) * thing.life * 0.1
			# new_thing.y += Math.cos(thing.angle - Math.PI / 2) * thing.life * 0.1
			new_thing.angle = thing.angle + (Math.random() - 0.5)
			new_thing.angular_speed = (Math.random() - 0.5) / 15
			things.push(new Thing(new_thing))

t = 0
@draw = (gl)->
	if t++ is 0
		gl.clearColor(0.9, 0.9, 0.9, 1)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	
	# gl.rotate(-30, 1, 0, 0)
	# gl.begin(gl.TRIANGLES)
	# tri(gl, 0, 0, 0, 1, 2, 20)
	# gl.end()
	thing.draw(gl) for thing in things

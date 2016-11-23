
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

class Thing
	constructor: (props={})->
		@x = 0
		@y = 0
		@z = 0
		@angle = 0
		@speed = 0.05
		@angular_speed = 0
		@life = 5
		@[k] = v for k, v of props
	
	update: ->
		return if @life < 0
		@life -= 0.01 * Math.random()
		@angular_speed += (Math.random() - 0.5) / 100
		@angular_speed *= 0.999
		@angle += @angular_speed
		prev_x = @x
		prev_y = @y
		@x += Math.sin(@angle) * @speed
		@y += Math.cos(@angle) * @speed
		# @y += 0.0001
		dx = @x - prev_x
		dy = @y - prev_y
		# @angle = Math.atan2(dy, dx) - Math.PI / 2
	
	draw: (gl)->
		gl.begin(gl.TRIANGLES)
		# tri(gl, @x, @y, @z, 0.1 * Math.random(), 0.1 + 0.1 * Math.random(), @angle)
		tri(gl, @x, @y, @z, 0.1 * @life, 0.1, @angle)
		gl.end()

run
	init: ->
		@things = [new Thing(y: -4)]
	
	update: ->
		thing.update() for thing in @things
		
		for thing in @things
			if Math.random() < 0.1 and thing.life > 0.2
				thing.life /= 2
				# @things.push(new Thing(x: thing.x, y: thing.y, z: thing.z, life: thing.life))
				# @things.push(new Thing(thing))
				thing_a = new Thing(thing)
				thing_b = new Thing(thing)
				thing_a.x += Math.sin(thing.angle - Math.PI / 2) * thing.life * 0.1
				thing_a.y += Math.cos(thing.angle - Math.PI / 2) * thing.life * 0.1
				thing_b.x += Math.sin(thing.angle + Math.PI / 2) * thing.life * 0.1
				thing_b.y += Math.cos(thing.angle + Math.PI / 2) * thing.life * 0.1
				thing_a.angular_speed += (Math.random() - 0.5) / 10
				thing_b.angular_speed += (Math.random() - 0.5) / 10
				@things.push(new Thing(thing_a))
				@things.push(new Thing(thing_b))
				thing.life = 0.1
	
	draw: (gl)->
		# gl.rotate(-30, 1, 0, 0)
		# gl.begin(gl.TRIANGLES)
		# tri(gl, 0, 0, 0, 1, 2, 20)
		# gl.end()
		thing.draw(gl) for thing in @things

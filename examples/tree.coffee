
# @author Isaiah Odhner

lerp = (a, b, b_ness)->
	a + (b - a) * b_ness

rand = (a=1, b=0)->
	lerp(a, b, Math.random())

dist = (x1, y1, x2, y2)->
	Math.hypot(x2-x1, y2-y1)

reticle = (gl, x, y, z, r, tris=5, offset_angle=0)->
	points = tris * 3
	gl.begin(gl.TRIANGLES)
	for i in [0..points]
		angle = Math.PI * 2 * i / points + offset_angle
		gl.vertex(
			x + Math.sin(angle) * r,
			y + Math.cos(angle) * r,
			z
		)
	gl.end()

circle = (gl, x, y, z, r, points=3*5)->
	gl.begin(gl.TRIANGLE_FAN)
	for i in [0..points]
		angle = Math.PI * 2 * i / points
		gl.vertex(
			x + Math.sin(angle) * r,
			y + Math.cos(angle) * r,
			z
		)
	gl.end()

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


space_to_colonize =
	xr: 4
	yr: 2
	x: 0
	y: 2

attract_dist = 1

targets = []

for [0..100]
	x = rand(-1, 1)
	y = rand(-1, 1)
	if dist(x, y, 0, 0) < 1
		targets.push({
			x: space_to_colonize.x + x * space_to_colonize.xr
			y: space_to_colonize.y + y * space_to_colonize.yr
			z: 0
			reached: no
		})

nearest = (points, x, y)->
	closest_dist = Infinity
	closest_point = null
	for point in points
		point_dist = dist(point.x, point.y, x, y) 
		if point_dist < closest_dist
			closest_dist = point_dist
			closest_point = point
	closest_point

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
		@attractors = []
	
	update: ->
		return if @life < 0
		@life -= 0.03 * Math.random()
		@t += Math.random()
		
		# TODO: implement actual space colonization algorithm
		# specifically with control of branching
		
		for target in targets
			if dist(target.x, target.y, @x, @y) < 0.1
				target.reached = yes
		
		# @angular_speed += (Math.random() - 0.5) / 50
		# @angular_speed *= 0.99
		# @angle += @angular_speed
		prev_x = @x
		prev_y = @y
		@x += Math.sin(@angle) * @speed
		@y += Math.cos(@angle) * @speed
		@z += @z_speed
		
		attract_x_acc = 0
		attract_y_acc = 0
		
		for target in @attractors
			attract_x_acc += (target.x - @x)
			attract_y_acc += (target.y - @y)
			# another possibility:
			# dist_to_target = dist(target.x, target.y, @x, @y)
			# attract_x_acc += (target.x - @x) / dist_to_target
			# attract_y_acc += (target.y - @y) / dist_to_target
		
		if @attractors.length > 0
			@angle = Math.PI / 2 - Math.atan2(attract_y_acc, attract_x_acc)
	
	draw: (gl)->
		gl.begin(gl.TRIANGLES)
		# tri(gl, @x, @y, @z, 0.1 * Math.random(), 0.1 + 0.1 * Math.random(), @angle)
		# tri(gl, @x, @y, @z, 0.1 * @life, 0.1, @angle)
		# tri(gl, @x, @y, @z, 0.1 * @life, 0.1, @angle + Math.PI)
		gl.color(0, 0, 0, 1)
		# segment(gl, @x, @y, @z - 0.00009, 0.11 * @life, 0.1, @angle)
		segment(gl, @x, @y, @z - 0.00009, 0.11, 0.1, @angle)
		gl.color(1, 1, 1, 1)
		# segment(gl, @x, @y, @z, 0.1 * @life, 0.1, @angle)
		segment(gl, @x, @y, @z, 0.1, 0.1, @angle)
		gl.end()


things = [new Thing(y: -4)]

@update = ->
	thing.update() for thing in things
	
	for thing in things
		thing.attractors = []
	
	for target in targets when not target.reached
		nearest_thing = nearest(things, target.x, target.y)
		if nearest_thing?
			if dist(nearest_thing.x, nearest_thing.y, target.x, target.y) < attract_dist
				nearest_thing.attractors.push(target)
	
	for thing in things
		if thing.attractors.length >= 1
			if Math.random() < 0.1
				new_thing = new Thing(thing)
				new_thing.angle += rand(-1, 1) / 2
				new_thing.angular_speed += rand(-1, 1) / 2
				things.push(new Thing(new_thing))

t = 0
@draw = (gl)->
	if t++ is 0
		gl.clearColor(rand(0.6, 1), rand(0.6, 1), rand(0.8, 1), 1)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	
	for target in targets
		# gl.color(1, 1, 1, 1)
		# reticle(gl, target.x, target.y, 0, 0.1, 5, 0.4 + t/12.5*(not target.reached))
		if target.reached
			gl.color(0.1, 1, 0.2, 1)
		else
			gl.color(1, 0, 0, 1)
		# reticle(gl, target.x, target.y, target.reached, 0.2, 5)
		circle(gl, target.x, target.y, target.reached, 0.1)
		# reticle(gl, target.x, target.y, 0, 0.1, 5, t/15.2*(not target.reached))
		# reticle(gl, target.x, target.y, target.reached, rand(0, 0.5), 5)
		# if rand() < 0.1
		# 	reticle(gl, target.x, target.y, 0, rand(0, 0.5), 5, t/15.2*(not target.reached))
	
	thing.draw(gl) for thing in things

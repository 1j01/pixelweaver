
# @author Isaiah Odhner

lerp = (a, b, b_ness)->
	a + (b - a) * b_ness

rand = (a=1, b=0)->
	lerp(a, b, Math.random())

choose = (array)->
	array[~~(Math.random() * array.length)]

dist2d = (x1, y1, x2, y2)->
	Math.hypot(x2-x1, y2-y1)

dist3d = (x1, y1, z1, x2, y2, z2)->
	Math.hypot(x2-x1, y2-y1, z2-z1)

draw_circle = (gl, x, y, z, r, points=3*5)->
	gl.begin(gl.TRIANGLE_FAN)
	for i in [0..points]
		angle = Math.PI * 2 * i / points
		gl.vertex(
			x + Math.sin(angle) * r,
			y + Math.cos(angle) * r,
			z
		)
	gl.end()

draw_segment_tris = (gl, x1, y1, z1, x2, y2, z2, width, colorA, colorB)->
	dx = x2 - x1
	dy = y2 - y1
	angle = Math.PI / 2 - Math.atan2(dy, dx)
	a_1_x = x1 + Math.sin(angle - Math.PI / 2) * width
	a_1_y = y1 + Math.cos(angle - Math.PI / 2) * width
	b_1_x = x1 + Math.sin(angle + Math.PI / 2) * width
	b_1_y = y1 + Math.cos(angle + Math.PI / 2) * width
	a_2_x = x2 + Math.sin(angle - Math.PI / 2) * width
	a_2_y = y2 + Math.cos(angle - Math.PI / 2) * width
	b_2_x = x2 + Math.sin(angle + Math.PI / 2) * width
	b_2_y = y2 + Math.cos(angle + Math.PI / 2) * width
	gl.color(colorA...)
	gl.vertex(a_1_x, a_1_y, z1)
	gl.vertex(b_1_x, b_1_y, z1)
	gl.vertex(a_2_x, a_2_y, z2)
	gl.vertex(a_2_x, a_2_y, z2)
	gl.vertex(b_2_x, b_2_y, z2)
	gl.color(colorB...)
	gl.vertex(b_1_x, b_1_y, z1)


particles = []

add_ellipsoid_of_random_particles = (particles, ellipsoid, n)->
	for [0..n]
		x = rand(-1, 1)
		y = rand(-1, 1)
		z = rand(-1, 1)
		if dist3d(x, y, z, 0, 0, 0) < 1
			particles.push({
				x: ellipsoid.x + x * ellipsoid.xr
				y: ellipsoid.y + y * ellipsoid.yr
				z: ellipsoid.z + z * ellipsoid.zr
				vx: 0
				vy: 0
				vz: 0
				reached: no
			})

star_field_ellipsoid =
	xr: 4
	yr: 4
	zr: 4
	x: 0
	y: 0
	z: 0

add_ellipsoid_of_random_particles(particles, star_field_ellipsoid, 3000)


class DoodleAgent
	constructor: (props={})->
		@x = 0
		@y = 0
		@z = 0
		@prev_x = @x
		@prev_y = @y
		@prev_z = @z
		@width = rand(0.1)
		@border_width = rand(0.1)
		# @color = [1, 1, 1, 1]
		# @color = [Math.random(), Math.random(), Math.random(), 1]
		# @border_color = [Math.random(), Math.random(), Math.random(), 1]
		@color_a = [Math.random(), Math.random(), Math.random(), 1]
		@color_b = [Math.random(), Math.random(), Math.random(), 1]
		@[k] = v for k, v of props

	doodle: (gl, t)->

		attraction_of_points = 0.05 # velocity scalar
		turn_when_hitting_points = 500 # scalar affects rotation towards points
		turn_when_near_point = 0.005 # scalar affects rotation towards points

		point_friction = 0.01

		wandering_randomness = 0.0005
		wandering_speed = 0.1

		move_x = @x - @prev_x
		move_y = @y - @prev_y
		move_z = @z - @prev_z

		@prev_x = @x
		@prev_y = @y
		@prev_z = @z
		
		move_x += rand(-1, 1) * wandering_randomness
		move_y += rand(-1, 1) * wandering_randomness
		move_z += rand(-1, 1) * wandering_randomness
		

		for point in particles
			delta_x = point.x - @x
			delta_y = point.y - @y
			delta_z = point.z - @z
			dist = Math.hypot(delta_x, delta_y, delta_z)
			
			if dist < 0.2
				point.reached = true

				point.vx -= delta_x / dist * attraction_of_points
				point.vy -= delta_y / dist * attraction_of_points
				point.vz -= delta_z / dist * attraction_of_points
			
			turn_amount = (if point.reached then turn_when_hitting_points else turn_when_near_point * dist)
			move_x += delta_x / dist * turn_amount
			move_y += delta_y / dist * turn_amount
			move_z += delta_z / dist * turn_amount
				
			point.x += point.vx
			point.y += point.vy
			point.z += point.vz
			point.vx /= 1 + point_friction
			point.vy /= 1 + point_friction
			point.vz /= 1 + point_friction


		dist = Math.hypot(move_x, move_y, move_z)
		
		normalized_move_x = move_x / dist
		normalized_move_y = move_y / dist
		normalized_move_z = move_z / dist

		@x += normalized_move_x * wandering_speed
		@y += normalized_move_y * wandering_speed
		@z += normalized_move_z * wandering_speed

		gl.begin(gl.TRIANGLES)
		# gl.color(@border_color...)
		# gl.color(bg_color...)
		# draw_segment_tris(gl, @prev_x, @prev_y, @prev_z - 0.01, @x, @y, @z - 0.01, @width + @border_width)
		# draw_segment_tris(gl, @prev_x, @prev_y, @prev_z - 0.01, @x, @y, @z + 0.01, @width + @border_width)
		draw_segment_tris(gl, @prev_x, @prev_y, @prev_z - 0.03, @x, @y, @z + 0.03, @width + @border_width, @color_a, @color_b)
		# gl.color(@color...)
		# draw_segment_tris(gl, @prev_x, @prev_y, @prev_z, @x, @y, @z, @width)
		draw_segment_tris(gl, @prev_x, @prev_y, @prev_z, @x, @y, @z - 0.05, @width, @color_a, @color_b)
		gl.end()

		gl.color(@color_a...)
		draw_circle(gl, @x, @y, @z, @width + @border_width, 3*6)

		



agents =
	for [1..rand(100)]
		angle = rand(Math.PI * 2)
		new DoodleAgent(
			x: Math.sin(angle) * star_field_ellipsoid.xr
			y: Math.cos(angle) * star_field_ellipsoid.yr
			z: rand(0.1)
		)

# bg_color = [rand(0.6, 1), rand(0.6, 1), rand(0.8, 1), 1]
bg_color = [0, 0, 0, 1]
t = 0
@draw = (gl)->
	if t is 0
		gl.clearColor(bg_color...)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	t += 1

	gl.rotate(35.264, 1, 0, 0)

	agent.doodle(gl, t) for agent in agents

	
	gl.color(0, 1, 1, 1)
	for point in particles
		# if not isFinite(point.x)
		# 	console.log "point.x is " + point.x
		draw_circle(gl, point.x, point.y, point.z, 0.03, 3)

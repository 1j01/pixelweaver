
# @author Isaiah Odhner

lerp = (a, b, b_ness)->
	a + (b - a) * b_ness

rand = (a=1, b=0)->
	lerp(a, b, Math.random())

dist = (x1, y1, x2, y2)->
	Math.hypot(x2-x1, y2-y1)

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
	# gl.vertex(a_2_x, a_2_y, base_z + 0.1)
	gl.vertex(a_2_x, a_2_y, base_z)
	gl.vertex(a_2_x, a_2_y, base_z)
	gl.vertex(b_2_x, b_2_y, base_z)
	# gl.color(1, 0.5, 0.1)
	# gl.vertex(b_1_x, b_1_y, base_z + 0.5)
	gl.vertex(b_1_x, b_1_y, base_z)


class Thing
	constructor: (props={})->
		@x = 0
		@y = 0
		@z = 0
		@angle = 0
		@speed = 0.05
		@vx = 0.01
		@vy = 0.01
		# @angular_speed = 0
		# @z_speed = (Math.random() * 2 - 1) / 5
		@width = 0.5
		@[k] = v for k, v of props
	
	findTarget: ->
		a = 3
		nearestTargetTo(@x + rand(-a, a), @y + rand(-a, a))
	
	update: (t)->
		# @vx += Math.sin(t/50) / 5000
		# @vy += Math.cos(t/50) / 5000
		@x += @vx
		@y += @vy
		# if @vx > 0
		# 	# @z = Math.sin((@x + @y + 0.5) * Math.PI) 
		# 	@z = Math.sin((@x + 0.5) * Math.PI) 
		@z = Math.sin((@x + 0.5) * Math.PI) * Math.sign(@vx)
		@angle = Math.PI / 2 - Math.atan2(@vy, @vx)
	
	draw: (gl)->
		gl.begin(gl.TRIANGLES)
		# tri(gl, @x, @y, @z, 0.1 * Math.random(), 0.1 + 0.1 * Math.random(), @angle)
		# tri(gl, @x, @y, @z, 0.1 * @width, 0.1, @angle)
		# tri(gl, @x, @y, @z, 0.1 * @width, 0.1, @angle + Math.PI)
		gl.color(0, 0, 0, 1)
		# segment(gl, @x, @y, @z - 0.00009, 0.11 * @width, 0.1, @angle)
		segment(gl, @x, @y, @z - 0.01, 1.1 * @width, 0.1, @angle)
		gl.color((@y + @z) / 5 + @x / 10, (@x + @y / 2 + @z) / 5, @z + @x / 3, 1)
		segment(gl, @x, @y, @z, @width, 0.1, @angle)
		gl.end()


# things = [new Thing(y: -4)]

things = []
width = rand(0.01, 1.5)

for i in [0..5]
	things.push new Thing({x: -i, y: i, vy: 0.01, vx: 0.01, width})
	things.push new Thing({x: i, y: i, vy: 0.01, vx: -0.01, width})

t = 0
do @update = ->
	thing.update(t) for thing in things

# rotate_args = [rand(100)].concat(rand() for [0..3])
# rotate_arg_bases = [rand(100)].concat(rand() for [0..3])
# rotate_arg_sin_amplitudes = [rand(50)].concat(rand() for [0..3])
# rotate_arg_sin_periods = (rand(50, 500) for [0..4])

rotate_arg_fns =
	for i in [0..4]
		do (i)->
			base_value = if i is 0 then rand(-50, 50) else rand()
			sine_amplitude =
				if rand() < 0.8 then 0 else
					if i is 0 then rand(50) else rand()
			sine_period = rand(50, 600)
			->
				base_value + Math.sin(t / sine_period) * sine_amplitude

@draw = (gl)->
	if t++ is 0
		gl.clearColor(rand(0.6, 1), rand(0.6, 1), rand(0.8, 1), 1)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	
	gl.translate(0, -5, 0)
	# gl.rotate(30, 1, 0, 0)
	# gl.rotate(30, 1, 0.5, 0.2)
	
	rotate_args = (fn() for fn in rotate_arg_fns)
	
	gl.rotate.apply(gl, rotate_args)
	
	thing.draw(gl) for thing in things

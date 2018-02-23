
# @author Isaiah Odhner

lerp = (a, b, b_ness)->
	a + (b - a) * b_ness

rand = (a=1, b=0)->
	lerp(a, b, Math.random())

choose = (array)->
	array[~~(Math.random() * array.length)]

dist = (x1, y1, x2, y2)->
	Math.hypot(x2-x1, y2-y1)

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


structure = {
	points: []
	circles: []
}

make_circular_structure = ({x, y, z, radius, num_radial_points=32, label=""})->
	circle = {x, y, z, radius, num_radial_points, label}
	circle.radialPoints = []
	for angle in [0..Math.PI * 2] by Math.PI * 2 / num_radial_points
		circle.radialPoints.push {
			x: x + Math.sin(angle) * radius
			y: y + Math.cos(angle) * radius
			z: z
			parent: circle
		}
	structure.circles.push(circle)
	circle

make_number_randomly_from_factors = (factors, numFactors)->
	num = 1
	for [0..numFactors]
		factor = choose(factors)
		num *= factor
	num

# the idea here is to sometimes get more hexagonal structures or more octagonal ones etc.
num_radial_points_options = (make_number_randomly_from_factors([2, 3], rand(1, 3)) for [0..rand(1, 3)])
# console.log num_radial_points_options

# make_circular_structure x: 0, y: 0, z: 0, radius: 4, label: "root"
for [0..rand(1, 4)]
	make_circular_structure x: rand(-5, 5), y: rand(-5, 5), z: rand(-5, 5), radius: rand(1, 4), label: "root"

class DoodleAgent
	constructor: (props={})->
		@rules = {}
		@x = 0
		@y = 0
		@z = 0
		@width = rand(0.1)
		@border_width = rand(0.7)
		# @color = [1, 1, 1, 1]
		# @color = [Math.random(), Math.random(), Math.random(), 1]
		# @border_color = [Math.random(), Math.random(), Math.random(), 1]
		@color_a = [Math.random(), Math.random(), Math.random(), 1]
		@color_b = [Math.random(), Math.random(), Math.random(), 1]
		@target_point = null
		@orbiting_circle = null
		@orbit_interval = ~~rand(1, 40) # integer number of points to jump around the circle in one step
		@[k] = v for k, v of props

	findTarget: ->
		if @orbiting_circle and Math.random() < 0.99
			circle = @orbiting_circle
			index = circle.radialPoints.indexOf(@target_point)
			circle.radialPoints[(index + @orbit_interval) %% circle.radialPoints.length]
		else if structure.circles.length > 0 # and Math.random() < 0.5
			# circle = if @orbiting_circle and Math.random() < 0.9 then @orbiting_circle else choose(structure.circles)
			circle = choose(structure.circles)
			@orbiting_circle = circle
			choose(circle.radialPoints)
		else if structure.points.length > 0
			choose(structure.points)
		else
			{x: 0, y: 0, z: 0}

	doodle: (gl, t)->
		prev_x = @x
		prev_y = @y
		prev_z = @z
		prev_orbiting_circle = @orbiting_circle

		@target_point = @findTarget() # Note: not a pure function; could be
		# {@x, @y, @z} = @target_point
		{@x, @y} = @target_point

		# dx = @x - prev_x
		# dy = @y - prev_y
		# dz = @z - prev_z
		# dist = Math.hypot(dx, dy, dz)
		# @angle = Math.PI / 2 - Math.atan2(dy, dx)

		if Math.random() < 0.01 and not @target_point.shape?
			@target_point.shape = make_circular_structure({
				@x, @y, @z
				radius: rand(0.1, 5)
				num_radial_points: choose(num_radial_points_options)
			})

		# if Math.random() < 0.5 and @target_point.color?
		# 	@color = @target_point.color
		
		# if Math.random() < 0.5 and not @target_point.color?
		# 	@target_point.color = @color

		if prev_orbiting_circle isnt @orbiting_circle
			return

		gl.begin(gl.TRIANGLES)
		# gl.color(@border_color...)
		# gl.color(bg_color...)
		# draw_segment_tris(gl, prev_x, prev_y, prev_z - 0.01, @x, @y, @z - 0.01, @width + @border_width)
		# draw_segment_tris(gl, prev_x, prev_y, prev_z - 0.01, @x, @y, @z + 0.01, @width + @border_width)
		draw_segment_tris(gl, prev_x, prev_y, prev_z - 0.03, @x, @y, @z + 0.03, @width + @border_width, @color_a, @color_b)
		# gl.color(@color...)
		# draw_segment_tris(gl, prev_x, prev_y, prev_z, @x, @y, @z, @width)
		draw_segment_tris(gl, prev_x, prev_y, prev_z, @x, @y, @z - 0.5, @width, @color_a, @color_b)
		gl.end()

		gl.color(@color_a...)
		draw_circle(gl, @x, @y, @z, @width + @border_width, 3*6)



agents = (new DoodleAgent(z: rand(0.1)) for [0..rand(4)])

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

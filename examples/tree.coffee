
# @author Isaiah Odhner

lerp = (a, b, b_ness)->
	a + (b - a) * b_ness

rand = (a=1, b=0)->
	lerp(a, b, Math.random())

dist3d = (x1, y1, z1, x2, y2, z2)->
	Math.hypot(x2-x1, y2-y1, z2-z1)

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


targets = []

add_colonization_ellipsoid = (space_to_colonize, n)->
	for [0..n]
		x = rand(-1, 1)
		y = rand(-1, 1)
		z = rand(-1, 1)
		if dist3d(x, y, z, 0, 0, 0) < 1
			targets.push({
				x: space_to_colonize.x + x * space_to_colonize.xr
				y: space_to_colonize.y + y * space_to_colonize.yr
				z: space_to_colonize.z + z * space_to_colonize.zr
				reached: no
			})

add_colonization_ellipsoid
	xr: 4
	yr: 2
	zr: 4
	x: 0
	y: 2
	z: 0
	300

add_colonization_ellipsoid
	x: 0
	y: -1
	z: 0
	xr: 0.1
	yr: 3
	zr: 0.1
	60

add_colonization_ellipsoid
	xr: 2
	yr: 1
	zr: 2
	x: 0
	y: -4
	z: 0
	200

# attract_dist = 1

nearest = (points, x, y, z)->
	closest_dist = Infinity
	closest_point = null
	for point in points
		point_dist = ((point.x - x) ** 2) + ((point.y - y) ** 2) + ((point.z - z) ** 2) #dist3d(point.x, point.y, point.z, x, y, z)
		if point_dist < closest_dist
			closest_dist = point_dist
			closest_point = point
	closest_point

class Branch
	constructor: (props={})->
		@x = 0
		@y = 0
		@z = 0
		@angle = 0
		@[k] = v for k, v of props
		@attractors = []
		@children = []
	
	update: ->
		for target in targets
			if ((target.x - @x) ** 2) + ((target.y - @y) ** 2) + ((target.z - @z) ** 2) < 0.1 ** 2
			# if dist3d(target.x, target.y, target.z, @x, @y, @z) < 0.1
				target.reached = yes
		
		
		# attract_x_acc = 0
		# attract_y_acc = 0
		# attract_z_acc = 0
		normalized_attract_x_acc = 0
		normalized_attract_y_acc = 0
		normalized_attract_z_acc = 0
		attract_dist_acc = 0
		calc_attraction = (attractors)=>
			for target in attractors
				dist_to_target = dist3d(target.x, target.y, target.z, @x, @y, @z)
				normalized_attract_x_acc += (target.x - @x) / dist_to_target
				normalized_attract_y_acc += (target.y - @y) / dist_to_target
				normalized_attract_z_acc += (target.z - @z) / dist_to_target
				# attract_x_acc += (target.x - @x) / dist_to_target
				# attract_y_acc += (target.y - @y) / dist_to_target
				# attract_z_acc += (target.z - @z) / dist_to_target
				attract_dist_acc += dist_to_target
			
			# @attract_dist_acc = attract_dist_acc
			
			if attractors.length > 0
				if attract_dist_acc < 1 and attractors.length > 1
					return calc_attraction([attractors[0]])
				else
					return {
						attract_x: normalized_attract_x_acc / attractors.length
						attract_y: normalized_attract_y_acc / attractors.length
						attract_z: normalized_attract_z_acc / attractors.length
					}
		
		attraction = calc_attraction(@attractors)
		if attraction?
			{attract_x, attract_y, attract_z} = attraction
			# TODO: get rid of @angle and draw shapes that work in 3D
			angle = -(Math.PI / 2 + Math.atan2(attract_y, attract_x))
			branch_length = 0.1
			x = @x + attract_x * branch_length
			y = @y + attract_y * branch_length
			z = @z + attract_z * branch_length
			new_branch = new Branch({x, y, z, angle, length: branch_length, parent: @})
			branches.push(new_branch)
			@children.push(new_branch)
	
	draw: (gl)->
		# @width = @calc_width()
		# @width = Math.sqrt(@calc_area())
		
		gl.begin(gl.TRIANGLES)
		# tri(gl, @x, @y, @z, 0.1 * Math.random(), 0.1 + 0.1 * Math.random(), @angle)
		# tri(gl, @x, @y, @z, 0.1 * @life, 0.1, @angle)
		# tri(gl, @x, @y, @z, 0.1 * @life, 0.1, @angle + Math.PI)
		gl.color(0, 0, 0, 1)
		# segment(gl, @x, @y, @z - 0.00009, 0.11 * @life, 0.1, @angle)
		# segment(gl, @x, @y, @z - 0.00005, @width + 0.01, 0.1, @angle)
		segment(gl, @x, @y, @z - 0.01, @width + 0.01, 0.1, @angle)
		gl.color(1 - @attract_dist_acc, 1 - @attract_dist_acc / 5,  1 - @attract_dist_acc / 5, 1)
		# segment(gl, @x, @y, @z, 0.1 * @life, 0.1, @angle)
		segment(gl, @x, @y, @z, @width, 0.1, @angle)
		gl.end()


root_branch = new Branch(y: -4)
branches = [root_branch]

@update = ->
	for branch in branches
		branch.attractors = []
		# branch.width = 0.01
		# branch.width = 0
		# branch.area = 0
	
	# for branch in branches by -1 # relying on order of creation = order in array
	# 	{parent} = branch
	# 	parent?.width += branch.width
	# for branch in branches
	# 	{parent} = branch
	# 	loop
	# 		break unless parent
	# 		parent.width += branch.width
	# 		parent = {parent}

	calc_area = (branch)->
		branch.area = 0
		for child in branch.children
			# branch.area += 2 ** (child.width / 2) # child.area # calc_area(child)
			branch.area += child.area # calc_area(child)
		branch.area = Math.max(branch.area, 0.0001)
		branch.width = Math.sqrt(branch.area / Math.PI) * 2
		# branch.width = Math.sqrt(branch.area) * 2
		branch.area
		# if branch.area is 0
		# 	
	
	# NOTE: relying on the order of the array being the order branches were created
	for branch in branches by -1
		calc_area(branch)
	
	for target in targets when not target.reached
		nearest_branch = nearest(branches, target.x, target.y, target.z)
		if nearest_branch?
			# attract_dist = nearest_branch.width + 0.5
			attract_dist = 1
			if dist3d(nearest_branch.x, nearest_branch.y, nearest_branch.z, target.x, target.y, target.z) < attract_dist
				nearest_branch.attractors.push(target)
	
	branch.update() for branch in branches

bg_color = [rand(0.6, 1), rand(0.6, 1), rand(0.8, 1), 1]
t = 0
@draw = (gl)->
	gl.clearColor(bg_color...)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	
	t += 1
	# gl.rotate(20, 0, 0, 1)
	# gl.rotate(t, 0, 1, 0)
	# gl.rotate(20, 0, 0, 1)
	
	for target in targets
		# gl.color(1, 1, 1, 1)
		# reticle(gl, target.x, target.y, 0, 0.1, 5, 0.4 + t/12.5*(not target.reached))
		if target.reached
			gl.color(0.1, 1, 0.2, 1)
		else
			gl.color(1, 0, 0, 1)
		# reticle(gl, target.x, target.y, target.reached, 0.2, 5)
		circle(gl, target.x, target.y, target.z, 0.1)
		# reticle(gl, target.x, target.y, 0, 0.1, 5, t/15.2*(not target.reached))
		# reticle(gl, target.x, target.y, target.reached, rand(0, 0.5), 5)
		# if rand() < 0.1
		# 	reticle(gl, target.x, target.y, 0, rand(0, 0.5), 5, t/15.2*(not target.reached))
	
	branch.draw(gl) for branch in branches

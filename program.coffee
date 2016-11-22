
run
	# STATE
	
	init: ->
		@x = 0
		@y = 0
		@z = 0
		@angle = 0
		@speed = 0
	
	update: (delta)->
		@angle += 45 * delta
		@x += Math.sin(@angle) * @speed
		@y += Math.cos(@angle) * @speed

	# RENDERING
	
	tri: (gl, base_x, base_y, base_z, base_width, altitude, angle)->
		# TODO: z_tilt_angle
		point_x = base_x + Math.sin(angle) * altitude
		point_y = base_y + Math.cos(angle) * altitude
		a_x = base_x + Math.sin(angle - Math.PI / 2) * base_width
		a_y = base_y + Math.cos(angle - Math.PI / 2) * base_width
		b_x = base_x + Math.sin(angle + Math.PI / 2) * base_width
		b_y = base_y + Math.cos(angle + Math.PI / 2) * base_width
		gl.color(1, 1, 0); gl.vertex(a_x, a_y, 0)
		gl.color(0, 1, 1); gl.vertex(b_x, b_y, 0)
		gl.color(1, 0, 1); gl.vertex(point_x, point_y, 0.5)
	
	draw: (gl)->
		# gl.rotate(-20, 1, 0, 0)
		#gl.rotate(@angle, 0, 1, 0)
		
		gl.color(0.5, 0.5, 0.5)
		gl.lineWidth(1)
		gl.begin(gl.LINES)
		for i in [-10..10]
			gl.vertex(i, 0, -10)
			gl.vertex(i, 0, +10)
			gl.vertex(-10, 0, i)
			gl.vertex(+10, 0, i)
		gl.end()
		
		gl.rotate(@angle, 0, 1, 0)
		
		gl.pointSize(10)
		gl.begin(gl.POINTS)
		gl.color(1, 0, 0); gl.vertex(1, 0, 0)
		gl.color(0, 1, 0); gl.vertex(0, 1, 0)
		gl.color(0, 0, 1); gl.vertex(0, 0, 1)
		gl.end()
		
		gl.lineWidth(2)
		gl.begin(gl.LINE_LOOP)
		gl.color(1, 0, 0); gl.vertex(1, 0, 0)
		gl.color(0, 1, 0); gl.vertex(0, 1, 0)
		gl.color(0, 0, 1); gl.vertex(0, 0, 1)
		gl.end()
		
		gl.begin(gl.TRIANGLES)
		gl.color(1, 1, 0); gl.vertex(0.5, 0.5, 0)
		gl.color(0, 1, 1); gl.vertex(0, 0.5, 0.5)
		gl.color(1, 0, 1); gl.vertex(0.5, 0, 0.5)
		gl.end()
		
		gl.begin(gl.TRIANGLES)
		@tri(gl, @x, @y, @z, 2, 1, @angle)
		gl.end()


// @author Isaiah Odhner

const lerp = (a, b, b_ness)=> a + ((b - a) * b_ness);

const rand = (a=1, b=0)=> lerp(a, b, Math.random());

const dist = (x1, y1, x2, y2)=> Math.hypot(x2-x1, y2-y1);

const circle = function(gl, x, y, z, r, points=3*5){
	let asc, i;
	let end;
	gl.begin(gl.TRIANGLE_FAN);
	for (i = 0, end = points, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
		const angle = (Math.PI * 2 * i) / points;
		gl.vertex(
			x + (Math.sin(angle) * r),
			y + (Math.cos(angle) * r),
			z
		);
	}
	return gl.end();
};

const tri = function(gl, base_x, base_y, base_z, base_width, altitude, angle){
	// TODO: z_tilt_angle?
	const point_x = base_x + (Math.sin(angle) * altitude);
	const point_y = base_y + (Math.cos(angle) * altitude);
	const a_x = base_x + (Math.sin(angle - (Math.PI / 2)) * base_width);
	const a_y = base_y + (Math.cos(angle - (Math.PI / 2)) * base_width);
	const b_x = base_x + (Math.sin(angle + (Math.PI / 2)) * base_width);
	const b_y = base_y + (Math.cos(angle + (Math.PI / 2)) * base_width);
	gl.color(1, 1, 0); gl.vertex(a_x, a_y, base_z);
	gl.color(0, 1, 1); gl.vertex(b_x, b_y, base_z);
	gl.color(1, 0, 1 * Math.random()); return gl.vertex(point_x, point_y, base_z + 0.5);
};

const segment = function(gl, base_x, base_y, base_z, width, length, angle){
	const a_1_x = base_x + (Math.sin(angle - (Math.PI / 2)) * width);
	const a_1_y = base_y + (Math.cos(angle - (Math.PI / 2)) * width);
	const b_1_x = base_x + (Math.sin(angle + (Math.PI / 2)) * width);
	const b_1_y = base_y + (Math.cos(angle + (Math.PI / 2)) * width);
	const a_2_x = base_x + (Math.sin(angle - (Math.PI / 2)) * width) + (Math.sin(angle) * length);
	const a_2_y = base_y + (Math.cos(angle - (Math.PI / 2)) * width) + (Math.cos(angle) * length);
	const b_2_x = base_x + (Math.sin(angle + (Math.PI / 2)) * width) + (Math.sin(angle) * length);
	const b_2_y = base_y + (Math.cos(angle + (Math.PI / 2)) * width) + (Math.cos(angle) * length);
	// gl.color(0.7, 0.3, 0)
	gl.vertex(a_1_x, a_1_y, base_z);
	gl.vertex(b_1_x, b_1_y, base_z);
	gl.vertex(a_2_x, a_2_y, base_z + 0.1);
	gl.vertex(a_2_x, a_2_y, base_z);
	gl.vertex(b_2_x, b_2_y, base_z);
	// gl.color(1, 0.5, 0.1)
	return gl.vertex(b_1_x, b_1_y, base_z + 0.5);
};


class Thing {
	constructor(props={}){
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.angle = 0;
		this.speed = 0.05;
		// @angular_speed = 0
		// @z_speed = (Math.random() * 2 - 1) / 5
		this.width = 5;
		for (let k in props) {
			const v = props[k];
			this[k] = v;
		}
	}
	
	update(t){
		// @angular_speed += (Math.random() - 0.5) / 50
		// @angular_speed *= 0.99
		// @angle += @angular_speed
		const prev_x = this.x;
		const prev_y = this.y;
		// @x += Math.sin(@angle) * @speed
		// @y += Math.cos(@angle) * @speed
		// @z += @z_speed
		
		this.x = Math.sin(Math.sin(t/50));
		// @y = Math.cos(Math.cos(t/50))
		this.y = Math.cos(t/50/5) * 4;
		
		const dx = this.x - prev_x;
		const dy = this.y - prev_y;
		
		this.angle = (Math.PI / 2) - Math.atan2(dy, dx);
	}
	
	draw(gl){
		gl.begin(gl.TRIANGLES);
		// tri(gl, @x, @y, @z, 0.1 * Math.random(), 0.1 + 0.1 * Math.random(), @angle)
		// tri(gl, @x, @y, @z, 0.1 * @width, 0.1, @angle)
		// tri(gl, @x, @y, @z, 0.1 * @width, 0.1, @angle + Math.PI)
		gl.color(0, 0, 0, 1);
		// segment(gl, @x, @y, @z - 0.00009, 0.11 * @width, 0.1, @angle)
		segment(gl, this.x, this.y, this.z - 0.1, 0.11 * this.width, 0.1, this.angle);
		gl.color(1, 1, 1, 1);
		segment(gl, this.x, this.y, this.z, 0.1 * this.width, 0.1, this.angle);
		gl.end();
	}
}


const things = [new Thing({y: -4})];

let t = 0;
(self.update = () => things.map((thing) => thing.update(t)))();

self.draw = function(gl){
	if (t === 0) {
		gl.clearColor(rand(0.6, 1), rand(0.6, 1), rand(0.8, 1), 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	t += 1;

	// gl.rotate(30, 1, 0, 0)
	
	things.map((thing) => thing.draw(gl));
};


// FIXME: first frame is shown as blank
// FIXME: canvas is cleared when window is blurred (sometimes?)
// FIXME: animation can continue with cleared canvas (i.e. from resize); should probably have a fixed canvas size

run = function(program){
	var slider = document.getElementById("animation-position")
	componentHandler.upgradeElement(slider)

	var canvas = document.createElement("canvas")
	var ctx = canvas.getContext("2d")
	canvas.style.position = "absolute"
	canvas.style.left = "0"
	canvas.style.top = "0" //"38px"
	canvas.style.zIndex = "1"
	canvas.style.background = "#f0f"
	
	var gl = GL.create({preserveDrawingBuffer: true})
	document.body.appendChild(canvas)
	// gl.fullscreen({camera: true, paddingTop: 38})
	gl.fullscreen()
	gl.canvas.style.background = "red"
	
	gl.ortho(-50, 50, -50, 50, 0.1, 100)
	
	gl.enable(gl.DEPTH_TEST)
	// gl.enable(gl.RASTERIZER_DISCARD)
	
	var t = 0
	var INTERVAL = 0.01;
	var CHECKPOINT_INTERVAL = 0.1;
	gl.onupdate = function(delta){
		program.update(delta)
	}
	gl.ondraw = function(){
		program.draw(gl)
	}
	
	var checkpoints = []
	var get_nearest_prior_checkpoint = function(prior_to_t){
		var nearest_checkpoint;
		var nearest_t = -1;
		// for(var i = checkpoints.length - 1; i >= 0; i--){
		for(var i = 0; i < checkpoints.length; i++){
			var checkpoint = checkpoints[i];
			if(checkpoint.t <= prior_to_t && checkpoint.t >= nearest_t){
				nearest_checkpoint = checkpoint;
				nearest_t = checkpoint.t;
			}
		}
		return nearest_checkpoint;
	}
	
	var maybe_make_checkpoint = function(){
		if(t > parseFloat(slider.max)){
			return;
		}
		var checkpoint = get_nearest_prior_checkpoint(t)
		// console.log("maybe_make_checkpoint near", t, checkpoint)
		if(checkpoint){
			if(t > checkpoint.t + CHECKPOINT_INTERVAL){
			// if(Math.abs(t - checkpoint.t) > CHECKPOINT_INTERVAL){
				// console.log("this checkpoint's no good:", checkpoint, Math.abs(t - checkpoint.t))
				checkpoint = null;
			}
		}
		if(!checkpoint){
			// console.log("making checkpoint at", t)
			var checkpoint_canvas = document.createElement("canvas")
			var checkpoint_ctx = checkpoint_canvas.getContext("2d")
			checkpoint_canvas.width = gl.canvas.width;
			checkpoint_canvas.height = gl.canvas.height;
			checkpoint_ctx.drawImage(gl.canvas, 0, 0)
			var checkpoint = {t: t, canvas: checkpoint_canvas}
			checkpoints.push(checkpoint)
		}
	}
	
	var simulate_to = function(new_t){
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		program.init()
		for (t=0; t<new_t; t+=INTERVAL){
			gl.onupdate(INTERVAL)
			gl.ondraw()
			maybe_make_checkpoint()
		}
	}
	
	var playing = true
	var show_checkpoint = false
	var animate = function() {
		var post =
			window.requestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			function(callback) { setTimeout(callback, 1000 / 60) }
		
		// var time = new Date().getTime()
		function update() {
			// var now = new Date().getTime()
			if(playing){
				// var delta = (now - time) / 1000
				var delta = INTERVAL
				t += delta
				slider.MaterialSlider.change(t)
				
				gl.onupdate(delta)
				gl.ondraw()
				
				maybe_make_checkpoint()
			}
			var show_image
			if(show_checkpoint){
				// TODO: maybe show an interpolation between checkpoints
				var new_t = parseFloat(slider.value)
				t = new_t
				var checkpoint = get_nearest_prior_checkpoint(t)
				// console.log("show checkpoint near", t, checkpoint)
				if(checkpoint){
					if(t > checkpoint.t + CHECKPOINT_INTERVAL){
						simulate_to(t)
						show_image = gl.canvas
					}else{
						show_image = checkpoint.canvas // image_bitmap
					}
				}
			}else{
				show_image = gl.canvas
			}
			// ctx.fillStyle = "#222"
			// ctx.fillRect(0, 0, canvas.width, canvas.height)
			if(show_image){
				// TODO: handle checkpoints with outdated size
				canvas.width = show_image.width
				canvas.height = show_image.height
				ctx.drawImage(show_image, 0, 0)
			}
			post(update)
			// time = now
		}
		update()
	}
	
	program.init()
	
	animate()
	
	slider.onmousedown = function(){
		playing = false
		show_checkpoint = true
		addEventListener("mouseup", function mouseup(){
			removeEventListener("mouseup", mouseup)
			
			// TODO: should we just generate a checkpoint here instead?
			// might make it weirdly uneven
			show_checkpoint = false
			var new_t = parseFloat(slider.value)
			simulate_to(new_t)
		})
	}
	
	addEventListener("keydown", function(e){
		if (e.keyCode == 32) {
			playing = !playing
		}
	})
}


// FIXME: canvas is cleared when window is blurred (sometimes?)

const png_chunks_extract = require("png-chunks-extract")
const png_chunks_encode = require("png-chunks-encode")
const png_chunk_text = require("png-chunk-text")

run = function(program) {
	var slider = document.getElementById("animation-position")
	var container = document.getElementById("animation-container")
	var export_button = document.querySelector("#export")
	var play_pause_button = document.querySelector("#play-pause")
	var play_pause_icon = document.querySelector("#play-pause .material-icons")
	
	componentHandler.upgradeElement(slider)
	
	var canvas = document.createElement("canvas")
	var ctx = canvas.getContext("2d")
	canvas.style.background = "#f0f"
	
	var gl = GL.create({preserveDrawingBuffer: true})
	container.appendChild(canvas)
	
	gl.canvas.width = 1024
	gl.canvas.height = 1024
	
	gl.enable(gl.DEPTH_TEST)
	
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
	gl.matrixMode(gl.PROJECTION)
	gl.loadIdentity()
	view_size = 5
	gl.ortho(-view_size, view_size, -view_size, view_size, 0.1, 1000)
	gl.matrixMode(gl.MODELVIEW)
	
	var t = 0
	var INTERVAL = 0.01
	var CHECKPOINT_INTERVAL = 0.1
	gl.onupdate = function(delta) {
		program.update(delta)
	}
	gl.ondraw = function() {
		gl.loadIdentity()
		gl.translate(0, 0, -5)
		gl.rotate(90, 1, 0, 0)
		program.draw(gl)
	}
	
	var checkpoints = []
	var get_nearest_prior_checkpoint = function(prior_to_t) {
		var nearest_checkpoint
		var nearest_t = -1
		for (var i = 0; i < checkpoints.length; i++) {
			var checkpoint = checkpoints[i]
			if (checkpoint.t <= prior_to_t && checkpoint.t >= nearest_t) {
				nearest_checkpoint = checkpoint
				nearest_t = checkpoint.t
			}
		}
		return nearest_checkpoint
	}
	
	var maybe_make_checkpoint = function() {
		if (t > parseFloat(slider.max)) {
			return
		}
		var checkpoint = get_nearest_prior_checkpoint(t)
		if (checkpoint) {
			if (t > checkpoint.t + CHECKPOINT_INTERVAL) {
				checkpoint = null
			}
		}
		if (!checkpoint) {
			var checkpoint_canvas = document.createElement("canvas")
			var checkpoint_ctx = checkpoint_canvas.getContext("2d")
			checkpoint_canvas.width = gl.canvas.width
			checkpoint_canvas.height = gl.canvas.height
			checkpoint_ctx.drawImage(gl.canvas, 0, 0)
			var checkpoint = {t: t, canvas: checkpoint_canvas}
			checkpoints.push(checkpoint)
		}
	}
	
	var simulate_to = function(new_t) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		program.init()
		for (t = 0; t <= new_t; t += INTERVAL) {
			gl.onupdate(INTERVAL)
			gl.ondraw()
			maybe_make_checkpoint()
		}
		// TODO: simulate progressively
	}
	
	var playing = false
	var show_checkpoint = false
	
	var play = function() {
		playing = true
		play_pause_icon.textContent = "pause"
	}
	var pause = function() {
		playing = false
		play_pause_icon.textContent = "play_arrow"
	}
	var play_pause = function() {
		if (playing) {
			pause()
		} else {
			play()
		}
	}
	
	var seek_by = function(delta) {
		simulate_to(t + delta)
		// TODO: show checkpoint within a period when going backwards
	}
	
	var animate = function() {
		var post =
			window.requestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			function(callback) { setTimeout(callback, 1000 / 60) }
		
		function update() {
			if (playing) {
				var delta = INTERVAL
				t += delta
				slider.MaterialSlider.change(t)
				
				gl.onupdate(delta)
				gl.ondraw()
				
				maybe_make_checkpoint()
			}
			var show_image
			if (show_checkpoint) {
				// TODO: maybe show an interpolation between checkpoints
				var new_t = parseFloat(slider.value)
				t = new_t
				var checkpoint = get_nearest_prior_checkpoint(t)
				if (checkpoint) {
					if (t > checkpoint.t + CHECKPOINT_INTERVAL + INTERVAL) {
						simulate_to(t)
						show_image = gl.canvas
					}else{
						show_image = checkpoint.canvas
					}
				}
			}else{
				show_image = gl.canvas
			}
			if (show_image) {
				canvas.width = show_image.width
				canvas.height = show_image.height
				ctx.drawImage(show_image, 0, 0)
			}
			post(update)
		}
		update()
	}
	
	program.init()
	
	animate()
	play()
	
	play_pause_button.addEventListener("click", play_pause)
	
	export_button.addEventListener("click", function() {
		// console.log("export")
		var a = document.createElement("a")
		a.download = "export.png"
		
		var metadata = {
			"Software": "ink-dangle", // TODO: version number (also a better name)
			"Author": "Isaiah Odhner", // FIXME: hardcoded as me
			"Creation Time": Date(),
			"Program Source": JSON.stringify("TODO"), // TODO: include actual source code
			"Program Inputs": JSON.stringify({
				t: t
				// TODO: seed, whatever else
			}),
			// "Comment": "Oh yeah"
		}
		console.log("including metadata", metadata)
		
		canvas.toBlob(function(blob) {
			// console.log("blob", blob)
			var file_reader = new FileReader
			file_reader.onload = function() {
				var array_buffer = this.result
				// console.log("array_buffer", array_buffer)
				var uint8_array = new Uint8Array(array_buffer)
				// console.log("uint8_array", uint8_array)
				var chunks = png_chunks_extract(uint8_array)
				// console.log("chunks", chunks)
				
				for (var k in metadata){
					chunks.splice(-1, 0, png_chunk_text.encode(k, metadata[k]))
				}
				// console.log("added chunks")
				
				var reencoded_buffer = png_chunks_encode(chunks)
				// console.log("reencoded_buffer", reencoded_buffer)
				var reencoded_blob = new Blob([reencoded_buffer], {type: "image/png"})
				// console.log("reencoded_blob", reencoded_blob)
				var blob_url = URL.createObjectURL(reencoded_blob)
				console.log("blob_url", blob_url)
				a.href = blob_url
				a.click()
			}
			file_reader.readAsArrayBuffer(blob)
		}, "image/png")
	})
	
	// TODO: only when user actually starts scrubbing
	slider.addEventListener("mousedown", function() {
		var was_playing = playing
		pause()
		show_checkpoint = true
		addEventListener("mouseup", function mouseup() {
			removeEventListener("mouseup", mouseup)
			
			// TODO: should we just generate a checkpoint here instead?
			// might make it weirdly uneven
			show_checkpoint = false
			var new_t = parseFloat(slider.value)
			simulate_to(new_t)
			if (was_playing) {
				play()
			}
		})
	})
	
	addEventListener("keydown", function(e) {
		switch (e.keyCode) {
			case 32:
				play_pause()
				break
			case 37:
				seek_by(-1)
				break
			case 39:
				seek_by(+1)
				break
		}
	})
}

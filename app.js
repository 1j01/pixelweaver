
// FIXME: canvas is cleared when window is blurred (sometimes?)

const png_chunks_extract = require("png-chunks-extract")
const png_chunks_encode = require("png-chunks-encode")
const png_chunk_text = require("png-chunk-text")
const seed_random = require("seedrandom")

var program_source

var seed_gen = seed_random("gimme a seed", {entropy: true})
var seed = seed_gen()

var slider = document.getElementById("animation-position")
var container = document.getElementById("animation-container")
var export_button = document.querySelector("#export")
var reseed_button = document.querySelector("#reseed")
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
var CHECKPOINT_INTERVAL = 10
gl.onupdate = function() {
	if (window.update) {
		window.update()
	}
}
gl.ondraw = function() {
	if (window.draw) {
		gl.loadIdentity()
		gl.translate(0, 0, -5)
		window.draw(gl)
	}
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

var clear_checkpoints = function() {
	checkpoints = []
	// might want to release ImageBitmaps here later
}

var clear_screen = function() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

var reset_to_start = function() {
	clear_checkpoints()
	clear_screen()
	t = 0
	slider.MaterialSlider.change(t)
}

var re_init = function() {
	init_program_from_source(program_source)
}

var simulate_to = function(new_t) {
	clear_screen()
	if (program_source) {
		re_init()
		for (t = 0; t <= new_t; t += 1) {
			gl.onupdate()
			gl.ondraw()
			maybe_make_checkpoint()
		}
		// TODO: simulate progressively
	}
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
	// TODO: show checkpoint within a period of time if any exist around t + delta
}

var animate = function() {
	var post =
		window.requestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		function(callback) { setTimeout(callback, 1000 / 60) }
	
	function update() {
		if (playing) {
			t += 1
			slider.MaterialSlider.change(t)
			
			gl.onupdate()
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
				if (t > checkpoint.t + CHECKPOINT_INTERVAL + 1) {
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

animate()

play_pause_button.addEventListener("click", play_pause)

var read_png_chunks_from_blob = function(blob, callback) {
	var file_reader = new FileReader
	file_reader.onload = function() {
		var array_buffer = this.result
		var uint8_array = new Uint8Array(array_buffer)
		var chunks = png_chunks_extract(uint8_array)
		callback(chunks)
	}
	file_reader.readAsArrayBuffer(blob)
}

var inject_metadata = function(blob, metadata, callback) {
	read_png_chunks_from_blob(blob, function(chunks) {
		for (var k in metadata){
			chunks.splice(-1, 0, png_chunk_text.encode(k, metadata[k]))
		}
		var reencoded_buffer = png_chunks_encode(chunks)
		var reencoded_blob = new Blob([reencoded_buffer], {type: "image/png"})
		callback(reencoded_blob)
	})
}

var read_metadata = function(blob, callback) {
	read_png_chunks_from_blob(blob, function(chunks) {
		
		var textChunks = chunks.filter(function(chunk) {
			return chunk.name === "tEXt"
		}).map(function(chunk) {
			return png_chunk_text.decode(chunk.data)
		})
		
		var metadata = {}
		
		for (var i = 0; i < textChunks.length; i++) {
			var textChunk = textChunks[i]
			metadata[textChunk.keyword] = textChunk.text
		}
		
		callback(metadata)
	})
}

export_button.addEventListener("click", function() {
	var a = document.createElement("a")
	a.download = "export.png"
	
	var metadata = {
		"Software": "ink-dangle", // TODO: version number (also a better name)
		"Creation Time": new Date().toUTCString(),
		"Program Source": program_source.replace(/\r\n/g, "\n"),
		"Program Language": "text/coffeescript",
		"Program Inputs": JSON.stringify({
			t: t,
			seed: seed,
			// TODO: include viewport/projection, background color, and maybe custom inputs
		})
	}
	var author_tag_match = program_source.match(/@author(?:: ?| )(.*)/)
	if (author_tag_match) {
		metadata["Author"] = author_tag_match[1]
	}
	console.log("Export PNG with metadata", metadata)
	
	canvas.toBlob(function(blob) {
		inject_metadata(blob, metadata, function(reencoded_blob) {
			var blob_url = URL.createObjectURL(reencoded_blob)
			console.log("Blob URL, in case a.click() doesn't work:", blob_url)
			a.href = blob_url
			a.click()
		})
	}, "image/png")
})

reseed_button.addEventListener("click", function() {
	reset_to_start()
	seed = seed_gen()
	if (program_source) {
		re_init()
	}
})

var handle_drop = function(e) {
	e.stopPropagation()
	e.preventDefault()
	
	var file = e.dataTransfer.files[0]
	
	if (file) {
		read_metadata(file, function(metadata) {
			console.log("Load program from metadata", metadata)
			inputs = JSON.parse(metadata["Program Inputs"])
			source = metadata["Program Source"]
			
			if (inputs.seed) {
				seed = inputs.seed
			}
			
			// TODO: sandbox
			run_program_from_source(source)
			
			// pause()
			// simulate_to(inputs.t)
		})
	}
}

var handle_drag_over = function(e) {
	e.stopPropagation()
	e.preventDefault()
	e.dataTransfer.dropEffect = "copy"
}

document.body.addEventListener("dragover", handle_drag_over, false)
document.body.addEventListener("drop", handle_drop, false)

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
			seek_by(-100)
			break
		case 39:
			seek_by(+100)
			break
	}
})

init_program_from_source = function(source) {
	reset_to_start()
	seed_random(seed, {global: true})
	program_source = source
	console.log("eval")
	// CoffeeScript.eval(program_source)
	js = CoffeeScript.compile(program_source)
	eval(js)
}

run_program_from_source = function(source) {
	init_program_from_source(source)
	play()
}

fetch("program.coffee").then(function(response) {
	return response.text().then(function(text) {
		run_program_from_source(text)
	})
}).catch(function(err) {
	console.error(err)
})


const seed_random = require("seedrandom")
const semver = require("semver")
const {inject_metadata, read_metadata} = require("./png-metadata.js")

const API_VERSION = "0.2.0"
const API_VERSION_RANGE = "~" + semver.major(API_VERSION) + "." + semver.minor(API_VERSION)

var program_source
var program_context

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
canvas.style.background = "#000"

var gl = GL.create({preserveDrawingBuffer: true})
container.appendChild(canvas)
// container.appendChild(gl.canvas)

var view_width = 10
var view_height = 10
var view_scale = 100
var camera_x = 0
var camera_y = 0
var camera_z = -500

var init_gl = function() {
	gl.enable(gl.DEPTH_TEST)

	gl.canvas.width = view_width * view_scale
	gl.canvas.height = view_height * view_scale
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
	
	gl.matrixMode(gl.PROJECTION)
	gl.loadIdentity()
	gl.ortho(-view_width/2, view_width/2, -view_height/2, view_height/2, 0.1, 1000)
	// gl.perspective(45, 1, 0.1, 1000)
	gl.matrixMode(gl.MODELVIEW)
}

init_gl()

var t = 0
var CHECKPOINT_INTERVAL = 10
gl.onupdate = function() {
	if (program_context && program_context.update) {
		program_context.update()
	}
}
gl.ondraw = function() {
	if (program_context && program_context.draw) {
		gl.loadIdentity()
		gl.translate(0, 0, camera_z)
		program_context.draw(gl)
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

var simulate_to = function(new_t) {
	if (program_source) {
		if (new_t < t) {
			clear_screen()
			t = 0
			init_program()
		}
		// for (; t <= new_t; t += 1) {
		// TODO: limit this loop, probably based on execution time would be good
		while (++t <= new_t) {
			gl.onupdate()
			gl.ondraw()
			maybe_make_checkpoint()
		}
	}
	slider.MaterialSlider.change(t)
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
			var checkpoint = get_nearest_prior_checkpoint(new_t)
			if (checkpoint) {
				// TODO: simulate smoothly when going forwards, otherwise show checkpoint
				if (new_t > checkpoint.t + CHECKPOINT_INTERVAL + 1) {
				// if (t >= checkpoint.t + 1 && new_t >= checkpoint.t + 1) {
					simulate_to(new_t)
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

require("visibility-change-ponyfill")(function() {
	if (!document.hidden) {
		// fix for canvas being cleared when window is blurred in Chrome
		gl.begin(gl.TRIANGLES)
		gl.vertex(0, 0, 0) // triangle needs at least one vertex apparently
		gl.end()
		// NOTE: still sometimes shows a flash of the background color
	}
})

play_pause_button.addEventListener("click", play_pause)

export_button.addEventListener("click", function() {
	var a = document.createElement("a")
	a.download = "export.png"
	
	var metadata = {
		"Software": "ink-dangle", // TODO: a better name
		"API Version": API_VERSION,
		"Creation Time": new Date().toUTCString(),
		"Program Source": program_source.replace(/\r\n/g, "\n"),
		"Program Language": "text/coffeescript",
		"Program Inputs": JSON.stringify({
			t: t,
			seed: seed,
			view: {
				width: view_width,
				height: view_height,
				camera: {
					x: camera_x,
					y: camera_y,
					z: camera_z,
				},
				scale: view_scale
			},
			// TODO: include projection, background color, and maybe custom inputs
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
		init_program()
	}
})

var handle_drop = function(e) {
	e.stopPropagation()
	e.preventDefault()
	
	var file = e.dataTransfer.files[0]
	
	if (file) {
		read_metadata(file, function(metadata) {
			console.log("Load program from metadata", metadata)
			
			// XXX: avoiding program_source variable name used above
			var source = metadata["Program Source"]
			var api_version = metadata["API Version"]
			
			if (!source) {
				alert("This PNG does not contain program source code")
				return
			} else if (!api_version) {
				alert("This PNG does not specify an API version")
				return
			} else if (!semver.valid(api_version)) {
				alert("This PNG specifies an invalid API version (" + api_version + ")")
				return
			} else if (semver.satisfies(api_version, API_VERSION_RANGE)) {
				
			} else if (semver.lt(api_version, API_VERSION)) {
				if(!confirm("This program uses an earlier version of the API (" + api_version + "). Try loading anyways? (Current API version: " + API_VERSION + ")")){
					return
				}
			} else if (semver.gt(api_version, API_VERSION)) {
				if(!confirm("This program uses a later version of the API (" + api_version + "). Try loading anyways? (Current API version: " + API_VERSION + ")")){
					return
				}
			} else {
				alert("This program's API version (" + api_version + ") is valid but doesn't satisfy the current API version ^(" + API_VERSION + ") but also isn't greater than or less than it, which doesn't make any sense")
				return
			}
			
			var inputs = JSON.parse(metadata["Program Inputs"])
			
			if (inputs.seed) {
				seed = inputs.seed
			}
			
			// NOTE: weird backwards-compatibility poor defaults
			view_width = 10
			view_height = 10
			view_scale = 102.4
			camera_x = 0
			camera_y = 0
			camera_z = -5
			
			if (inputs.view) {
				if (inputs.view.camera) {
					view_scale = inputs.view.scale
				}
				if (inputs.view.camera) {
					camera_x = inputs.view.camera.x
					camera_y = inputs.view.camera.y
					camera_z = inputs.view.camera.z
				}
			}
			
			init_gl()
			
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

var init_program = function() {
	seed_random(seed, {global: true})
	program_context = {}
	CoffeeScript.eval.call(program_context, program_source)
}

var run_program_from_source = function(source) {
	reset_to_start()
	program_source = source
	init_program()
	play()
}

fetch("program.coffee").then(function(response) {
	return response.text().then(function(text) {
		run_program_from_source(text)
	})
}).catch(function(err) {
	console.error(err)
})

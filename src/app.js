
const seed_random = require("seedrandom")
const semver = require("semver")
const is_png = require("is-png")
const {inject_metadata, read_metadata} = require("./png-metadata.js")

const API_VERSION = "0.2.1"
const API_VERSION_RANGE = "~" + semver.major(API_VERSION) + "." + semver.minor(API_VERSION)

var program_source
var program_context

var seed_gen = seed_random("gimme a seed", {entropy: true})
var seed = seed_gen()

var slider = document.getElementById("animation-position")
var container = document.getElementById("animation-container")
var source_button = document.getElementById("show-source")
var export_button = document.getElementById("export")
var reseed_button = document.getElementById("reseed")
var play_pause_button = document.getElementById("play-pause")
var play_pause_icon = document.querySelector("#play-pause .material-icons")

componentHandler.upgradeElement(slider)

var canvas = document.createElement("canvas")
var ctx = canvas.getContext("2d")
canvas.style.background = "#000"
container.appendChild(canvas)

var view_width = 10
var view_height = 10
var view_scale = 100
var camera_x = 0
var camera_y = 0
var camera_z = -500

var gl

var init_gl = function() {
	gl = GL.create({preserveDrawingBuffer: true})
	
	gl.enable(gl.DEPTH_TEST)

	gl.canvas.width = view_width * view_scale
	gl.canvas.height = view_height * view_scale
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
	
	gl.matrixMode(gl.PROJECTION)
	gl.loadIdentity()
	gl.ortho(-view_width/2, view_width/2, -view_height/2, view_height/2, 0.1, 1000)
	// gl.perspective(view_fov, view_width/view_height, 0.1, 1000)
	gl.matrixMode(gl.MODELVIEW)
	
	// NOTE: these don't need to be attached to gl; that's just how it's done in the examples
	gl.onupdate = function() {
		if (program_context && program_context.update) {
			program_context.update()
		}
	}
	gl.ondraw = function() {
		if (program_context && program_context.draw) {
			gl.loadIdentity()
			gl.translate(camera_x, camera_y, camera_z)
			// gl should probably just be global for the program
			// or at least there should be an init method you can define that also gets gl
			program_context.draw(gl)
		}
	}
}

init_gl()

var t = 0
var CHECKPOINT_INTERVAL = 10
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
	// might want to release ImageBitmaps here in the future
}

var simulate_to = function(new_t) {
	if (program_source) {
		if (new_t < t) {
			t = 0
			init_program()
		}
		
		// TODO: limit this loop based on execution time
		// will need to change things in the application logic
		// might want to pass loop_execution_limit_ms as a parameter
		
		// var loop_execution_limit_ms = 40
		// var start = performance.now()

		while (t < new_t) {
			gl.onupdate()
			gl.ondraw()
			maybe_make_checkpoint()
			// var elapsed = performance.now() - start
			// if (elapsed > loop_execution_limit_ms) {
			// 	break
			// }
			t++;
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
		requestAnimationFrame(update)
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

var collect_metadata = function(){
	var metadata = {
		"Software": "Pixelweaver", // TODO: a better name
		"API Version": API_VERSION,
		"Creation Time": new Date().toUTCString(),
		"Program Source": program_source.replace(/\r\n/g, "\n"),
		"Program Language": "text/coffeescript",
		"Program Inputs": JSON.stringify({
			t: t, // TODO: rename to "time"
			seed: seed,
			// could include a flag for whether a program uses immediate mode or not,
			// or whether it used a fixed timestamp
			view: {
				// can use "fov" to indicate perspective projection
				// maybe it should be canvas width/height and fov/zoom
				width: view_width,
				height: view_height,
				camera: {
					x: camera_x,
					y: camera_y,
					z: camera_z,
				},
				scale: view_scale
			},
			// custom inputs will go here
		})
	}
	var author_tag_match = program_source.match(/@author(?:: ?| )(.*)/)
	if (author_tag_match) {
		metadata["Author"] = author_tag_match[1]
	}
	return metadata
};

play_pause_button.addEventListener("click", play_pause)

var dialog = document.getElementById('show-source-dialog')
dialogPolyfill.registerDialog(dialog)

dialog.querySelector('.close').addEventListener('click', function() {
	dialog.close()
})

function show_metadata_and_program_source() {
	pause();

	var metadata = collect_metadata();
	delete metadata["Program Source"];
	metadata["Program Inputs"] = JSON.parse(metadata["Program Inputs"]);

	var metadata_el = document.getElementById("metadata");
	var program_source_el = document.getElementById("program-source");
	
	metadata_el.value = JSON.stringify(metadata, null, 2);
	program_source_el.value = program_source;
	
	var metadata_ace_el = document.getElementById("metadata-ace");
	var program_source_ace_el = document.getElementById("program-source-ace");

	var editor = ace.edit(metadata_ace_el);
	editor.setTheme("ace/theme/dreamweaver");
	editor.getSession().setMode("ace/mode/javascript");
	editor.getSession().setValue(metadata_el.value);
	editor.setOptions({
		readOnly: true,
		maxLines: 100,
	});
	metadata_ace_el.style.height = "500px";
	metadata_el.style.display = "none";

	var editor = ace.edit(program_source_ace_el);
	editor.setTheme("ace/theme/dreamweaver");
	editor.getSession().setMode("ace/mode/coffee");
	editor.getSession().setValue(program_source_el.value);
	editor.setOptions({
		readOnly: true,
		maxLines: 150,
	});
	program_source_ace_el.style.height = "500px";
	program_source_el.style.display = "none";
	
	dialog.showModal();	
}

function export_program_as_png() {
	var a = document.createElement("a")
	a.download = "export.png"
	
	var metadata = collect_metadata();
	
	console.log("Export PNG with metadata", metadata)
	
	canvas.toBlob(function(blob) {
		inject_metadata(blob, metadata, function(reencoded_blob) {
			var blob_url = URL.createObjectURL(reencoded_blob)
			console.log("Blob URL, in case a.click() doesn't work:", blob_url)
			a.href = blob_url
			a.click()
		})
	}, "image/png")
}


function reseed() {
	seed = seed_gen()
	if (program_source) {
		init_program()
	}
}

source_button.addEventListener("click", show_metadata_and_program_source);
export_button.addEventListener("click", export_program_as_png)
reseed_button.addEventListener("click", reseed)

var load_program = function(source, metadata) {
	// XXX: avoiding shadowing program_source variable
	
	if (metadata) {
		console.log("Load program from metadata", metadata)
		
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
	} else {
		// NOTE: should be kept in sync with initial declarations (XXX)
		view_width = 10
		view_height = 10
		view_scale = 100
		camera_x = 0
		camera_y = 0
		camera_z = -500
	}
	
	run_program_from_source(source)
	
	// pause()
	// simulate_to(inputs.t)
}

var load_program_from_file = function(file) {
	var file_reader = new FileReader
	file_reader.onload = function() {
		var array_buffer = this.result
		var uint8_array = new Uint8Array(array_buffer)
		if (is_png(uint8_array)) {
			var metadata = read_metadata(uint8_array)
			// XXX: avoiding shadowing program_source variable
			var source = metadata["Program Source"]
			load_program(source, metadata)
		} else {
			var file_reader = new FileReader
			file_reader.onload = function() {
				load_program(this.result)
			}
			file_reader.readAsText(file)
		}
	}
	file_reader.readAsArrayBuffer(file)
}

var handle_drop = function(e) {
	e.stopPropagation()
	e.preventDefault()
	
	var file = e.dataTransfer.files[0]
	
	if (file) {
		load_program_from_file(file)
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
	switch (e.key) {
		case "r":
			reseed()
			break
		// TODO: shift+r/ctrl+z/z: go back a seed
		// especially with these shortcuts so close together on a qwerty keyboard! (e and r)
		// and especially with autoreload and autosave
		case "e":
			export_program_as_png()
			break
		case " ":
			play_pause()
			break
		case "Home":
			simulate_to(0)
			break
		case "ArrowLeft":
			seek_by(-100)
			break
		case "ArrowRight":
			seek_by(+100)
			break
		// <, and >. for single frame stepping, same as youtube
		case ",":
		case "<":
			seek_by(-1)
			break
		case ".":
		case ">":
			seek_by(+1)
			break
	}
})

var init_program = function() {
	init_gl()
	
	clear_checkpoints()
	
	t = 0
	slider.MaterialSlider.change(t)
	
	seed_random(seed, {global: true})
	
	program_context = {}
	CoffeeScript.eval.call(program_context, program_source)
	// TODO: sandbox
}

var run_program_from_source = function(source) {
	program_source = source
	window.code_for_copying = source
	init_program()
	play()
}

fetch("examples/attractors.coffee").then(function(response) {
	return response.text().then(function(text) {
		run_program_from_source(text)
	})
}).catch(function(err) {
	console.error(err)
})

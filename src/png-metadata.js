
const png_chunks_extract = require("png-chunks-extract")
const png_chunks_encode = require("png-chunks-encode")
const png_chunk_text = require("png-chunk-text")

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

exports.inject_metadata = function(blob, metadata, callback) {
	read_png_chunks_from_blob(blob, function(chunks) {
		for (var k in metadata){
			chunks.splice(-1, 0, png_chunk_text.encode(k, metadata[k]))
		}
		var reencoded_buffer = png_chunks_encode(chunks)
		var reencoded_blob = new Blob([reencoded_buffer], {type: "image/png"})
		callback(reencoded_blob)
	})
}

// exports.inject_metadata = function(uint8_array, metadata) {
// 	var chunks = png_chunks_extract(uint8_array)
// 	for (var k in metadata){
// 		chunks.splice(-1, 0, png_chunk_text.encode(k, metadata[k]))
// 	}
// 	var reencoded_buffer = png_chunks_encode(chunks)
// 	var reencoded_blob = new Blob([reencoded_buffer], {type: "image/png"})
// 	return reencoded_blob
// }

exports.read_metadata = function(uint8_array) {
	var chunks = png_chunks_extract(uint8_array)
		
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
	
	return metadata
}

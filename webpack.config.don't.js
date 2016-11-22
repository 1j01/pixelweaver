module.exports = {
	context: __dirname + "/",
	entry: "./app.js",
	// entry: ['webpack/hot/dev-server' , './app.js'],
	output: {
		path: __dirname + "/build",
		publicPath: "/build",
		filename: "bundle.js"
	}
}

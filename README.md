
# Procbrush

Procbrush is a **reproducible procedural drawing** tool.
It gives you controls to scrub through time,
despite using an immediate mode drawing paradigm.
Images saved with the Export button
<!-- embed all the data needed to reproduce the state at which they were captured -->
can be loaded back into the app with drag and drop
<!-- including source code, random seed, position in time and space, etc., -->
and you can play back to the point the image was captured.
And beyond. Or back.
<!-- (once zooming/panning implemented:) -->
<!-- *Zoom and enhance.* -->
<!-- Or *uncrop*. -->
Maybe try a new random seed.
And you can save other screenshots, which will also embed all the data needed to reproduce them.
<!-- (once supported:) -->
<!-- And then export the code and/or edit it in an editor or whatever? -->

<!-- (You can also save images that don't include any of that metadata by just right clicking on the canvas and saving it as an image. In chrome, at least...) -->

**Warning:** loading a program (including via screenshot) is totally **unsandboxed** for now!
(But as long as it's your own code you're loading, you don't have to worry about that.)

Procbrush is currently focused around an [immediate mode] drawing paradigm on a 3D canvas
in contrast to the usual [retained mode] for 3D, such as with a [scene graph].


It could be expanded to allow for [retained mode] 3D as well,
maybe even VR.
Other possibilities include 3D and 2D repeating patterns and tessellations
by wrapping drawing calls and transforming and duplicating them,
as well as plain old 2D.

The app lets you scrub through an animation,
simulating up to that point when you release.

When you take a screenshot with the Export button,
it embeds all the metadata required to reproduce the state,
including the entire source code for the program,
the position in the animation, the random seed, the viewport, and any other inputs.
It'll also include the Creation Time (time of export),
and the Author if specified via an `@author` tag in the source.
There are a few other [standard metadata keywords]
like Title and Description that could be supported as well.

<!-- You can drag and drop an exported image back into the app -->
<!-- to load up the program that generated the image. -->
You can drag an exported file back onto the app to load up the program.
Note that this is totally **unsandboxed** for now,
and there isn't a reasonable way to preview a program's code before running it.

You can also drag a source code file onto the app to load.

Since the viewport is an input to the program,
I could let you zoom around with the UI,
previewing the change by scaling/translating the output of the program
before simulating back up to that point.

Could render the program in parallel at a zoomed out scale,
and use that for the preview when zooming out or panning,
and potentially a minimap for navigation as well.

## Usage

Currently there's no integrated code editor;
I'm just live-reloading the app and having the app load a default program from [`examples`].
Programs are currently written in [Coffeescript], because I like CoffeeScript.
Ultimately you should be able to use JavaScript or [any language that compiles to it][compile-to-JS langs].

This could be a web app, or maybe a plugin for a code fiddling app.
For now, you need [Node.js] and you need to [clone the repo],
and then you can open a terminal/command prompt and run `npm install` and `npm run dev`.
This will start up a server and open up a page in your browser which will reload when you edit your program,
and it will also let you make changes to Ink Dangle itself.

## API

The API isn't exactly solid yet.

There are way more use cases for the functionality than I initially considered.
Probably need to *invert control* somehow to allow for these possibilities.
<!-- Like maybe this project should be more like a library
for including a scrubber and saving/loading state from screenshots,
but the rest is up to you?
I guess you'd have to have an API version indicator specific to your application.
And, idk, it seems like the end result should be an app,
but you'd naturally want so many things related to coding,
only tangentially related to the core idea of reproducibility,
that it doesn't make sense.
You'd want to able to use different languages (at least JS/CoffeeScript/TypeScript),
libraries (simplex noise and other algorithms, graphical frameworks),
and various features like infinite loop protection, and linking to and forking projects/fiddles.
It should be like a plugin.
-->

At the top level, you can provide `@draw` and `@update`.
`@draw` is passed the `gl` object from [lightgl.js].

There are no requirements that a program's state be JSON-serializable.
You can even update state in `draw`, but that should really be done in `update`.


You shouldn't use `setTimeout` or `setInterval`;
I should probably prevent access to these,
but I could provide `every` and `after` helpers
that operate on animation frame intervals.
(`setTimeout` and `setInterval` are terrible names btw)

You shouldn't use global variables either.


[immediate mode]: https://en.wikipedia.org/wiki/Immediate_mode_(computer_graphics)
[retained mode]: https://en.wikipedia.org/wiki/Retained_mode
[scene graph]: https://en.wikipedia.org/wiki/Scene_graph
[lightgl.js]: https://github.com/evanw/lightgl.js/
[standard metadata keywords]: https://www.w3.org/TR/PNG-Chunks.html#C.Summary-of-standard-chunks
[`examples`]: ./examples
[Node.js]: https://nodejs.org/
[Coffeescript]: http://coffeescript.org/
[compile-to-JS langs]: https://github.com/jashkenas/coffeescript/wiki/list-of-languages-that-compile-to-js
[clone the repo]: https://help.github.com/articles/cloning-a-repository/


# Ink Dangle

Ink Dangle *(working title)* is a reproducible procedural drawing tool
currently focused around an [immediate mode][] drawing paradigm on a 3D canvas
in contrast to the usual [retained mode][] for 3D, such as with a [scene graph][].

The name Ink Dangle comes from a specific vision I have for what I want to do with this,
making 2D patterns by brushing ink in at different depths on a 3D canvas,
but it could be expanded to allow for [retained mode][] 3D as well,
maybe even VR.
Other possibilities include 3D and 2D repeating patterns and tessellations
by wrapping drawing calls and transforming and duplicating them,
and plain old 2D.

The app lets you scrub through an animation,
simulating up to that point when you release.

When you take a screenshot with the Export button,
it embeds all the metadata required to reproduce the state,
including the entire source code for the program,
the position in the animation, the random seed, and any other inputs.
It'll also include the time of the snapshot as the Creation Time,
and the Author if specified via an `@author` tag in the source.
There are a few other [standard metadata keywords][]
like Title and Description that could be included with tags as well.

You can drag an exported file back onto the app to load up the program.
Note that this is totally **unsandboxed** for now,
and there isn't a reasonable way to preview a program's code before running it.

## Usage

Currently there's no integrated code editor;
I'm just live-reloading the app and having the app load a default `program.coffee`.

For now, you need Node.js and you need to clone the repo,
and then you can open a terminal/command prompt and run `npm install` and `npm run dev`.

## API

The API is not well defined yet.
Currently there's an arbitrary and kind of ridiculous viewport that's implicitly part of the API surface.
It should make more sense as an "input" to the program.
Might even let you zoom around with the UI,
previewing the change by scaling/translating the output of the program
before simulating back up to that point.
Also I should probably have a flag for whether a program uses immediate mode or not,
and maybe whether it uses a fixed or variable timestep.

At the top level, you can do initialization and provide `@draw` and `@update`.

It uses [lightgl.js][] for the drawing API, in immediate mode.
`@draw` is passed the `gl` object.

There are no requirements that a program's state be JSON-serializable.
You can even update state in `draw` if you want, but that should generally be done in `update`.


You shouldn't use `setTimeout` or `setInterval`;
I should probably prevent access to these,
but I could provide `every` and `after` helpers.
(`setTimeout` and `setInterval` are terrible names btw)

Don't use global variables either.


[immediate mode]: https://en.wikipedia.org/wiki/Immediate_mode_(computer_graphics)
[retained mode]: https://en.wikipedia.org/wiki/Retained_mode
[scene graph]: https://en.wikipedia.org/wiki/Scene_graph
[lightgl.js]: https://github.com/evanw/lightgl.js/
[standard metadata keywords]: https://www.w3.org/TR/PNG-Chunks.html#C.Summary-of-standard-chunks


# Ink Dangle

Ink Dangle (working title) is a reproducible procedural drawing tool
focused around an [immediate mode][] drawing paradigm on a 3D canvas
in contrast to the usual 3D [retained mode][], often with a [scene graph][]

The name Ink Dangle comes from a specific vision I have for what I want to do with this,
making 2D patterns by brushing at different depths on a 3D canvas,
but it could be expanded to allow for [retained mode][] 3D as well,
maybe even VR.

The app lets you scrub through an animation,
showing snapshots of the canvas before simulating up to that point when you release.

When you take a screenshot with the Export button,
it embeds all the metadata required to reproduce it,
including the entire source code for the program,
the position in the animation, the random seed, and any other inputs
(as well as the author if specified via an `@author` tag in the source).

You can drag an exported file back onto the app to load up the program.
Note that this is totally **unsandboxed** for now,
and there isn't a reasonable way to preview the program before running.

## Usage

Currently there's no integrated code editor;
I'm just live-reloading the app and having the app load a default `program.coffee`.

For now, you need Node.js and you need to clone the repo,
and then you can open a terminal/command prompt and run `npm install` and `npm run dev`.

## API

The API is not defined yet. Currently there's an arbitrary and kind of ridiculous viewport that's implicitly part of the API surface.
I think it makes more sense as an "input" to the program.
Might even let you zoom around with the UI, previewing the change by scaling/translating the output of the program before simulating back up to that point.
Also I should probably have a flag for whether a program uses immediate mode or not, and maybe whether it uses timestamps vs fixed steps.
As well as whatever else for future compatibility.
Feature tags?
The API should be versioned at least.


It uses [lightgl.js][] for the drawing API, in immediate mode.

There are no requirements that a program's state be JSON-serializable.
You can even update state in `draw` if you want, but that should generally be done in `update`.


You shouldn't use `setTimeout` or `setInterval`;
I should probably prevent access to these,
but I could provide `every` and `after` helpers.
(`setTimeout` and `setInterval` are terrible names btw)

Currently your `init` function needs to reset the state completely.
Obviously you shouldn't use global variables, but you also shouldn't do crazy stuff like

```coffee
init: ->
	@a ?= 5
	if @b then @b = 2 else @b = 5
```

I should probably make it so that the whole source code is reevaluated though. 


[immediate mode]: https://en.wikipedia.org/wiki/Immediate_mode_(computer_graphics)
[retained mode]: https://en.wikipedia.org/wiki/Retained_mode
[scene graph]: https://en.wikipedia.org/wiki/Scene_graph
[lightgl.js]: https://github.com/evanw/lightgl.js/

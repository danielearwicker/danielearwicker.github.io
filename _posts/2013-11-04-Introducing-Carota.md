---
tags: javascript
date: 2013-11-04
layout: post
---

_This project was a lot of fun, but it has a big roadblock that has to be overcome by any text-based project: internationalisation. Hence I don't see it being
generally useful outside of Western-language-only projects without a lot more work._

I'm developing a rich text editor from scratch in JavaScript, atop the HTML5 canvas. It's called Carota (Latin for carrot, which sounds like "caret", and I
like carrots).

[Here is the demo page](http://earwicker.com/carota/), which is very self-explanatory, in that it presents a bunch of information about the editor, inside
the editor itself, so you can fiddle with it and instantly see how it persists the text in JSON. As you can see, it's quite far along. In fact I suspect it
is already good enough for every way I currently make use of rich text in browser applications. If your browser is old, it will not work. (Hint: IE8 is way old.)

So... Why? What a crazy waste of time when browsers already have the marvellous [contentEditable](https://www.google.com/search?q=contentEditable) feature, right?

A quick survey of the state-of-the-art suggests otherwise. [Google Docs uses its own text layout and rendering system](http://googledocs.blogspot.co.uk/2010/05/whats-different-about-new-google-docs.html),
only using the DOM as low-level display mechanism (the details on that link are very relevant and interesting). Go to Apple's iCloud which now has a beta of
their _Pages_ word processor, and use your browser to look at how they do it: the text is rendered using absolute, meticulously positioned SVG elements, so
they too perform their own layout.

And having tried for the last year to get `contentEditable` to serve my purposes, in the same way on all browsers (actually, even one browser would be
something), I can understand why the Twin Behemoths of the Cloud have taken control of their own text layout. So I'm going to do the same thing, but with
Canvas. (My previous plan was to do a plugin for Windows so I'd be able to use the Win32 Rich Edit control, but [that kind of plugin is about to die out](http://blog.chromium.org/2013/09/saying-goodbye-to-our-old-friend-npapi.html).)

Before I got as far as drawing any text on screen, I had to be very careful to build up a fundamental model of how flowing text actually works. I wanted to
end up with beautiful components that each do something extremely simple, and plug together into a working editor. That way it's easier to change stuff to
meet future needs. I've designed it from the ground up to be hacked by other people to do whatever _they_ want.

So, hopefully I'll be back soon to start describing how it works. In the meantime, [fork me on github](https://github.com/danielearwicker/carota) and you
can also get the development set-up via the usual:

`npm install carota`

For a really quick minimal demo, [try this jsfiddle](http://jsfiddle.net/K9JZA/20/), which just creates an editor in an empty `DIV` and then uses `load`
and `save` for persistence.

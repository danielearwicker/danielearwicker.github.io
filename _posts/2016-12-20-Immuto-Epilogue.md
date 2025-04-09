---
tags: typescript immuto
date: 2016-12-20
layout: post
title: Immuto - Epilogue
---

It's been a couple of months since I had a scrap of time to do anything with [Immuto](https://github.com/danielearwicker/immuto) -
I've been up to my knees in WPF/C# instead (working for a living).

This break has given me a new perspective (aside from the obvious one that WPF is yucky). The executive summary is that I don't
see myself ever using Immuto seriously. The way I look at it now is almost as a satire on the rigid idea of "single reducer
function for the whole application state". It wasn't intended that way! I was genuinely into it and was expecting to use it in
my job. But now it looks very different. And as Immuto is just a flavour of Redux, it's a broader comment on Redux itself.

What do I mean by a satire? I mean it's like I was trying to show the absurdity of something by pretending to take it seriously.
(Except I _was_ taking it seriously). My dad told me a story from around 1969 when he went to a conference. The latest hot
debate topic at the time was [Goto Considered Harmful](http://www.cs.utexas.edu/users/EWD/ewd02xx/EWD215.PDF), and some speaker
put some source code on the overhead projector and invited the room to critique it. Hands went up and all the suggestions were
to get rid of the GOTOs, of course. So as a group they began editing the code to try and get rid of the GOTOs and be good
Structured Programmers, and the structure of the program become more and more absurd and unreadable as the exercise progressed.

The moral is that _sometimes_ a GOTO is the least bad option, so don't be too dogmatic in applying your precious rules. But the
point is, the presenter of that talk let the absurdity of the situation become apparent all by itself, merely by taking it
seriously and seeing where that led. I feel I've done the same thing with Redux, except by accident.

If we have a single reducer function, in a large complex application its going to end up large and complex. So we need to break
it down into composable pieces and tie those pieces together. With a really slick declaritive way of creating and composing
those pieces, this becomes second nature, and we can build applications of unlimited scope and cleverness, all the while fully
conforming _to the letter if not the spirit_ of the law that there must be a single reducer function for our whole app.

There is a single reducer function... you just wouldn't know this from looking at the code. Nor would you ever care.

The same goes for the "single state atom", the variable that holds the result of the most recent execution of the whole-app
reducer. There is only one mutable variable in the entire app. But again, who cares? The value of that variable is some deep
nested hierarchy within which their are many islands that each encapsulate some separate portion of the application state. So
in any meaningful sense it's not one value. It's many.

Yes, we artificially stitch them together so we can store them in a single state variable, but by doing so we introduce a need
to constantly discard and rebuild all the outer structure every time something lower down is modified.

All so that we can comply with a rule: single reducer, single state variable. What does this give us? In theory, easier
debugging, and other facilities that depend on keeping old versions of our state tree. The killer demo is "look how easily I
can implement undo!"

But the truth is that you can add undo to any application that has the ability load/save its state to JSON. It doesn't need
to keep its state in one immutable tree. It just needs to be able to assemble all the pieces of its live state into a single
"snapshot" tree when asked, and then later be able to parse such a snapshot and assign pieces of it to wherever they belong
in the live state. [Here's an example I wrote four years ago](https://github.com/danielearwicker/nimbah/blob/master/js/undo.js).

As for debugging and understanding the correctness of your app, of course there's no substitute for having a simple requirement
so your app doesn't need to be complex. In the real world, requirements are not simple. But we in software we (over and over)
apply the golden rule of "divide and conquer", breaking complex problems down into simple pieces that can be independently
solved, reasoned about and tested. This is why Immuto was my necessary response to Redux.

But if my large complex app is really just a lot of small simple apps stuck together, it doesn't matter that much _how_ I
stick them together. Does it really create any issues if I have multiple independent stores, one for each piece? Of course
not. Does it help much with anything if I insist on making them share a single store? Not really, no.

I did progress somewhat with Immuto beyond what I committed/pushed. In particular, I got some way with polymorphism: a
React component that could have multiple implementations, each implementation being able to store data of its own type within
the state. I implemented recursive structures (e.g. a tree in which some nodes are folders with child nodes and others are
leaves or terminals). It was kind of working! But it was complex. I loved that complexity, because I'm a nerd.

But now I have the strange feeling that when I got exciting about Redux, I accepted its basic principles not because they
conferred any advantage, but because I could see that they didn't present any obstacles to a sufficiently smart person, and I
wanted to prove it. It provided me with a nice challenge or diversion. It was a brain-teaser and I got deeply into it. But
the end product is, I suspect, hard for anyone else to pick up and learn, so that in itself is an obstacle. If I were to
foist it onto my team and someone asks me "But _why_ do we need to do it this way?" there is no answer. It was just cool to
figure out.

RIP Immuto. You were fun!

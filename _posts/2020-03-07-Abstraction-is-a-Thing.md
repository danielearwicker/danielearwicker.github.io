---
layout: post
tags: style
date: 2020-03-07
title: Abstraction is a Thing
---

When aliens finally pay us a visit and they start floating around our cities, struggling to pronounce greetings from a phrasebook, we will no doubt say to one another, "Apparently aliens are a thing now." When we recognise something has started happening all the time, we call it "a thing". Or we might remind our friend in a tone of heavy irony, after they accidentally walk into a lamppost, "Yup, lampposts are still a thing."

Of course, deep down every "thing" is just subatomic particles and forces. There is nothing else. Except of course there is! It's a frustrating thing about casual pop science explanations that they stray into that kind of obsessive reductionism. Things don't stop existing just because you found out what they're made of. No one seriously stops referring to chairs and tables when they learn about atoms. I can't put it better than Stephen Pinker:

> Good reductionism (also called hierarchical reductionism) consists not of _replacing_ one field of knowledge with another but of _connecting_ or _unifying_ them.The building blocks used by one field are put under the microscope of another.

The things we identify, and speak in terms of, may not be of fundamental importance to the universe, but they are important to us. We explain what's going on in the world in terms of helpful concepts, of appropriate scale. We're not just going to _exist_ in the world; we're trying to _understand_ the world. That's what all these things are for.

Constructing software is very like this. The "atoms" of software might be operations on values in memory or registers. Explaining how a large program works by throwing the machine code instructions up on a projector, and scrolling through them while saying "See?! I told you it was simple!" is not usually that helpful. We rarely even see these atoms; they are the output of a compiler. Instead we deal with goodly-sized things.

## Reality and Existence

You may counter this by pointing out that the things inside software aren't real, and they don't actually exist. And in a quite boring sense, you are correct: once the software is running, it boils down to billions of those little individual operations on values in memory, nothing else.

But you're making the same mistake as the obsessive reductionist, throwing around words like "real" and "exist" like you own them. We're not talking about what the software needs in order to merely exist; we're talking about what we need in order to understand it. That's a real need: understanding, intentions, purpose, especially shared across multiple authors, are all vitally important here. This is how we arrange for the right individual operations to happen in the right order at runtime. There are patterns in, and constraints on, what those operations will do. That's what we all need to have shared knowledge of, if we're going to collaborate on improving and extending a software product.

This is why we construct software in terms of abstractions (the fancy name for "things") and we want to invent new ones. We're trying to make the software's internal structure easy to understand, so it is easily picked up and used as a starting point for the next person who has to deal with our... stuff.

The least controversial abstractions are the ones that seem to leap out at us from the world of ideas, and dance back and forth shouting "Here I am! I exist!" They have an obvious concreteness. If I wanted to sound artsy-fartsy I'd called them platonic ideals, but there's nothing clever about them. Well, sometimes they can have subtleties (very different from subtitles). But even so, it's incredibly easy to spot them in the wild. [In my text editor, Carota](https://earwicker.com/carota/), there's a thing called a [word](https://github.com/danielearwicker/carota/blob/master/src/word.js). We all know text (in most languages) is made of words, so it's not at all surprising to find them in the code having a kind of independent existence.

On the other hand, Carota's words have an interesting kind of inner life, a structure of their own. I decided that a word would have two _sections_, first a run of text (non-space) characters, and second a run of space characters, such that the space between two words "belongs" to the first. Even if you type some spaces at the start of a document, that's treated as a word whose text section is of length zero. Why did I do it that way? It has to do with the way words wrap onto new lines. And this is of fundamental importance: words exist for the purpose of wrapping the text onto lines - they act as units of wrapping. In a text editor you can type characters however you like, without thinking of organising them as words. You can select a range of characters that spans multiple words, and cuts words in half, and then say "Make that part bold". So at this level of explanation, _words don't exist_. We summon them into existence when we need them.

There is more than one correct way of looking at a text document. After all, it's "just" a stream of characters. Or maybe it's a stream of [runs](https://github.com/danielearwicker/carota/blob/master/src/runs.js), each run being a group of characters having the same formatting. Or maybe it's a hierarchy of [lines](https://github.com/danielearwicker/carota/blob/master/src/line.js) containing [positioned words](https://github.com/danielearwicker/carota/blob/master/src/positionedword.js) that in turn contain positioned characters, supporting delegated hit testing.

There isn't one single set of abstractions that best solves this whole problem. We can slice up a problem space in multiple ways, and we have to flip between representations depending on what we're trying to do.

In JavaScript a few years ago, when you wanted to generate a list of strings from a list of numbers, you would allocate an empty list for the strings, write a `for`-loop to scan the numbers, and format each number into a string before adding it to the string list:

```js
const n = getNumbers();
const s = [];

for (let c = 0; c < n.length; c++) {
    s.push(`Item ${n[c]}`);
}
```

Programs were full of little loops like that. Now we say:

```js
const s = getNumbers().map((n) => `Item ${n}`);
```

The `map` thing is an abstraction, a black box, a building block. Someone had to invent it, strange as that seems. But now we accept it as fundamental without thinking about it. A `Promise` is an abstraction over "perhaps not yet", which is a super vague ephemeral-sounding thing, but our code is full of them. They have reality and solidity, purely because we need them to.

## Humans, Ugh

Yet despite their essential importance in helping us understand both the real and software worlds, abstractions are nevertheless a source of controversy. The reason is obvious: they are things summoned by human beings for our convenience, and we often annoy each other. We're in the realm of the dreaded _social problems_:

-   New senior member joins team and is assigned a grand new goal (how motivational!) But they find the existing code is built on abstractions that just get in their way. In fact they're pretty sure that if all that abstract nonsense was torn down and replaced with reams of atomic verbosity, it would be easier to build the new abstractions they actually need. It would have been better if the last bunch of bozos hadn't tried to be so clever and invent so many useless abstractions.

-   New junior member joins team and is given a small, easy goal (how humble!) but they struggle to implement it because they're in the straightjacket of whatever abstractions already exist. Junior believes too strongly in the existence of abstractions laid down by others. Their existence must be _honoured_. Junior must complete the goal in a way that pays tribute to The Way Things Are Done.

-   Junior colleague thinks a different abstraction would help clarify the code. Senior colleague is threatened by this because it seems to suggest that a thing exists that senior wasn't aware of, and senior is supposed to know about things like that, not be taught their A-B-Cs by some jumped-up junior. So senior bullies junior into accepting the non-existence of this new thing, and junior internalizes this abuse.

These are not problems with the practice of abstraction in general. Nor are they necessarily a sign of a problem with any specific abstraction: if you can find a situation where the abstraction is unhelpful, that doesn't make it a bad abstraction. What about the dozen or so situations where it's helpful? No abstraction is universally applicable. It could be said that you don't understand an abstraction until you know the limits of its applicability. Don't try to use `map` when you are not projecting a list of items into another list of items.

The problems are of perception, and social obligation, and impatience, and intolerance. Yes, there's always that one person who quotes chapter and verse instead of thinking. They justify a decision by reciting the SOLID principles, and they may even close their eyes to show that they are performing an incredible feat of recall from memory as they do so. I know, it's annoying. But are you going to replace _all_ your `map`s with `for`-loops? Are you really _that_ much of an atheist?

## Opinions

This brings me to [a blog post from a few years back](https://www.sandimetz.com/blog/2016/1/20/the-wrong-abstraction), which expands on the advice:

> prefer duplication over the wrong abstraction

Clearly the wrong abstraction is... well, wrong. And it becomes clear that Metz is not talking about abstractions that call out to you and feel like they have independent existence. He's referring to the situation where we spot two copies of the same code, pull it out into one copy and give it a name. Naming things is hard, so we could make a terrible mistake at this stage, but otherwise it's little model of the birth of every single abstraction that has ever been created.

The real problem is what happens later:

> Programmer B feels honor-bound to retain the existing abstraction, but since isn't exactly the same for every case, they alter the code to take a parameter, and then add logic to conditionally do the right thing based on the value of that parameter.

Consider `map`. Sometimes we want to omit some items from the output list. We could arrange this by having `map` discard `null`s, so we can write the little lambda to return `null` for any items we don't need. But what about other uses of `map` where we need to be able to retain `null`s? No problem, just add a new parameter to `map`, a boolean flag called `discardNulls`. This is easy! Also sometimes we want to product _multiple_ output items from a single input. We could get `map` to accept a function that optionally returns arrays of outputs, and have `map` flatten all those little arrays into one single output array. But again, what if sometimes we want to keep the individual arrays? No problem, just add a new boolean parameter called `flattenArrays`...

Fortunately someone already went on this journey for us, so we know the right answer is to leave `map` alone and invent `filter` and `flatMap`. Though actually we could re-write `map` to use `flatMap`.

```js
map(f) {
    return this.flapMap(i => [f(i)]);x
}
```

Similarly `filter` would use `map` to produce either a one-item array or an empty array for each input:

```js
filter(f) {
    return this.flapMap(i => f(i) ? [i] : []);
}
```

It's likely that for performance reasons (and because these operations are so simple and permanent anyway) no JS runtime internally works that way, but nevertheless it's a microcosmic example of how abstractions can layer on top of each other. It's also an example of a situation where you may not bother to layer them, and that is also instructive. Sometimes it just ain't worth it. The result may be shorter, but less easy to understand.

Assuming there is some existing abstraction that seems tantalisingly close to what we need, burdening it with new responsibilities is usually the wrong thing to do. On the other hand, _removing_ responsibilities can make it more general, and thus applicable to more situations, and therefore _less likely to need changes in future_, without making it more complex. That way you avoid those accumulations of bug-prone knotiness.

Another [more recent blog post](https://overreacted.io/goodbye-clean-code/) by Dan Abramov touched on the same topics. He told quite a sad story of a confrontational moment, and he berates his younger self. I'd say he goes too far in doing so. I'm going to stick up for Abramov the Younger. If you're writing an editor that shows little handles we can drag to resize objects, then it should not be at all controversial to assert that _handles are a thing_.

It's possible he did something really bad with this idea. Maybe he imposed a grand structure full of assumptions? From the elided snippets it's not clear. He says:

> For example, we later needed many special cases and behaviors for different handles on different shapes. My abstraction would have to become several times more convoluted to afford that, whereas with the original “messy” version such changes stayed easy as cake.

So it may be that with his changes, the whole editor became too aware of a specific way of implementing handles in terms of orthogonal edges and their intersections, making it impossible to add some weird new shape (a free-hand polygon?) without first shoehorning it into an inappropriate boxy straightjacket.

If the original approach was superior in this regard, it must have been by making fewer assumptions. The snippets don't suggest this, but I'd guess the editor would need a way of delegating the handling of mouse events down to the shapes, and of delegating the process of painting the UI of the shape. That is, shape types are polymorphic extensions to a system that knows nothing of their internal details, and doesn't force them to implement handles at all, let alone in a particular way. A shape can basically do whatever it wants. This is a subtle point, but a crucial one. Such an editing system is more general, knows less, and allows a wider range of ideas to live within it and cooperate with each other.

That way, you can create a helpful way to implement handles that has applicability to certain limited situations, and the shapes that use it will be easier to understand, because their code will have the same structure as their UI. The very same things we can directly manipulate on the screen will also exist in the code, in an immediately familiar and recognisable way.

Of course, this hardly needs explaining to anyone from the React team, authors as they are of a framework predicated on the value of defining your own little vocabulary of nestable abstractions that relate directly to things that appear in the UI. React's tutorials do not tell you to copy and paste the same mess of JSX elements fifty times, for obvious reasons.

Even so, Abramov seems to have taken this one bruising encounter and concluded that "abstractions" themselves are the problem. He derides the inventing of abstractions as a phase we all go through before we grow out of it, a self-deception, almost a psychological condition stemming from youthful insecurity.

Was the inventor of `map` also driven by an obsessive urge to feel self-worth? Who can say. But we can surely be glad they invented it, and in the end, they did it by spotting some noisy boilerplate code cropping up everywhere and abstracting out a simple, helpful _thing_.

## Who Are You Calling Dirty?

So there is something else going on here, and [I think this take](https://dev.to/d_ir/clean-code-dirty-code-human-code-6nm) is on to something: the ridiculous word _clean_. It's not explanatory, it's just a terrible value-laden way to start a conversation with a coworker. "Look, I had to clean up the mess you made" is openly provocative.

So it's possible that when people complain about abstractions, they're talking about one of two things:

-   Trying to make something "more reusable" by increasing its complexity, which is sort of the exact opposite of how to do that.
-   Suggesting changes to code written by others in a way that will make them react explosively.

Both of these will lead to bad experiences, but they can be avoided without abandoning the idea of collaborative abstraction-building, which, in the end, is all we are doing. Every software product is an abstraction, composed of abstractions, composed of yet more abstractions. It's abstractions all the way down, and we have to invent them together as teams, and help each other as best we can.

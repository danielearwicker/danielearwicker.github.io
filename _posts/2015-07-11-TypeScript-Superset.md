---
tags: typescript
date: 2015-07-11
title: TypeScript is not really a superset of JavaScript and that is a Good Thing
layout: post
---

Questions:

-   What does it mean for a programming language to be a superset of another programming language?
-   What's a programming language?
-   What's a program?

In this discussion, a program, regardless of language, is a **stream of characters**.

If you generated a random stream of characters, it might be a valid program in some hypothetical language, just as the arrangement of stars in the
night sky as viewed from Earth might happen to spell out an **insulting message** in some alien language we'll never know about.

So a programming language is both:

-   the rules for deciding whether a given stream of characters is a valid program, from that language's point of view, and,
-   the **set of valid programs**, because they are streams of characters that conform to those rules.

It's the second (slightly surprising) formulation we're interested in here, because it means that when we say "language A is a superset of language
B", we mean that A and B are sets of programs, and set A includes all the programs in set B. This is useful information, because it means all the
programs we wrote in language B can immediately used in language A, without us needing to change them.

People get very muddled about this, because they think of the programming language as a set of rules instead of a set of programs, and therefore
assume that a superset would include all the rules of the subset language, plus some extra rules. This could make it stricter, rejecting some
previously valid programs, or it could make it looser, allowing new syntactic forms. So without knowing the details of the extra rules in question,
we wouldn't know what's happened.

So the "set of rules" sense is far less useful than the "set of programs" sense, which does actually tell us something about the compatibility
between the languages.

The most common statement in introductions and tutorials about TypeScript is that it is a superset of JavaScript. Really? Here's a valid
JavaScript program:

```typescript
var x = 5;
x = "hello";
```

Rename it to `.ts` and compile it with `tsc` and you'll get an error message:

    Type 'string' is not assignable to type 'number'.

We can fix it though:

```typescript
var x: any = "hello";
x = 5;
```

We've stopped the compiler from inferring that `x` is specifically a `string` variable just because that's what we initialised it with. Plain
JavaScript can be **retro-imagined** as a version of TypeScript that assumes every variable is of type `any`.

In any case, one example is sufficient to show that TypeScript is not a superset of JavaScript in the more useful "set of valid programs" sense,
and it seems we've found one. Except it's a bit murkier than that.

If you looked in the folder containing your source file right after you tried to compile the "broken" version, you would have found an output
`.js` file that the TypeScript compiler had generated quite happily.

TypeScript makes your source **jump over two hurdles**:

1. Is it good enough to produce JavaScript output?
2. Does it pass type checks?

If your source clears the first hurdle, you get a runnable JavaScript program as output _even if it doesn't clear the second hurdle_. This
quirk allows TypeScript to claim to be a superset of JavaScript in the set-of-programs sense.

But I'm not sure it counts for much. Is anyone seriously going to release a product or publish a site when it has type errors in compilation?
They wouldn't be getting any value from TypeScript (over any ES6 transpiler such as Babel). The compiler has a couple of switches that really
should be enabled in any serious project:

-   `--noEmitOnError` - require both hurdles to be cleared (the word "error" here refers to type errors).
-   `--noImplicitAny` - when type inference can't deduce something more specific than `any`, halt the compilation.

If you're going to use TypeScript (_hint: you are_) then use it properly.

And in that case, it is not a superset of JavaScript. And this is a **Good Thing**. The whole point is that existing JavaScript programs, due
to the language's dynamically typed looseness, very often contain mistakes that would be trapped by TypeScript. The example above, where a
variable is reused for different types, might be a mistake but might not (in performance terms, it's probably a mistake in that it stops
modern JS runtimes from optimising code that accesses the variable).

When we want to use JavaScript, unchanged, as part of a TypeScript project, we just leave it as JavaScript and wrap it in `d.ts` declarations.
It's no big deal. You only change the extension to `.ts` because you want it to be more rigorously checked, so you know that the types make
sense all the way down into the nitty gritty.

The parallel with **C++'s relationship to C** is striking. In C (specifically, ANSI C prior to the 1999 standard) it was not necessary to
declare a function before you called it. In C++ it became mandatory. This - amongst other differences - meant that C++ was never a superset
of C.

But this didn't matter too much, because C++ was a superset of **well-written** C - to the extent that every C example in the 2nd edition
of [K&amp;R](https://en.wikipedia.org/wiki/The_C_Programming_Language) was valid C++.

So TypeScript, in any meaningful sense, is not a superset of JavaScript, but this is nothing to get hung up over; if it were a superset of
JavaScript, it would be considerably less useful.

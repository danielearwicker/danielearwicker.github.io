---
tags: typescript
date: 2017-01-01
layout: post
title: TypeScript - What's up with this?
---

JavaScript's `this` keyword is horrible. The value it assumes inside a function depends on precisely how the function is called:

```js
// node has 'global', browsers don't
if (typeof global === "undefined") {
    window.global = window;
}

function f() {
    console.log(this === o, this === global, this === undefined);
}

const o = { f };

f();
o.f();
o["f"]();

const f2 = o.f;
f2();
```

This prints the following:

```
false true false
true false false
true false false
false true false
```

Unless you prefix it with `"use strict";` which gives:

```
false false true
true false false
true false false
false false true
```

Clearly the designers of strict mode felt there was a problem with `this` referring to the global object sometimes, and I'd have to agree with them. At least when it's `undefined` you have a chance of spotting a problem!

The pain here is that a function is written to assume something about `this`. To put it in TypeScript terms, the type signature of a method (i.e. a function designed to be called on an object) is fundamentally different from a free function.

TypeScript initially punted on this problem entirely. The type of `f` in the above example is `() => void`. But if `f`'s body assumes `this` is some object, then `o.f` as a whole might be `() => void` whereas `f` on its own is definitely not. A free-standing `f`, while implemented by the JS runtime as a `"function"` object, is not yet a function. It needs to be bound to an object. This can be done by calling `bind` on it, or by assigning it as the property of a suitable object.

Even more confusingly, the statement `const f2 = o.f;` copies the value of an expression of type `() => void` into a variable that, by itself, is not `() => void`! This is just how JavaScript works.

There is a way of writing JavaScript (and TypeScript) that eliminates this problem: don't use `this`. Create objects as literals, without prototypes:

```ts
function vector(x: number, y: number) {
    return {
        get x() {
            return x;
        },
        get y() {
            return y;
        },
        length() {
            return Math.sqrt(x * x + y * y);
        },
    };
}
```

For objects with large numbers of properties, created in large numbers, this theoretically is wasteful. It might also defeat optimisations in JS runtimes. In any case, classes are one of the "cool" (?) features in modern JS and TypeScript, so unfortunately they are probably widely used, and because they define methods on the prototype they depend on `this`.

This means that a simple demo of classes in TypeScript has a trap door waiting in it:

```ts
class Vector {
    constructor(public x: number, public y: number) {}

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

const v = new Vector(3, 4);

console.log(v.length()); // Prints: 5

const l = v.length;

console.log(l()); // Runtime error: Cannot read property 'x' of undefined
```

The compiler finds no type error in that example, because `v.length` has the type `() => number`. To a C# coder it looks fine (in C# the expression `v.length` automatically does the equivalent of `v.length.bind(v)`).

A separate problem is that the type of `this` in a free function is `any`. This is the case even if `--noImplicitAny` is specified!

But TypeScript continues to advance rapidly. We now have `--noImplicitThis` to add to the growing list of "super strict mode" compiler switches, under which the use of `this` in a free function will cause a type error.

```json
{
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "strictNullChecks": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
}
```

More excitingly, we can say this:

```ts
interface I {
    f(this: I): void;
}

function f(this: I) {
    console.log(this === o, this === undefined);
}

const o = { f }; // of type I
```

Now, just as we'd want, the type of `f` ensure it is not callable by itself:

```ts
f(); // The 'this' context of type 'void' is not assignable to method's 'this' of type 'I'.
```

It can only be called when preceded correctly by an object that conforms to `I`:

```ts
o.f(); // All good
```

So we can fix our class example:

```ts
class Vector {
    constructor(public x: number, public y: number) {}

    length(this: this) {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}
```

It now gives a compile-time error when we try to call through a free copy of `v.length`.

But this seems a bit strange. As `length` is a method of `Vector`, why not assume that it requires `this` to be the enclosing class type? Why require it to be explicitly stated?

[The original plan](https://github.com/Microsoft/TypeScript/pull/6739) was to add a flag `--strictThis` that would have made that exact assumption. It would also have applied a neat rule-of-thumb to interface declarations:

```ts
interface I {
    f: (n: number) => number; // this: void
    m(n: number): number; // this: this
}
```

In other words, if the functions available in the interface are fully bound and don't require `this`, declare them as a property of a function type, rather than a method.

But that change would have implied potentially rewriting a lot of the type definition files on [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped), so they would be helpful to anyone using the `--strictThis` flag (i.e. to reduce their tendency to break in existing code).

And would this actually block all type holes? Suppose anything with a `length` method is described as `Measurable`:

```ts
interface Measurable {
    length(this: this): number;
}
```

I've explicitly typed `this` to simulate what `--strictThis` would have assumed. Would our `Vector` class be compatible with `Measurable`? Yes (this is true in TS 2.1 anyway, and how else would such an interface be useful?)

But that means we have a type hole:

```ts
const v: Measurable = new Vector(3, 4);
const m = { length: v.length };
console.log(m.length()); // Prints: NaN
```

`v` is a `Vector`, which means it is also a `Measurable`, so we declare that to be its type. But if we treat it as a `Measurable` then we're saying that its `length` method could be called on _any_ `Measurable`.

For `Vector`'s version of `length` to work, `this` must be something that has `x` and `y` properties. It can't be just anything that has a `length` method. When I create `m` I satisfy the interface `Measurable`, but that's not enough to satisfy `Vector#length`.

Fundamentally, the implementer of an interface has different requirements to the caller. The caller wants the length, the implementer wants the information from which the length can be calculated. We can't fix it with:

```ts
interface Measurable {
    length(this: Vector): number;
}
```

because now it can't be usefully implemented by anything else. Okay, so maybe an interface method shouldn't have type `this: this`, but instead should have a special type that makes it illegal to do anything with it except call it. It would not be possible to read its value.

But for now these are open questions. TypeScript's usefulness isn't harmed by any of this. Absolute soundness, as if it was a Platonic ideal of which languages choose to implement some portion, like setting a dial somewhere between 0% (JavaScript) and 100% (Java), is a myth.

In reality type systems are tastefully chosen collections of composable features for describing and checking facts about code. New features may be invented at any time, based on widespread usage patterns. So a type system is never "complete", though there may be a kind of truce where users learn to stick to patterns that the type system can describe. TypeScript is unlikely to have that luxury because it aims to describe patterns being actively invented by JavaScript users.

As TypeScript grows in power, gaining such features, it becomes more capable of describing and checking a wider variety of patterns, but also harder to learn. It's a trade off, like everything else.

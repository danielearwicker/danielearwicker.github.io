---
tags: typescript
date: 2016-03-13
title: TypeScript multicast functions
layout: post
---

Just as in JavaScript, C# functions are first class entities - you can pass them around in variables. There are two ways that C# differs
from JavaScript.

1. a method's `this` reference is automatically bound to the object it belongs to. In JS a "method" is just an object property that happens
   to contain a function. If copied into a separate variable and then called, there may or may not be a problem depending on whether the
   function internally refers to `this`.

2. a function value (known as a "delegate") has operators `+`, `-`, `+=`, `-=` that allow it to be combined with other compatible functions
   to create a new single function that, when invoked, causes the constituent functions to be invoked.

The second one is what I'm interested in today, mainly because it's a nice example of something that we can strongly type check in
TypeScript. Internally (at the "plumbing" level) we have to bypass type checks, but externally we can guarantee everything will work.

[Browse the source code](https://github.com/danielearwicker/multicast)

A `multicast<TFunc>` is a function whose type is the intersection of `TFunc` and some methods called `add` and `remove`. To declare it,
we have to say:

```typescript
interface Subscribable<TFunc extends Function> {
    add(handler: TFunc): Multicast<TFunc>;
    remove(handler: TFunc): Multicast<TFunc>;
}

type Multicast<TFunc extends Function> = Subscribable<TFunc> & TFunc;
```

This is a neat trick, but it seems odd that we can't say:

```typescript
interface Multicast<TFunc extends Function> extends TFunc {
    add(handler: TFunc): Multicast<TFunc>;
    remove(handler: TFunc): Multicast<TFunc>;
}
```

TypeScript currently won't let an interface extend one of its type parameters. But the first snippet achieves the same thing by
roundabout means, so it seems to be just a curious historical limitation and maybe it will be lifted in a future version of the
compiler (it's evolving so fast).

In short, the `&` operator ("intersection of types") allows two types to be merged: it outputs a type that has the capabilities
of both input types. This is a vague way of saying it, and it makes "intersection" seem like the wrong name: an intersection is
the (usually smaller) subset of items common to two (usually larger) sets. It's the little bit that overlaps. And yet here we're
making a type that is "bigger" than the two inputs. To be more precise we need to do exactly the same mental switcheroo I
described in [TypeScript is not really a superset of JavaScript and that is a Good Thing](../../2015/TypeScript-Superset/): a type can be thought of as the set
of values that are of that type. Thinking of it that way, only a subset of the values of type `A` will also be values of type
`B`. So we are indeed talking about an intersection: of two sets of _values_.

The end product is a function that, as well as being directly callable, also has a couple of methods, `add` and `remove`, tacked onto it. Note that they each return a `Multicast` of exactly the same type; this is because (like C# delegates) I've made them immutable: you can't change what's on the list of an existing `Multicast`, but you can get a new `Multicast` with whatever alteration you require.

The implementation works by defining an object that implements `Subscribable`, and then "merging" it onto a forwarding function.

```typescript
export default function multicast<TFunc extends Function>(
    ...handlers: TFunc[]
): Multicast<TFunc> {
    handlers = handlers;

    const subscribable: Subscribable<TFunc> = {
        add(handler) {
            return multicast(...handlers.concat(handler));
        },
        remove(handler) {
            return multicast(...handlers.filter((h) => h !== handler));
        },
    };

    const invoke: TFunc = ((...args: any[]) => {
        let result: any;
        handlers.forEach((handler) => (result = handler.apply(null, args)));
        return result;
    }) as any;

    return merge(invoke, subscribable);
}
```

Note the two different uses of the [spread operator](https://basarat.gitbooks.io/typescript/content/docs/spread-operator.html).
First for handlers (you can pass any number of compatible functions as arguments to `multicast` to get them all joined together),
and this lets us do immutable array manipulation (`concat`, `filter`) to create further calls to `multicast` when implementing
`add` and `remove`.

Second, the ugly part: `invoke`. This is the basis of the function object we will return. It is basically completely
untypechecked (note the `as any`!) But at the same time, it implements `TFunc` by calling on to handlers that implement `TFunc`,
so it is type safe.

Note how discards all but the last return value. It would be nice if we could specify a custom reducer function:

```typescript
(a: TReturn, b: TReturn) => TReturn;
```

That would allow the user to request that return values should be summed, etc.

But TypeScript doesn't give us a way to find out the return type of a function type. It would be really powerful if we could
discover "traits" about a type (a C++ idea) like that. Another example would be getting a tuple type of the parameters to a
function type. And what if we could construct a new function type out of such pieces? Then we could do things like wrapping
the return type in a promise. This would be useful for solving problems like making a promise-enabled version of any node.js
style callback API. But I digress.

One final piece of the implementation is the `merge` call right at the end. This is the classic:

```typescript
export default function merge<T1, T2>(onto: T1, from: T2): T1 & T2 {
    if (typeof from !== "object" || from instanceof Array) {
        throw new Error("merge: 'from' must be an ordinary object");
    }
    Object.keys(from).forEach(
        (key) => ((onto as any)[key] = (from as any)[key])
    );
    return onto as T1 & T2;
}
```

As you can see, even this is not without its subtleties. It is a mutating operation (ugh) but that's because it's a low-level
building block. It copies the properties of its second parameter onto its first. As long as the second parameter is a simple
object then this is sufficient to make the first parameter gain the type of the second, thus honouring our claim to be
returning `T1 & T2`. But there isn't (as far as I know) a way to specify that `T2` must be a simple object in that sense, hence
the runtime check. The user might pass two functions, for example. That's no good, as merging two functions can be a tricky
problem even when you know what parameters they accept; if they could be _any_ old functions then you are out of luck. JavaScript
functions don't have "typed" parameters, so how can you decide which of the two input functions to dispatch a call to? Given this,
[I wonder why it is even possible](https://github.com/Microsoft/TypeScript/issues/7494) for `A & B` to get past the compiler if
both `A` and `B` are functions.

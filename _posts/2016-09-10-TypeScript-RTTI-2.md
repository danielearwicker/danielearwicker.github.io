---
tags: typescript
date: 2016-09-10
layout: post
title: TypeScript and runtime typing - EPISODE II
---

_Prompted by [a revealing comment from Anders Hejlsberg](https://github.com/Microsoft/TypeScript/pull/10676#issuecomment-245653348)._

Something wonderful happened between `typescript@beta` and `typescript@rc` (i.e. just in time for version 2.0).

Way, way back in TypeScript 1.8 (February 2016!) we gained the ability to use string literals as types:

```ts
const str1: "hello" = "hello"; // fine
const str2: "hello" = "goodbye"; // type error
const str3: string = str1; // fine
```

The variables `str1` and `str2` are not just typed as `string`; they have to be specific strings. They are also of type `string`, so they are a sub-type of `string`, sort-of `T extends string`, that can only have one possible value (if we're not including `null | undefined`, and nor should we in 2.0).

A type that can only have one value might seem useless until you realise it's a building block. You can combine several in a union type and so you instantly have string-enums:

```ts
type Fruit = "lychee" | "tomato" | "kumquat";
```

But what got me excited was the potential to use these as another route to dynamic type information. If some data type were to be somehow stamped with a string literal, it would be necessary to initialise it with an instance of the same string, meaning we'd have matching information at compile time and runtime.

But I hit a slight irritation. Although it was possible to build interesting libraries around this idea, there was no way to avoid the phenomenon seen in the above snippet, where I had to state the string twice:

```ts
const str1: "hello" = "hello";
```

I know what you're thinking: can't we make up a helper function that takes a string argument and captures its specific type?

```ts
function name<T>(name: T) {
    return name;
}
```

Nope, that doesn't work: `name("Bart")` returns a boring old plain `string`. We're forced to use the ultra-lame:

```ts
name<"Bart">("Bart");
```

which defeats the whole purpose of the helper function, avoiding the repetition (yes, it's perfectly type-safe, in that we are required to write the same thing twice, but then why should we have to?). Okay, how about:

```ts
function name<T extends string>(name: T) {
    return name;
}
```

After all, that's a big hint that `T` is a type that we can't specify in advance but which must also be a string; what else could we mean by this apart from "We want to know which specific string"? But no, I tried it already and it didn't work.

**UNTIL NOW!**

In TypeScript 2.0, the `T extends string` idiom will indeed serve as a hint to the compiler that we want to preserve the specific string literal type. Yes, this is a breaking change, but 2.0 is a new major version so... go nuts. Try this in `typescript@beta`:

```ts
let n = name("Bart");
n = "Lisa";
```

It won't bat an eyelid (unless things have moved on by the time you're reading this, in which case use `typescript@1.8`). Then try it with `typescript@rc` and rejoice at the lovely type error:

```
Type '"Lisa"' is not assignable to type '"Bart"'
```

So, armed with this we can now do some quite smart things, especially when it comes to frameworks that already use user-chosen strings as type discriminators. One (deservedly) trendy example is Redux, and I'm having much fun thinking about how I might want to use it "at scale".

**Case study**: [Immuto - Strongly Typed Redux Composition](../Immuto)

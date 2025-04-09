---
tags: typescript
date: 2016-09-11
layout: post
title: TypeScript - What is a class?
---

In TypeScript, a class is really two types and a function. One type is the type of the function itself, and the other type is the type of the object returned when you call the function. Try this:

```ts
class C {
    foo() {}
}

const c1: typeof C = C;
const c2: C = new C();
const c3: C = C;
```

Note that `c3` is a type error. `C` is not of type `C`. `C` is a function, a named object that exists at runtime, and like any identifier its type can be written as `typeof C`, so `c1` has to work. But at compile time, `C` is an interface, conformed to by the object we get back from `new C()`, so that's why `c2` works.

Interfaces are used in TypeScript to describe anything that has properties. In JavaScript a function can have properties of its own, so the definitive way to describe a function is with an interface. This lambda-like style:

```ts
type F = (arg1: number, arg2: string) => string;
```

is an abbreviation for:

```ts
interface F {
    (arg1: number, arg2: string): string;
}
```

It looks just like a method, except without a name. So if we have `f` that implements `F`, we can directly call it:

```ts
f(5, "hi");
```

But it may be that we can also say `f.blah()`, because `F` also has a `blah` property that happens to be another function:

```ts
interface F {
    (num: number, str: string): { num: number; str: string };
    blah(): void;
}
```

Another thing we can only do with the `interface` style of function-type is to define multiple ways to call the function:

```ts
interface F {
    (num: number, str: string): { num: number; str: string };
    (num: number): boolean;
}
```

And finally (especially relevant here), we can say that the function must be called with the `new` prefix:

```ts
interface F {
    new (num: number, str: string): { num: number; str: string };
}
```

Though we can also do that with the lambda-like version:

```ts
type F = new (num: number, str: string) => { num: number; str: string };
```

Putting these pieces together, suppose we have class

```ts
class C {
    i = 5;
    static s = "hi";
}

// Usage:
console.log(C.s);
console.log(new C().i);
```

We can completely describe the type of `C` "by hand" like this:

```ts
interface TypeOfC {
    new (): {
        i: number;
    };

    s: string;
}
```

So `TypeOfC` describes a `new`-able function, because we declare that it has `new`-able function with no name. `s` is a property of the function, whereas `i` is a property of the objects created when you call the function.

We can declare a `const` of type `TypeOfC` and assign `C` to it:

```
// Compatible:
const c2: TypeOfC = C;

// Usage:
console.log(c2.s);
console.log(new c2().i);
```

Now, we can abbreviate our `TypeOfC` re-declaration because TypeScript already gives a name to the type returned from the function: it's called `C`:

```ts
interface TypeOfC {
    new (): C;
    s: string;
}
```

Recall what we established right at the start: when you write a class `C`, you give two meanings to that name. In the namespace of types, you create a type `C` that describes the objects returned by `new C()`. In the namespace of runtime objects, you create a function `C`. TypeScript never confuses the two meanings because every spot in your code is unambiguously referring to either a compile-time type or a runtime object.

And we don't need to declare `TypeOfC` at all, because we can just use TypeScript's built-in feature for getting the type of a named object: `typeof C`. In JavaScript, `typeof` takes an expression and returns a string describing its type (to an extent...) In TypeScript that is still exactly the same, of course, but also `typeof` can be used in type declarations to get the type of an expression.

Hence:

```
// Compatible:
const c2: typeof C = C;

// Usage:
console.log(c2.s);
console.log(new c2().i);
```

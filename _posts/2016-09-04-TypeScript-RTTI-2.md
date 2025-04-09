---
tags: typescript
date: 2016-09-04
layout: post
title: TypeScript and runtime typing
---

_Prompted by [this question on Reddit](https://www.reddit.com/r/typescript/comments/50zj95/how_to_make_a_class_type/)._

> I'd want to declare a type that points to class extending another class. Please note, a CLASS not INSTANCE.
> I've tried something like this:
>
> `type EventClass = class extends Event;`
>
> `type Listener = (data: class extends Event) => void;`
>
> and later on:
>
> `private handlers: Map<EventClass,Listener[]>;`
>
> But unfortunately this syntax does not work. How I can declare a type that points to CLASS extending another CLASS?

You want a runtime value that specifies a type of event, so you can use it as the key in a `Map`.

In Java you'd use the `Class` class, in C# you'd use `Type`. These are runtime type representatives that reflect the compile time types (perfectly in C# thanks to reified generics, imperfectly in Java due to erased generics).

But TypeScript is just JavaScript with static typing added to it, in a way that tries to be of maximum usefulness in real-world JavaScript, as it is used.

It's not an attempt to recreate the environment (including runtime services) of any other language. Unfortunately there is no general runtime representation of a type in standard JavaScript.

The JavaScript `typeof` operator returns a string, and is only useful for primitives. The TypeScript `typeof` operator (which can only appear in type positions) has no effect on generated JavaScript, so there is no way to sneak that information into the runtime world.

But all is not lost. The JavaScript `instanceof` operator checks the constructor of an object's prototype. Assuming the pattern has been followed correctly (which it is if you use the `class` keyword to declare your types), an object created by `new C` can be said to be an `instanceof` class `C`. Note that `C` is just a function so it is an object at runtime.

Suppose you have:

```ts
class FoodEvent extends Event {
    flavour: string;
}

class SecurityEvent extends Event {
    threatLevel: number;
}
```

And here's all `Listener` can do:

```ts
type Listener = (data: Event) => void;
```

Note that saying `Event` in that context is sufficient to mean anything derived from `Event`, so you don't need a way to say that. This is standard OO polymorphism. (In TypeScript, which has structural typing, it actually means "anything with a compatible type shape".)

The types `FoodEvent` and `SecurityEvent` are also functions at runtime, so they can be stored in a variable:

```ts
const blah = FoodEvent; // works
```

How do we declare the type of such a function? In TypeScript we can write:

```ts
type Constructor<T> = {
    new (...args: any[]): T;
};
```

That is, a function that must be called with the `new` prefix, takes any number of arguments of whatever type, and returns something compatible with type `T`.

So now we can define our map of handlers (to shorten the example I've simplified it: a single `Listener` instead of an array of them.)

```ts
const handlers = new Map<Constructor<Event>, Listener>();
```

And I can then register a `Listener`:

```ts
handlers.set(FoodEvent, (data) => {
    // handle the food-related event
});
```

This isn't perfect because `data` is just of type `Event`. It has to be, of course. The key type of the `handlers` map has to be some general type - this is no different from Java or C#.

But we can create a helpful way to register a handler for a known type:

```ts
function setHandler<TEvent extends Event>(
    constructor: Constructor<TEvent>,
    handler: (data: TEvent) => void
) {
    handlers.set(constructor, handler);
}
```

This is where it becomes meaningful to talk about "a type that extends `Event`". We want a more specific type than `Event` so we can use it in the handler, but it must be compatible with `Event` so it fits with the map.

At first glance you might think this is no improvement because the constructor must be passed both as a runtime value as well as a type parameter. We have to repeat ourselves. Doesn't that leave a type hole?

But no! Type inference comes to the rescue:

```ts
setHandler(FoodEvent, (food) => {
    console.log(`Food flavour is ${food.flavour}`);
});

setHandler(SecurityEvent, (security) => {
    console.log(`Security threat-level is ${security.threatLevel}`);
});
```

We just specify the event constructor as a runtime parameter, and that is sufficient for TypeScript to "pull out" the return type of the constructor so we can constrain the handler's `data` parameter. So `food` is properly typed as `FoodEvent` etc.

It's a neat example of how TypeScript works strictly within the limits of the existing JavaScript infrastructure, and finds the stuff that works, and gives it full language support at compile time, instead of cooking up some new incompatible approach. TypeScript _is_ JavaScript, only with elegant and powerful static typing added.

**Advanced Note**: there's something weird about our `setHandler` function. The implementation is just:

    handlers.set(constructor, handler);

Now, `handler` is of type `(data: TEvent) => void`, that is: a function that takes a `TEvent`. But we're passing it to the `set` method, which in this case is of type `Listener`, which is just an alias for `(data: Event) => void`. Notice anything strange?

Here it is broken into steps:

```ts
function myFoodHandler(food: FoodEvent) {
    console.log(`Food flavour is ${food.flavour}`);
}

let whateverHandler: (data: Event) => void;

whateverHandler = myFoodHandler; // This is the strange part!

const evt: Event = whateverHandler(evt); // ... get an event...
```

We can pass any old `Event` when we call through `whateverHandler`. And yet we're able to assign to it a function that expects to receive a specific derived type of `Event`! That assignment is breaking the rules. TypeScript allows this deliberately. It's unsound by design, in this particular situation, on the basis that this kind of incompatibility rarely leads to bugs and it would be hard to explain to users if the language was rigidly sound.

It certainly doesn't cause us a problem in this case, because we've wrapped the `Map` in a type-safe helper. But it is worth bearing in mind that this is one kind of type error that TypeScript prefers not to catch.

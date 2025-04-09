---
tags: C#
date: 2019-11-24
layout: post
title: Unfortunate Bifurcations
---

Although this is going to seem like a series of picky complaints about C#, really it's about how any language has to evolve, and is a compromise between past and future, and the whole thing is quite difficult.

Also some speculation on what the future of language interoperability will be.

The kind of problem I'm going to pick on is where languages separate two concepts and treat them differently, making a virtue of the differences, but then it becomes a pain dealing with them generically. The language designers seem to be saying "You shouldn't need to treat these two things the same; they're fundamentally different. You're doing it all wrong!" And yet...

Java did this with its separation between:

-   user-defined (and standard library) types, known as classes, whose objects are _referred to_ by variables known as references, and can be aliased (that is, more than one variable can refer to the same object), and have no built-in way of being copied, and (as a technical detail) are garbage collected. Assignment always means "copy the identity so as to refer to the same object", and equality means "same object?"
-   primitive built-in types such as `boolean` and various numeric ones that are always owned by a single variable or field, and can all be copied. They either live on the stack or inside another object. Assignment means "copy the value" and equality means "same value?"

It seems at first that I can use either as the type of a variable, or a parameter, or a returned value, so they're there are a lot of places where they are interchangeable, but these ultimately fall apart in various annoying ways. I can define my own types for objects that can be aliased, but not if I want to create an object that can't be aliased. There is further pain when dealing with generics. Only class types can be used as type parameters. Primitives have to be _boxed_ (stored inside a wrapper object of class type), so every primitive has a corresponding box type. This damages performance enough that most general purpose libraries have to provide [primitive-specific specialisations of their classes](https://docs.oracle.com/javase/8/docs/api/java/util/stream/IntStream.html). The infection even [spreads into other languages that target the JVM](https://twitter.com/kotlin/status/1195295424963235840).

The language automatically coerces primitives to their box type where it can, but [this can lead to strange problems](https://stackoverflow.com/a/5199418/27423) due to the different meaning of equality for class and primitive types, and some unfortunate details of how auto-boxing works.

C# improved on this situation a lot. With its `struct` keyword it lets you define your own compound types that work just like primitives, and collectively they are all known as _value_ types. Auto-boxing is a lot more seamless. Also you can define what the `==` operation means on your types, which can be used to hide the differences. Finally, it did a much better job with generics, eliminating most needs for boxing and hand-maintained specialisations.

Generics provide us with a way to be abstract about certain details. Suppose we want to capture the pattern of retrying operations. A basic example:

```cs
var answer = Util.Retry(() => GetTheAnswer());
```

That `Retry` method calls the operation passed into it until it succeeds without throwing, and passed back the result. What type is the parameter to `Retry`? It needs to return a value, so it's going to be `Func<T>`. C# will infer the `T` from my usage, so `answer` ends up having the same type as is returned by `GetTheAnswer`. Neat.

The efficient way to deal with values of primitive types is likely to be different to that for handling reference types, but this detail is hidden from us in C# - the JIT automatically produces one instance of directly executable machine code to be used for all reference types in place of `T`, and then one further instance for every value type we use. This expansion _isn't_ done by the C# compiler, which just has to produce a single generic version of the [CIL bytecode](https://en.wikipedia.org/wiki/Common_Intermediate_Language).

How about:

```cs
Util.Retry(() => CauseTheSideEffect());
```

Same idea, but now I don't need a return value, because `CauseTheSideEffect` "returns" `void`. Is this going to work? `Retry` is going to be something like this:

```cs
T Retry<T>(Func<T> operation)
{
    for (int n = 4; n >= 0; n--)
    {
        try
        {
            return operation();
        }
        catch (x) when (x > 0)
        {
            // log x?
        }
    }
}
```

So we'd like `T` to be able to be `void`. It doesn't seem to be asking much, because we're never doing anything with `T` as a value; we just return it. It seems like the language could be lax about this and let a `return` statement precede a call to a `void` method inside another `void` method. [This is what C++ does.](https://www.geeksforgeeks.org/return-void-functions-c/).

But C++ can get away with this because it instantiates its version of generics (templates) by pretty much replaying your source code like a macro, so if `void` caused trouble somewhere inside the template's code this would produce an error message, often quite confusingly. C# doesn't work like that - it produces _one_ version of your code in CIL, and CIL uses a different instruction for calling a `void` method. This unfortunate bifurcation runs deep.

We can mask the problem by providing an overload like this:

```cs
void Retry(Action operation)
     => Retry(() =>
        {
            operation();
            return 0;
        });
```

The return value is arbitrary. And so in theory the C# compiler could allow us to use the underlying `Func<T>` version of `Retry` by noticing we aren't returning anything and therefore filling in the `return 0;` for us at the point of use. But obviously it shouldn't always do this, because it would weaken the compiler's ability to spot bugs, due to it silently passing dummy values into our code.

There are other bifurcations that are even more problematic. The worst is probably `async`/`await`. Extending our example:

```cs
var answer = await Util.Retry(() => GetTheAnswerAsync());
```

Now we have to re-write retry to accept a `Func<Task<T>>` and use `async`/`await` internally, and then restore our original synchronous version via a wrapper overload:

```cs
T Retry(Func<T> operation)
     => Retry(() => Task.FromResult(operation())).Result;
```

So we have to wrap the result of the inner `operation` in a `Task<T>` and then extract the `Result` on the outside. Thanks to the way `await` works this won't actually involve any hidden asynchrony: the inner `Task<T>` is already completed, so `await` doesn't try to yield control, and similarly the `Result` property doesn't need to `Wait`.

It's once you have two such bifurcations that things like `Retry` become tedious: you need _four_ overloads to cover every case.

With the addition of nullable references in C# 8 there is another nasty example, which is actually the old split between reference and value types coming back to bite us. Surprisingly, there is currently no way to express `T?` where `T` is any type, value or reference. Support for nullable value types has been in the language for a very long time, but they work very differently because for a value type adding support for an additional `null` state requires extra storage along side the value itself (and to get at the value requires you to look in the `Value` property). Reference types by contrast have always supported the special `null` value; what's being added now is the ability to constrain them so they (mostly) don't allow `null`, which is essentially a compile-time concept. So although the language seems to have a general concept of a nullable "thing", it really doesn't. It just uses the same `?` suffix syntax to denote the nullable variants of two entirely different things.

As a deliberately simple example consider the good old _Maybe_ monadic bind operator, popularly defined as `IsNotNull`:

```cs
public static TResult? IsNotNull<TArg, TResult>(
    this TArg? arg,
    Func<TArg, TResult> operation)
        where TArg : class
        where TResult : class
            => arg != null ? operation(arg) : null;
```

Note that I've had to constrain both `TArg` and `TResult` as being reference types (`where`... `class`). So to cover every possible combination of `struct` and `class` for the input and result, I need four overloads! But even worse, this time I can't cheat by making three of them into simple wrappers that call into a single implementation. A nullable reference type is really just a plain reference type in a compile-time disguise, where as a nullable value type is entirely different from its underlying value type at runtime. We have no choice but to copy and paste the code of our method four times, and make slight modifications to each case:

```cs
public static TResult? IsNotNull<TArg, TResult>(
    this TArg? arg,
    Func<TArg, TResult?> operation)
        where TArg : class
        where TResult : class
            => arg != null ? operation(arg) : null;

public static TResult? IsNotNull<TArg, TResult>(
    this TArg? arg,
    Func<TArg, TResult?> operation)
        where TArg : struct
        where TResult : class
            => arg != null ? operation(arg.Value) : null;

public static TResult? IsNotNull<TArg, TResult>(
    this TArg? arg,
    Func<TArg, TResult?> operation)
        where TArg : class
        where TResult : struct
            => arg != null ? operation(arg) : default;

public static TResult? IsNotNull<TArg, TResult>(
    this TArg? arg,
    Func<TArg, TResult?> operation)
        where TArg : struct
        where TResult : struct
            => arg != null ? operation(arg.Value) : default;
```

When we say `arg != null`, in half the cases (where `arg` is a value type) that's just sugar for `arg.HasValue`, but such sugar is non-existent when we need to get the value: we have to say `arg.Value`. Also when we want to substitute `null`, in half the cases (where the result is a value type) we have to use the `default` keyword, which is the 7.x abbreviation of `default(TResult?)` and means "`Nullable<TResult>` with no value".

If this was a less trivial example, it would be a genuine pain to maintain those four version. If you had to add another generic nullable parameter, it would double again the number of hand-maintained not-quite-the-same overloads required.

Now combine that with `async` versions of everything and you double the overloads again. See how these bifurcations get out hand - before you know it [you're in the second half of the chessboard.](https://en.wikipedia.org/wiki/Wheat_and_chessboard_problem#Second_half_of_the_chessboard) Okay, that's a slight exaggeration.

Anyway, this kind of evolutionary pain is why people start again with new languages. But I think the way forward is already indicated. The CLR is a runtime that is too opinionated and richly featured. This was intended to create a way forward so that a wide range of languages could share libraries with each other. When that happens, it will be utopia compared with today.

But the CLR isn't going to be the platform for that utopia. It was intended to be general enough to support all languages, but now even its flagship showcase language, C#, is showing the strain of supporting its real life users while constrained by the CLR's underlying model. Yes, it's better than the JVM, but that's a very low bar.

Meanwhile the last decade has seen runtimes for Javascript become so ingeniously self-optimising that they can compete with native code even for raw number crunching. There are 3D game engines written in JS. There are emulators for mainstream processors written in plain JS that [can boot actual operating systems in the browser](https://bellard.org/jslinux/) - nearly a decade ago this was done for a minimal Linux, but Windows 2000 is now there too.

WebAssembly in a sense grew out of such efforts, but it has only just started. At the moment it provides a sandbox within which an old-school native C/C++ codebase can freely scribble over its own patch of memory without causing wider damage. It does not yet define how a hosted language may expose fine grained objects that will be automatically garbage collected, and can have named members inside them, some of which may be callable. Hopefully when that step is taken, it will initially be as minimal and vague as possible, instead of (as the CLR did) trying to cover every possible approach with fine-grained features.

And then we will have a real breakthrough, because a wide range of languages will be able to move on to the super-fast JS runtimes and bring their libraries with them. We will be able to create data structures that lace together objects written in C#, JavaScript and Python, all to be collected by the same GC.

TypeScript has shown that a type system can be organically fitted over a very dynamic object model, and it can grow to meet user needs in ways that long ago left C# in the dust. I wonder if the future of C# lies in switching its home runtime from the CLR to JS.

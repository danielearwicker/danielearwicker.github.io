---
tags: languages c# java
date: 2023-03-07
layout: post
title: "Language Smackdown: Java vs. C#"
---

A pithy quote:

> There are only two kinds of languages: the ones people complain about and the ones nobody uses.

Now you might say that's exactly what the creator of C++ would say to cover his tracks. But the point is that Java and C# are languages that are 20 to 25 years old, widely used (maybe 15 million users between them), and are both cursed with toxic corporate associations. When Java first came along it was _cool_, if a programming language ever could be. But this was because the only Java code in the wild was neat little animations and things like that. As soon as it became widely used for boring line-of-business apps, it began to be thought of as the new COBOL.

But the corporate toxicity is the clincher. Microsoft, it is generally believed, only created C# because they couldn't find a way to take over Java without getting into further legal difficulties. Meanwhile Oracle is perhaps the only corporation that could rival Microsoft for historical unpopularity, and yet they found a way to take over Java, and happily continue creating legal difficulties for others.

But despite all this, Java and C# are worth studying, because they started off deliberately similar, and have diverged, and then somewhat reconverged, so we can see the same ideas being twisted in different directions. Two sort-of similar languages that have evolved separately are like different universes in the multiverse, and that's interesting.

Also, the way these languages are judged is quite irrational. Look at C, which remains hugely popular, widely used, a terrible choice for most applications, and ultimately originates from a corporation (AT&T) that wasn't allowed to sell it as a product as they were bound by an antitrust settlement.

# Two households, both alike in dignity

Even from the very beginning there were certain key differences that had long term consequences. C# had the advantage of being able to learn from Java, such that many of the [odd edge cases and pitfalls](http://www.javapuzzlers.com) that can occur in the earlier language are automatically ruled out.

Take for example Java's schism between primitives (`boolean`, `char`, `int`, `long`, `double`...) and everything else. Primitives fit into a little space so that's all they ever need to be: a patch of memory intepreted as a number. Whereas everything else, and that includes things as simple as a `String` or a nice `ComplexNumber` class, is far more complicated. A `String` variable holds the address of an object, and that object has a header that takes up a bunch of space, and multiple variables may point to the same object, which implies a decision has to be taken over when it's safe to throw away the object, so it has to be managed by GC. To be sure, all this stuff sounds worse than it is, and most of the time in most applications it doesn't matter a bit (which is why Java has millions of users despite all this).

But consider that `ComplexNumber`. Just to be extra unfair, let's say that on a 64-bit platform we're using two 32-bit `float`s (total 8 bytes), to which the Java runtime adds a standard header big enough to hold two pointers, so that is another 16 bytes. If you're storing a lot of these objects in memory, you might care that this has tripled your memory requirement. And you're probably holding them all in an array, or should I say "in" an array: the array doesn't store the objects, just their addresses, which means there's another 8 extra bytes per object. So 8 has become 32, and 75% of your memory is being used to store bureaucratic paperwork.

But C# has your back, because you can define your own primitives with the `struct` keyword and know that they are packed tightly into memory just like individual `float`s are. There's still a schism, because your type must be either `struct` or `class`. But the difference is somewhat papered over because at the root of the type system, "everything's an object". If you have a variable of type `object`, you can assign an instance of your `ComplexNumber` to it, through the miracle-kludge of automatic boxing: the language has the ability to treat a `struct` as if it were a `class`, where required (though not vice versa).

These things are likely to gradually make their way into Java over the next few years though:

-   [JEP 401: Primitive Classes](https://openjdk.java.net/jeps/401)

# `Episode<T>` - Generics

If you're thinking of designing the next great general purpose language with static typing, please remember to include generics in the first version and save yourself a world of pain. You _are_ going to add them, [even if you wait ten years](https://www.infoworld.com/article/3645228/go-118-arrives-with-much-anticipated-generics.html).

In due course, Java (2004) and C# (2005) got them, in a near simultaneous development. And yet they ways they went about it almost couldn't be more different. There's a [great write-up of the Java approach here](https://openjdk.java.net/projects/valhalla/design-notes/in-defense-of-erasure) but it's notably quite a defensive account, and it has to be, because there's a perception that, comparatively, C# "did it right". Java aimed to make it so that a class author could add `<T>` to the end of the class's name and still have the compiler produce a `.class` file that could be dynamically loaded by an application that was built before generics existed. This would allow generics to smoothly make their way into regular usage without breaking any applications.

But it imposed some fairly extreme limitations that persist today. You cannot use a primitive as a type argument, and you cannot find out anything much about generic types at runtime. Java introduced auto-boxing for primitives along similar lines to C#, but as noted above, this means that if you need to conserve memory when dealing with large quantities of primitive values, then you can forget about generics. C# avoids that problem entirely: you can say `MyClass<int>` and it will be like `int` is substituted everywhere that `T` appeared in the source. For value types, it's very reminiscent of C++ templates, but only in the good aspects.

As Brian Goetz tells it:

> C# made the opposite choice — to update their VM, and invalidate their existing libraries and all the user code that dependend [sic] on it. They could do this at the time because there was comparatively little C# code in the world; Java didn’t have this option at the time.

But this isn't really accurate. The get-out of entirely ignoring backward compatibility is a straw man, available to neither language. Certainly C# wasn't as well established as Java by 2005, but it was on a very fast upward curve, and this meant it was even less able to afford to alienate its early adopters. The result - at best - would have been a Python 2 versus 3 scenario, which clearly didn't happen, or a fatal crisis of confidence among users, which didn't happen either. To see why, you can do a little experiment (I actually did this):

-   Set up a C# 1.0 environment (I created, with some difficulty, a VM running Windows XP Service Pack 3 and installed Visual Studio .NET 2002.)
-   Write a class library with some static methods that accept/return `ArrayList` and `Hashtable` objects.
-   Build it and then copy the resulting DLL to your present day environment where you have .NET 6.
-   Run `dotnet new console` to create an app and make it depend on your ancient relic DLL: call the methods, print the return values etc.

You'll find that it loads and runs just fine. An assembly `.dll` produced by the very first version of the C# compiler is still supported _today_. It even works on Linux, or Mac OS on Apple silicon. All the non-generic collection classes that were in version 1 still exist in today's platform. So we can see that C# certainly didn't make the decision to invalidate their (or anyone else's) existing libraries or break binary compatibility at all. They made it possible for generic and non-generic classes to coexist side by side.

So what is the actual difference in Java's approach? If you use today's C# tools to build a class that uses generic collections and then send it back to your simulation of 2002, that old version of the runtime won't know what to do with it. The question is, did that ever really matter?

I'd say that Java's erasure approach placed the past on a pedestal, at the expense of the future. Generics are forever doomed to act like they don't exist, to avoid upsetting the code written during Java's first decade, and to the detriment of developers (and language designers) working in the subsequent two decades and beyond. The C# reification approach works like a compromise that doesn't materially harm either side of the equation: from the perspective of the future it looks very well designed and complete, and yet to the past it was sufficiently accommodating, if not perfectly so.

In C# objects genuinely know what type they are at runtime, and the reflection system provides a rich, explorable network of facts about how the types were generated. In Java, the reflection system is curiously stuck in the now distant past (well, almost; confusingly there are places in the reflection system that know about generics, but they are mostly stymied by erasure).

The irony is that after all that care taken by Java to appease the past, it eventually did have to adopt [a more aggressive attitude to upgrading itself](https://www.theregister.com/2019/03/07/java_developers_version_8/), requiring users to get accustomed to having to upgrade their package dependencies to some newer compatible combination [whenever they migrated to a new major version of the platform](https://carlmastrangelo.com/blog/the-impossible-java-11). This isn't actually as traumatic as it sounds, even though it does often involve code changes, and is the norm in most ecosystems.

What's perhaps a little worse is that because the use of erasure was so well known, and could therefore be depended on in code, it became commonplace for code to assume that a type parameter was always a reference type, based on `Object`, and therefore that it would be safe to allocate an `Object[]` and use it to store elements of a parameter type. This gets in the way of attempts to enhance the JVM to support allowing primitive type arguments in an efficient way. Also methods like `remove(Object item)` often retain that pre-2004 signature even for collections of `<T>`, which is pretty unhelpful; while it may not cause a type error at runtime, it can conceal a logical bug.

Again, there is work in the pipeline:

-   [JEP draft: Universal Generics](https://openjdk.java.net/jeps/8261529)

But it's focused purely on avoiding the performance bottleneck imposed by only supporting reference types; there's no plan to fully reify generics. There may be no way to do that now without creating a Python 2/3 style bifurcation.

# Iterating needn't be irritating

C# 1 included a neat feature: `foreach`. The equivalent appeared in Java 5, the same release that added generics. Strictly speaking it's only a near equivalent. An important part of the protocol for such a loop is dealing with the case where the user breaks out early:

```java
for (var joke : jokeBook) {
    if (inBadMood()) {
        break;
    }
}
```

In the equivalent statements in C# (and JavaScript for that matter), when we leave the loop there is a way to notify the iterator so it can dispose of any resources it might be using. The `IEnumerator<T>` interface derives from `IDisposable`, which introduces the `Dispose` method.

But this part of the iteration pattern is absent from Java. It was only added to C# in version 2, and perhaps not coincidentally this was at the same time C# gained iterator methods via `yield return`, another (truly awesome) feature that has an exact analog in JS and Python but not in Java.

# Java snoozes and loses

There seems to have been some kind of politically-imposed stagnation that stopped Java making any significant enhancements between 2005-2011, possibly due to a sense that if generics were anything to go by, "new" means "bad". Meanwhile during this period alone, C# gained, in addition to generics:

-   `yield return`
-   extension methods
-   lambdas
-   `var` (inference of local variable types)
-   anonymous types
-   query expressions
-   expression trees
-   auto properties
-   `dynamic`
-   out/in on type parameters
-   optional parameters and named arguments

This period fundamentally changed what idiomatic C# code looked like, so that it gained entirely its own style that couldn't be replicated in Java.

# The Java renaissance?

In 2011 some significant new features finally snuck in to Java, the most notable being the `try`-with-resources statement, because it very closely resembled the C# 1 feature the `using`-statement. It is accompanied by an `AutoCloseable` interface, which corresponds to the `IDisposable` interface of .NET.

This might have been an ideal time to make collection `for`-statement sniff the iterator for `AutoCloseable` so that iterators had a way to be notified in the event of an early `break` from the loop, but this didn't happen.

And after years of debate and delay, and against the wishes of a vocal subset of the user community, Java finally got lambdas, in its own way; again, the comparison is interesting. In C# there is the notion of a delegate, the type of something that can be called with `()`. Java resisted adding this, and instead noted that it is equivalent to an interface with one method (as long as it isn't a generic method). Consequently a lambda could be used to implement any such interface.

I really like this approach. Also it gives me a chance to complain about something that I think C# took in the wrong direction from the very start, and it's too late to fix now, which will help to even up the bias in this post so far.

I think using the function call `()` syntax directly on a type with one method should be equivalent to calling a method called `Invoke`, and that would remove the need for delegates to exist as a separate concept (this is so nearly the case; delegates do have methods, and one of them is `Invoke`.) This is an example of syntactic sugar compiling down to method calls, which is how many more recent features of C# work, but was underappreciated in the early days.

A major difference between C# and Java lambdas is their ability to close over local variables. Both can do this, but only C# lambdas can capture a local (or parameter) that is mutable. The compiler has to do something rather strange to achieve this, moving the local variables into fields of a hidden class so they can continue their independent existence after the stack frame has vanished. Java decided against this level of concealed complexity and instead just refuses to compile a lambda that refers to a local variable whose value ever changes. Note that this cannot be defended as an example of some principled refusal to deal with mutable data, because Java will quite happily allow a lambda to read mutable fields of a object stored in a captured local.

But as part of the same enhancement as lambdas, the tables were truly turned. Java did something it hadn't managed for about 20 years: it introduced a new feature that would later be copied by C#. This was default interface methods, originally known as [virtual extension methods](http://wiki.jvmlangsummit.com/images/7/71/2011_Goetz_Extension.pdf), which were needed for the same purpose as C# static extension methods, but they are objectively _better_.

A familiar problem when unit testing code that uses a package that includes extension methods is wanting to mock an interface, only to find that the method you're calling is actually an extension on the interface, so it can't be directly mocked. If only they'd used default interface methods! The same magic ability to make a new method appear on all existing implementations of an interface, but dispatch is properly polymorphic. But this excellent alternative wouldn't appear in C# until version 9.0, five years later.

# LINQ and streams

Here I'm conflating C# with the CLR, which these days is a reasonably safe thing to do. If you want to iterate through a collection you need something to represent the state of the iteration, and this needs to be an object distinct from the collection itself. In Java it's called an `Iterator<T>`, while in C# it's an `IEnumerator<T>`.

From this perspective a collection is a thing from which you can obtain one of these iteration states, presumably initialised to the start of the collection. And sure enough, in Java a collection implements `Iterable<T>` (with its `iterator` method that returns an `Iterator<T>` ) and in C# it implements `IEnumerable<T>` (with `GetEnumerator` that returns an `IEnumerator<T>`.) So far, so isomorphic.

But then the issue arises of how to provide helpful, composable operations on collections. The classic examples are `map`, `flatMap`, `filter` and `reduce`. In Java they have these exact names, where as in C# they are renamed `Select`, `SelectMany`, `Where` and `Aggregate`, by analogy with SQL (as if to put people off).

But the real distinction is in where these operations appear. In C#, which gained them in 2007, they appear as extensions on `IEnumerable<T>`, that is, on collections, whereas in Java, which waited until 2014, they appear on a new object called a `Stream<T>` which:

-   is be obtained from the collection by calling `stream`
-   can only be used once

It seems a lot like another flavour of `Iterable<T>`. And you might expect a corresponding `Streamable<T>` to be implemented by collections with a `stream` method, and [early in the development of this feature that was the case, but it was removed](https://mail.openjdk.org/pipermail/lambda-libs-spec-experts/2013-February/001287.html). Could the operations have just been provided as default interface methods on `Iterator<T>`? It seems so.

In any case, this is a fundamental difference but I'm not sure what to make of it. A C# method can accept a collection in the form of an `IEnumerable<T>`, and can therefore make multiple passes through it. A Java method that is passed a `Stream` can only make one pass. But the multi-pass capability is a double-edged sword. In C# when reviewing code I have occasionally discovered some very easy performance wins by adding `ToList()` here and there, to materialize an `IEnumerable<T>` that was being expensively re-evaluated. And conversely, I'm not sure I've wanted that kind of behaviour deliberately. I guess low memory conditions and very large data sets could be a compelling use case for lazy re-processing of a collection that doesn't memoize the results of the first pass, but it seems odd that it's the default in C#.

Verdict: hmmm.

# A pattern emerges

Over the last few years the two languages seem to have been adding very similar features at quite a pace. With pattern matching, C# 7.0 (2017) led the way. In its simplest form, an `if` statement can declare a variable:

```cs
if (someObj is string someStr)
{
    // in this scope we know someStr is a string
}
```

Likewise in Java 14 (2020), as a preview feature, you could say:

```java
if (someObj instanceof String someStr) {
    // in this scope we know someStr is a string
}
```

But C# went much further, sooner. Similar enhancements appeared at the same time in the `switch` statement, and tuples, and a form of destructuring to go with them (positional only, therefore). As with so many of these feature additions, neither language is inventing them; there are many pre-existing languages, often with quite niche communities, that have pioneered these features for years (even several decades), and both C# and Java are cherry-picking them for integration into their own, more popular, platforms and so bringing them to a much wider audience. Sometimes they do so in a strikingly identical way, thanks to commonalities in their basic implementations, and sometimes they are forced to diverge.

Records have appeared in both languages also. Simplistically these are class-like and lean towards succinct declaration for a "primary" constructor, and toward immutability, and the provision of automatic implementations of equality comparison and hashcodes, i.e. they are value-like (by default, anyway.) But as with lambdas and closing over mutable locals, C# goes the extra mile even though it increases the complexity of its implementation. Java records cannot inherit implementation (only interfaces). But in C#, a record can inherit another record, and this means the language has to be careful about what equality means. Also there's the delightful `with` expression that can perform a non-mutating update, and which also strives to provide non-surprising behaviour under inheritance. The expression:

```c#
x with { FirstName = "Joe" }
```

produces a modified clone of the runtime type of `x`, which may differ from the compile-time type, so polymorphism is properly honoured.

# What's next?

Probably the most interesting recent C# feature is [static virtual interface members](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/tutorials/static-virtual-interface-members), which greatly increases the expressiveness of generic types. In mathematics when we introduce an operator closed over a set, we often introduce special elements of the set like a "zero". Now we can write such concepts down in C#. Or thinking more practically, we can do much of what C++ traits have always been able to do.

Your move, Java!

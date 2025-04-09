---
tags: roslyn c#
date: 2014-04-23
title: Adding crazily powerful operator overloading to C# 6
layout: post
---

**I'm going to show you how to enable a new kind of operator overloading by adding exactly four (4) lines of code to a single file in the C# 6 compiler
preview. Yes, I was surprised too!**

After seeing the video of Anders Hejlsberg showing how easy it is to hack the new open source C# compiler, I had to give it a try.

My aim was (I assumed) a lot more ambitious and crazy than his demo. I thought it would take ages to figure out. But it was still tempting to aim high and
actually implement a substantial new feature, because there are a few I've been wondering about over the years.

Ever since LINQ query syntax was added to the language, I've wished that operator overloading worked the same way. The `where` keyword gets turned into a
call to a `Where` method. And it doesn't matter where or how that method is defined. It can be an extension method, an ordinary method, a `virtual` method.
In fact there are few other language features that map to well known member names: a collection initializer is turned into several calls to a method called
`Add`, and the `await` keyword expands into calls to several methods.

So my use case is very simple. Suppose I have a couple of sequences of values:

```csharp
var nums1 = new[] { 1, 2, 3 };
var nums2 = new[] { 4, 5 };

var nums3 = nums1 + nums2;
```

That last line, which I'd like to concatenate the two sequences, simply isn't going to work because operator `+` is not defined on `IEnumerable`. Nor is
there a way to make it work for all sequences in standard C#. That would require the ability to implement an operator overload using extension methods!
Such a thing does not exist. But it would be pretty useful.

Suppose if the compiler couldn't find a standard meaning for `+`, it tried looking for a method available the left-hand-side value called `Addition`.
(NB. `Add` is already taken by collection initializers as I previously noted).

```csharp
public static class EnumerableOperatorExtensions
{
    public static IEnumerable<T> Addition<T>(this IEnumerable<T> left, IEnumerable<T> right)
    {
        return left.Concat(right);
    }
}
```

Of course, `Concat` is already there to do the real work for us: the above incantation just makes it available under a standardised name.

So let's get to work. To play along at home, [download the Roslyn source](http://roslyn.codeplex.com/), read the [instructions for building/debugging](http://roslyn.codeplex.com/wikipage?title=Building%2c%20Testing%20and%20Debugging&referringTitle=Home),
get all the prerequisites (the instructions seem to be flawless as far as I can tell), and make sure you're able to build and hit F5 to bring up Visual
Studio. You'll find you can set breakpoints and they will be hit (from multiple threads) as VS2013 compiles code on the fly as you edit it, to provide
intellisense, etc.

The first thing I had to do was find those well-known member names, such as `Where`. Obviously it wouldn't be that easy, but I tried a simple search
for the quoted string `"Where"`... Oh, turns out it really is that easy!

This is the first hit:

```csharp
void ReduceWhere(WhereClauseSyntax where, QueryTranslationState state, DiagnosticBag diagnostics)
{
    // A query expression with a where clause
    //     from x in e
    //     where f
    //     ...
    // is translated into
    //     from x in ( e ) . Where ( x => f )
    var lambda = MakeQueryUnboundLambda(state.RangeVariableMap(), state.rangeVariable, where.Condition);
    var invocation = MakeQueryInvocation(where, state.fromExpression, "Where", lambda, diagnostics);
    state.fromExpression = MakeQueryClause(where, invocation, queryInvocation: invocation);
}
```

That `MakeQueryInvocation` looked intriguing. It calls onto another helper called `MakeInvocationExpression`, which takes a receiver for the method
call, a method name and an immutable array of arguments, and is commented as:

```csharp
// Helper method to create a synthesized method invocation expression.
```

On searching for calls to it, as you'd expect, I found it being used for collection initializers and `await` in exactly the same way. All I needed
was to find a spot in the binding of operators where we're just about to give up and emit an error, and then try `MakeInvocationExpression`.

The next part I did with a mixture of searching for likely words in the source and then setting breakpoints to see if they got hit. Eventually I
found a method `Binder.BindSimpleBinaryOperator` in the file `Binder_Operator.cs`. Actually there are two overloads of it: the four-argument
overload does the real work. (The two-argument overload is just a wrapper that avoids too much recursion when dealing with chained operators by
implementing its own stack.)

Anyway, it works by calling another helper, `BinaryOperatorOverloadResolution`, which implements the standard C# rules, and then it checks if it worked:

```csharp
if (!best.HasValue)
{
    resultOperatorKind = kind;
    resultType = CreateErrorType();
    hasErrors = true;
}
```

That's where it gives up! So that's where we need _MOAR CODE_:

```csharp
if (!best.HasValue)
{
    string methodName = Enum.GetName(typeof(BinaryOperatorKind), kind);
    var methodCall = MakeInvocationExpression(node, left, methodName, ImmutableArray.Create(right), diagnostics);
    if (methodCall != null && !methodCall.HasAnyErrors)
        return methodCall;

    resultOperatorKind = kind;
    resultType = CreateErrorType();
    hasErrors = true;
}
```

Look how damn lazy I was. The enum `BinaryOperatorKind` defines `Addition`, `Subtraction`, etc., so I just get the string name of the value to
use as the method name. If `MakeInvocationExpression` seems to have worked, I return the result.

But I was also quite careful. By ensuring the standard is followed first, and the new behaviour only kicks in for code that would otherwise be
malformed, I don't change the meaning of existing programs.

And that's it. Here's a look at what happens in Visual Studio when I run it and enter my test case, but first _without_ defining an extension method:

![Errors](http://smellegantcode.files.wordpress.com/2014/04/roslyn1.jpg)

Note the error message! It's telling us we need to write an `Addition` method that takes one argument. In the intellisense! I didn't have to
do anything in particular to make that happen.

Then when we add the declaration of the extension method:

![Fixed](http://smellegantcode.files.wordpress.com/2014/04/roslyn2.jpg)

The red squiggle has gone, and `num3` has the right type. And when I hit F5, I see the expected concatenated output.

I am _astonished_.

[Here's a fork with this small change.](https://roslyn.codeplex.com/SourceControl/network/forks/danielearwicker/roslynoperatormethods/changeset/e2c22d309f531ac7030782a124a9a8a41b18864b)

There is still more to investigate. For example:

```csharp
interface IThing
{
    IThing Addition(IThing other);
    IThing Subtraction(IThing other);
}

static void Test<T>(T a, T b) where T : IThing
{
    var r1 = a + b;
    var r2 = a - b;
}
```

That works! Oh yes, you can do operators on generic parameter types. Couldn't do that before.

However, what about `==`? That doesn't work - it seems the compiler handles equality comparison separately, and doesn't get to my new code.
Maybe that's a good thing... But on the other hand, maybe not. Will take another look tomorrow.

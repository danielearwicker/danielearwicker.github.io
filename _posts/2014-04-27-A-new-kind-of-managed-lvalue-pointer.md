---
layout: post
tags: roslyn c#
date: 2014-04-27
title: A new kind of managed lvalue pointer
---

It's already the evening and I haven't yet added anything to the C# compiler today, so here goes!

Properties have special support in C#, but they are not "first class". You can't get a reference to a property and pass it around as a value. Methods are
much better served in this regard: delegates are a way to treat a method as a value. But they are just objects with an `Invoke` method.

So all we need is an interface with a `Value` property. Objects supporting that interface can represent a single property that can be passed around like any other value:

```csharp
public interface IProperty<T>
{
    T Value { get; set; }
}
```

This is closely analogous to an old-fashioned pointer in C and C++, [as I mused aloud all those years ago](http://smellegantcode.wordpress.com/2008/05/06/pointers-to-value-types-in-c/).
Let's turn that whole idea into a strangely alluring language feature, which I'll call "property references", and then occasionally forget that terminology and call them pointers instead.

Firstly, syntax. We could use actual pointer syntax, but [I already used some of that in yesterday's feature](../Pointers-IEnumerable). Dagnabbit! Fortunately [C++/CX](http://en.wikipedia.org/wiki/C%2B%2B/CX) has already paved the way: it has the concept of a reference to a fancy object that must be explicitly dereferenced. The syntax is like this:

```csharp
MyClass ^r = %x;

(*r).Foo();
```

If this looks weird, try replacing `^` with `*` and `%` with <code>&amp;</code>. It's then exactly like C/C++. `^` is a postfix modifier on a type declaration
that means "Will store a pointer to one of those", and `%` is a unary prefix operator that means "Give me a pointer to whatever comes next". And for the sake
of uniformity in common code, C++/CX always uses `*` to dereference.

Before getting into the nitty-gritty of changing the compiler, let's survey the glorious sunny uplands we wish to invade. We should be able to do this in C#:

```csharp
var x = 5;
var px = %x; // Take a "pointer" to x

Console.WriteLine(*px); // Prints 5

*px = 6; // Can assign "through" a pointer
(*px)++; // Or increment

Console.WriteLine(x); // Prints 7 - we modified x via px
```

Unlike old-school pointers, we can - of course - quite safely return one of these things from a method, _referring to a local variable_:

```csharp
static int^ GetCounter(int init)
{
    var counter = init;
    return %counter;
}

// elsewhere...
var c = GetCounter(100);
Console.WriteLine(*c); // Prints 100

(*c)++;
Console.WriteLine(*c); // Prints 101
```

The trick is that each bit of new syntax expands very simply into some standard C#. All the heavy lifting is done by the compiler's existing support for lambdas:

```csharp
var x = 5;
System.IProperty<int> px = System.Property.Bind(v => x = v, () => x); // int *p = %x;
var y = px.Value; // var y = *x;
```

But of course, those helper types are not part of the standard `System` namespace. We need to add them:

```csharp
namespace System
{
    public interface IProperty<T>
    {
        T Value { get; set; }
    }

    public static class Property
    {
        private class PtrImpl<T> : IProperty<T>
        {
            Action<T> _set;
            Func<T> _get;

            public PtrImpl(Action<T> set, Func<T> get)
            {
                _set = set;
                _get = get;
            }

            public T Value
            {
                get { return _get(); }
                set { _set(value); }
            }
        }

        public static IProperty<T> Bind<T>(Action<T> set, Func<T> get)
        {
            return new PtrImpl<T>(set, get);
        }
    }
}
```

These don't need to be in `mscorlib.dll` (some of the later C# features rely on types in `System.Core.dll`). So we can just create a new
`System.Extras.dll` assembly and stick them in there.

So, one thing that makes this a whole 'nother level of crazy compared to my first two forays in to compiler features is that here we are adding new syntax.
Fortunately Roslyn makes this quite easy. There's a file called `Syntax.xml` from which the project generates classes for all the nodes that can appear in a
syntax tree. We can (as usual) follow the example of what we find in there.

All the unary prefix operators are in here, so they share a single class that can be distinguished by the `Kind` property:

```xml
<Node Name="PrefixUnaryExpressionSyntax" Base="ExpressionSyntax">
  <Kind Name="UnaryPlusExpression"/>
  <Kind Name="UnaryMinusExpression"/>
  <Kind Name="BitwiseNotExpression"/>
  <Kind Name="LogicalNotExpression"/>
  <Kind Name="PreIncrementExpression"/>
  <Kind Name="PreDecrementExpression"/>
  <Kind Name="AddressOfExpression"/>
  <Kind Name="PointerIndirectionExpression"/>
  <Kind Name="AwaitExpression"/>
  <Kind Name="PropertyReferenceExpression"/>
  <Field Name="OperatorToken" Type="SyntaxToken">
    <Kind Name="PlusToken"/>
    <Kind Name="MinusToken"/>
    <Kind Name="TildeToken"/>
    <Kind Name="ExclamationToken"/>
    <Kind Name="PlusPlusToken"/>
    <Kind Name="MinusMinusToken"/>
    <Kind Name="AmpersandToken"/>
    <Kind Name="AsteriskToken"/>
    <Kind Name="AwaitKeyword"/>
    <Kind Name="PercentToken"/>
    <PropertyComment>
      <summary>SyntaxToken representing the kind of the operator of the prefix unary expression.</summary>
    </PropertyComment>
  </Field>
  <Field Name="Operand" Type="ExpressionSyntax">
    <PropertyComment>
      <summary>ExpressionSyntax representing the operand of the prefix unary expression.</summary>
    </PropertyComment>
  </Field>
  <TypeComment>
    <summary>Class which represents the syntax node for prefix unary expression.</summary>
  </TypeComment>
  <FactoryComment>
    <summary>Creates an PrefixUnaryExpressionSyntax node.</summary>
  </FactoryComment>
</Node>
```

I've added the `PropertyReferenceExpression` and the `PercentToken`. For the type modifier `^` I have to cook up a whole new node type:

```xml
<Node Name="PropertyReferenceTypeSyntax" Base="TypeSyntax">
  <Kind Name="PropertyReferenceType"/>
  <Field Name="ElementType" Type="TypeSyntax">
    <PropertyComment>
      <summary>TypeSyntax node that represents the element type of the property reference.</summary>
    </PropertyComment>
  </Field>
  <Field Name="CaretToken" Type="SyntaxToken">
    <Kind Name="CaretToken"/>
    <PropertyComment>
      <summary>SyntaxToken representing the caret symbol.</summary>
    </PropertyComment>
  </Field>
  <TypeComment>
    <summary>Class which represents the syntax node for property reference type.</summary>
  </TypeComment>
  <FactoryComment>
    <summary>Creates a PropertyReferenceTypeSyntax node.</summary>
  </FactoryComment>
</Node>
```

Now, if we try to build the compiler we'll get errors about missing names in the `enum SyntaxKind`, so we need to add them:

```csharp
public enum SyntaxKind : ushort
{
    ...

    PropertyReferenceType,
    PropertyReferenceExpression
}
```

In `SyntaxKindFacts.cs` there's a workaday `switch` statement that we need to modify so it takes care of mapping `%` tokens to our new unary operator:

```csharp
public static SyntaxKind GetPrefixUnaryExpression(SyntaxKind token)
{
    switch (token)
    {
        case SyntaxKind.PlusToken:
            return SyntaxKind.UnaryPlusExpression;
        case SyntaxKind.MinusToken:
            return SyntaxKind.UnaryMinusExpression;
        case SyntaxKind.TildeToken:
            return SyntaxKind.BitwiseNotExpression;
        case SyntaxKind.ExclamationToken:
            return SyntaxKind.LogicalNotExpression;
        case SyntaxKind.PlusPlusToken:
            return SyntaxKind.PreIncrementExpression;
        case SyntaxKind.MinusMinusToken:
            return SyntaxKind.PreDecrementExpression;
        case SyntaxKind.AmpersandToken:
            return SyntaxKind.AddressOfExpression;
        case SyntaxKind.AsteriskToken:
            return SyntaxKind.PointerIndirectionExpression;

        // The new part:
        case SyntaxKind.PercentToken:
            return SyntaxKind.PropertyReferenceExpression;

        default:
            return SyntaxKind.None;
    }
}
```

And there's a another that defines the precedence of operators, which is how the compiler decides what to do when you don't fully parenthesise your
expressions. I figure that the new `%` operator should copy the existing `&amp` operator:

```csharp
private static uint GetPrecedence(SyntaxKind op)
{
    switch (op)
    {
        ...

        case SyntaxKind.AddressOfExpression:
        case SyntaxKind.PropertyReferenceExpression: // the new part
            return 16;
        default:
            return 0;
    }
}
```

For the all-new `^` operator we have to throw some code in to deal with it. Like I said yesterday, Roslyn's structure seems surprisingly procedural.
It's not using functional parser combinators or anything "cool" and/or "academic". It's just a bunch of methods that examine the current token, do
switch statements, etc. On the plus side, it is very easy to learn how it works by stepping through it in the debugger. That's the saving grace of
procedural code: ease of hacking.

I hooked into the same place that handles pointer syntax, as (again) its closely analogous.

```csharp
private TypeSyntax ParsePointerTypeMods(TypeSyntax type)
{
    // Check for pointer types
    while (this.CurrentToken.Kind == SyntaxKind.AsteriskToken)
    {
        type = syntaxFactory.PointerType(type, this.EatToken());
    }

    // Check for property reference types (new)
    while (this.CurrentToken.Kind == SyntaxKind.CaretToken)
    {
        type = syntaxFactory.PropertyReferenceType(type, this.EatToken());
    }

    return type;
}
```

Note: we don't have to write that `syntaxFactory.PropertyReferenceType` method. It's one of the pieces that are auto-generated from what we added to `Syntax.xml`.

Now, we have the syntax. All we need now is to sort out the binding phase, which figures out whether the syntax actually makes sense (that when it refers
to a variable called `x`, there actually is one called `x`, and every expression has a type, etc.)

And it is here that I am overcome with one of those attacks of laziness that are the hallmark of the truly great programmer, hem-hem. Faced with a pattern
like this:

```csharp
System.Property.Bind(v => o = v, () => o)
```

We don't want to have to write screeds of code that builds the `BoundExpression` that make up that pattern (believe me: I got about half-way through the
first lambda before realising I would be retired before finishing the whole thing). In any case, the compiler can already do it - that's its job. Ideally we
could use the existing parser to get a kind of "syntax template", in which we can replace certain identifiers with chunks of other syntax, and then ask the
existing binder to bind it. Then we'd have to do almost _no thinking at all_! Bliss.

So for example:

```csharp
private static readonly SyntaxTemplate _propertyReferenceTemplate
    = new SyntaxTemplate("System.Property.Bind(__v_pr__ => o = __v_pr__, () => o)");

private BoundExpression BindPropertyReferenceExpression(PrefixUnaryExpressionSyntax node, DiagnosticBag diagnostics)
{
    return RedirectDiagnostics(diagnostics, node, redirected =>
        BindExpression(_propertyReferenceTemplate.Replace("o", node.Operand).Syntax, redirected));
}
```

We'll come back to that `RedirectDiagnostics` part later. The key point is that I'm creating an instance of my new class `SyntaxTemplate` as a `static`, so
it is reused for the lifetime of the compiler. It's immutable, hence thread-safe. Then every time I need to bind something like `%foo`, I can just replace
the `o` in the template with `foo` (which is in `node.Operand`). `Replace` returns a new `SyntaxTemplate` rather than modifying the original (that's what
immutability is all about).

Again, binding is a recursive, procedural system. There's a big switch statement that calls out to methods that bind various things, so we need to hook our
new method `BindPropertyReferenceExpression` into that:

```csharp
private BoundExpression BindExpressionInternal(ExpressionSyntax node, DiagnosticBag diagnostics, bool invoked, bool indexed)
{
    if (IsEarlyAttributeBinder && !EarlyWellKnownAttributeBinder.CanBeValidAttributeArgument(node, this))
    {
        return BadExpression(node, LookupResultKind.NotAValue);
    }

    Debug.Assert(node != null);
    switch (node.Kind)
    {
        ...

        // New part
        case SyntaxKind.PropertyReferenceExpression:
            return BindPropertyReferenceExpression((PrefixUnaryExpressionSyntax)node, diagnostics);
```

See how there's a `switch` statement on an `enum`, then a cast - all the kinds of thing that beginners are told not to do when they learn C#, because
supposedly virtual method dispatch on a single object solves all problems. ([Oh wait, no it doesn't](http://stackoverflow.com/questions/1406860/how-can-i-replace-instanceof-in-this-case).)
But still, it wouldn't make sense to have a built-in type switch in languages like C#, Java or C++ ([except apparently in one situation](http://stackoverflow.com/a/1166083/27423)).

Anyway, `BindExpression` calls `BindExpressionInternal`, which calls our new `BindPropertyReferenceExpression` method, which expands our template and passes it
to `BindExpression`... we're going in circles! But it's okay. The reason this doesn't asplode the stack is because our template doesn't include further references to `%`.

Now, about that `RedirectDiagnostics` wrinkle. The binding process has a `DiagnosticBag` object that gets passed around. Any errors found are thrown in the bag.
Each error has a `Location` object, identifying the place in the user's source code where the error was spotted, so the locations were discovered at the parsing
stage. The problem we have is that we parse our template code separately, so the locations bear no relation to the user's source code. This means that the IDE's
text editor cannot put red squiggles in the right place.

To fix this, I literally fix the diagnostics:

```csharp
private T RedirectDiagnostics<T>(DiagnosticBag diagnostics,
             CSharpSyntaxNode nodeWithLocation,
             Func<DiagnosticBag, T> generate)
{
    var captured = new DiagnosticBag();
    var result = generate(captured);

    foreach (var diag in captured.AsEnumerable().OfType<DiagnosticWithInfo>())
        diagnostics.Add(new CSDiagnostic(diag.Info, nodeWithLocation.Location));

    return result;
}
```

The `generate` function does the binding, but to a "fake" temporary `DiagnosticBag`, which we then copy into the real one but replacing all the
`Location` objects with a single good location. This isn't ideal. Recall that some of the syntax tree was inserted from the user's source and so
had perfectly good locations. I need to figure out a way of detecting whether a location is junk or not. But it sort of works.

So, we have binding for `%`. For `*` we have to enhance the existing code, branching based on whether operand is a pointer:

```csharp
private static readonly SyntaxTemplate _pointerIndirectionTemplate = new SyntaxTemplate("p.Value");

// Based on ExpressionBinder::bindPtrIndirection.
private BoundExpression BindPointerIndirectionExpression(PrefixUnaryExpressionSyntax node, DiagnosticBag diagnostics)
{
    BoundExpression operand = BindValue(node.Operand, diagnostics, GetUnaryAssignmentKind(node.Kind));

    // Try using the template on anything that isn't a pointer
    if (!operand.Type.IsPointerType())
        return RedirectDiagnostics(diagnostics, node, redirected =>
            BindExpression(_pointerIndirectionTemplate.Replace("p", node.Operand).Syntax, redirected));

    TypeSymbol pointedAtType;
    bool hasErrors;
    BindPointerIndirectionExpressionInternal(node, operand, diagnostics, out pointedAtType, out hasErrors);

    return new BoundPointerIndirectionOperator(node, operand, pointedAtType ?? CreateErrorType(), hasErrors);
}
```

We can even use the template technique for type declarations - just replace `T` with whatever we get from the user:

```csharp
private static readonly SyntaxTemplate _propertyReferenceTypeTemplate = new SyntaxTemplate("System.IProperty<T>");

internal Symbol BindNamespaceOrTypeOrAliasSymbol(ExpressionSyntax syntax, DiagnosticBag diagnostics, ConsList<Symbol> basesBeingResolved, bool suppressUseSiteDiagnostics)
{
    switch (syntax.Kind)
    {
        ...

        case SyntaxKind.PropertyReferenceType:
            {
                return RedirectDiagnostics(diagnostics, syntax, redirected => BindNamespaceOrTypeOrAliasSymbol(
                    _propertyReferenceTypeTemplate.Replace("T", ((PropertyReferenceTypeSyntax)syntax).ElementType).Syntax,
                    redirected, basesBeingResolved, suppressUseSiteDiagnostics));
            }
```

That's every change needed to support the feature. If you want to play with it (and even add features of your own using the `SyntaxTemplate` class), I've
[updated my fork with all these changes](https://roslyn.codeplex.com/SourceControl/network/forks/danielearwicker/roslynoperatormethods). You will need to
define the `System.IProperty` and `System.Property` types - it will work if you just paste the code.

---
tags: roslyn c#
date: 2014-04-26
title: Using pointer syntax as a shorthand for IEnumerable
layout: post
---

Another quickie extension to C#. In the current language, a type declaration `T!` is shorthand for `Nullable`.

But equally important in modern C# programs are sequences of values, so a similar shorthand for `IEnumerable` would be ideal.
The asterisk symbol is underused (you can suffix a type with asterisk to make a pointer, but only in unsafe contexts), and
this was the choice made by the intriguing [research language Cω](http://research.microsoft.com/en-us/um/cambridge/projects/comega/)
that influenced LINQ, so let's copy that:

```csharp
int* numbers = new[] { 1, 6, 55, 4, 11 };

foreach (var n in numbers)
    Console.WriteLine(n);
```

In `Binder_Symbols.cs` we find:

```csharp
case SyntaxKind.PointerType:
    {
        var node = (PointerTypeSyntax)syntax;
        ReportUnsafeIfNotAllowed(node, diagnostics);

        var elementType = BindType(node.ElementType, diagnostics, basesBeingResolved);
        if (elementType.IsManagedType)
        {
            // "Cannot take the address of, get the size of, or declare a pointer to a managed type ('{0}')"
            Error(diagnostics, ErrorCode.ERR_ManagedAddr, node, elementType);
        }

        return new PointerTypeSymbol(elementType);
    }
```

The call `ReportUnsafeIfNotAllowed` is what checks for the `unsafe` context. So I commented that out and added my own check
for not-`unsafe`, before doing something very similar to what happens for `T?` -&gt; `Nullable` elsewhere in the same file:

```csharp
case SyntaxKind.PointerType:
    {
        var node = (PointerTypeSyntax)syntax;

        //ReportUnsafeIfNotAllowed(node, diagnostics);
        if (this.IsIndirectlyInIterator || !this.InUnsafeRegion)
        {
            NamedTypeSymbol enumerableT = GetSpecialType(SpecialType.System_Collections_Generic_IEnumerable_T, diagnostics, syntax);
            TypeSymbol typeArgument = BindType(node.ElementType, diagnostics, basesBeingResolved);
            NamedTypeSymbol constructedType = enumerableT.Construct(typeArgument);
            if (ShouldCheckConstraints)
            {
                constructedType.CheckConstraints(this.Compilation, this.Conversions, syntax.Location, diagnostics);
            }
            return constructedType;
        }

        var elementType = BindType(node.ElementType, diagnostics, basesBeingResolved);
        if (elementType.IsManagedType)
        {
            // "Cannot take the address of, get the size of, or declare a pointer to a managed type ('{0}')"
            Error(diagnostics, ErrorCode.ERR_ManagedAddr, node, elementType);
        }

        return new PointerTypeSymbol(elementType);
    }
```

And we're done! We can now say things like:

```csharp
static int *Squares(int *nums)
{
    return nums.Select(n => n * n);
}
```

Roslyn may not be very pretty - it's a hand-crafted top-down system, so it looks nothing like the "text book" functional parsers.
But it's a real product as opposed to a clean example, so that's hardly surprising. Regardless, it is proving easy (even fun) to hack.

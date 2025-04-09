---
tags: c# injection factory
date: 2019-07-02
layout: post
title: Factory Injection in C#
---

**Update** - _There was a nasty bug in the original version of this post! Where I previously registered the factories with `AddSingleton`, I now use `AddTransient`, and I call out the reason for this below._

The modern C# ecosystem (based on dotnet core, due to become .NET 5) enjoys a standard dependency injection system that is, despite its minimalism, is pretty much all you need.

In some ways the ideal dependency injection system is nothing at all: isolate your components by writing an interface/class pair, and make each class accept interfaces to give it access to whatever services it needs. Very often the sole reason for the existence of the interface to go with each class is so that it can be mocked out in unit tests for classes that depend on it. (It's worth noting that in languages based on dynamically typed runtimes there is typically no need to do this - it's especially irksome to see this pattern being imported unnecessarily into TypeScript, where every class is _already_ an interface.)

Anyway, if all you have is "constructor injection", and you set up a network of objects by constructing them, then there is no magic, no runtime resolution, any type errors are detected at compile time, and so you can't forget to register something, because there's no registering.

But this is impractical in a large application; far more convenient to register each interface/class pair once in a `ServiceCollection`. The logic to build any given network of objects is automagically cooked up at runtime. It's a deal with the devil; at the whole-application scale there is no longer any type checking. It's a soup of components from which order emerges _if possible_.

The dotnet core implementation of `ServiceCollection` also has the magic of allowing you to easily inject `IEnumerable<IPen>` to get an instance of every class registered as supporting `IPen`, enabling [the Strategy pattern](https://en.wikipedia.org/wiki/Strategy_pattern), which is hugely important.

Another requirement that often crops up is to be able to inject into component `Artist` the ability to construct instances of a component `IPen` willy-nilly, rather than just receiving a single instance in `Artist`'s constructor. The obvious approach:

```cs
public interface IPenFactory
{
    IPen Create(string colour);
}

public interface PenFactory : IPenFactory
{
    public IPen Create(string colour) => new Pen(colour);
}
```

Register that interface/class pair and you now have something you can inject to gain the ability to create as many pens as you want:

```cs
public class Artist
{
    private readonly IPenFactory _pens;

    public Artist(IPenFactory pens) { _pens = pens; }

    public void Draw()
    {
        var pen = _pens.Create("red");
    }
}
```

The `Create` method takes a parameter, the string `colour`, so that the pen is bound to that colour at the moment of its creation (and presumably thereafter, assuming we're being good and immutable).

It gets a bit tedious having to churn out another interface/class pair every time you encounter this pattern. Fortunately we can eliminate the boilerplate. Recall Earwicker's 158th Law:

> An interface with one (non-generic) method should be replaced by `Func`, even (or especially) if it confuses everyone.

And gloriously you can register a `Func` as the "interface" part of a pair:

```cs
services.AddSingleton<Func<string, IPen>>(colour => new Pen(colour));
```

Such that, with no special classes:

```cs
public class Artist
{
    private readonly Func<string, IPen> _createPen;

    public Artist(Func<string, IPen> createPen)
    {
         _createPen = createPen;
    }

    public void Draw()
    {
        var pen = _createPen("purple");
    }
}
```

In real applications the equivalent of `Pen` is a service class that depends on other injectable services, as well as probably needing parameters (such as `colour`) from the client. Say there's a singleton `IInkSupply` service that pens can dip into. This can be registered in the usual way with `AddSingleton`, and then we can give `Pen` two parameters:

```cs
public class Pen
{
    public Pen(IInkSupply ink, string colour) { ... }
}
```

How should we register `Pen`? We want to get the ink from the service provider (that is, magically plucked from the ether), and the colour from a formal parameter:

```cs
services.AddSingleton<Func<string, IPen>>(
    services => colour => new Pen(services.GetRequiredService<IInkSupply>(), colour));
```

This is using a different overload of `AddSingleton` from last time. Our outermost function receives a `IServiceProvider` (`services`) and it has to return _another_ function that actually implements `Func<string, IPen>`.

If you have a few services to throw into `Pen` besides the formal parameter(s), all the calls to `services.GetRequiredService<IBlah>()` become a burden. Besides, it's not very injectiony to have to edit this gnarly registration every time you add a service dependency to `Pen`'s constructor.

But there's another magic facility to solve this:

```cs
services.AddSingleton<Func<string, IPen>>(
    services => colour => ActivatorUtilities.CreateInstance<Pen>(services, colour));
```

Note that `CreateInstance` has to be given a constructable type (not an interface). It will construct it by matching parameters to arguments based on their types, and filling in the rest with registered services. Again, a deal with the devil in that we've lost a bit of static type checking.

But there's a nasty trapdoor lurking here that I didn't spot in my original version of this post. We're registering an injectable `Func` that we can then call with any parameters we like, as many times as we like, to get as many separate instances as we like. So it's tempting to conclude that therefore we aren't in danger of inadvertently capturing and permanently holding onto data. We're building object instances on-the-fly, right?

Well, not entirely. By registering the factory with `AddSingleton`, we cause DI to pass us the root service provider as the `services` argument. That's the service provider that caches things _forever_. It doesn't do this for transients, because they're never cached. It does cache singletons, but that's fine, because they have to be globally cached (so there's only one instance). So if `Pen` injects transients or singletons (or other factories, which so far are singletons), we're good.

But there's another form of registration: _scoped_. This is typically used for objects that carry information about a specific user session inside a server, and which should therefore be singleton-per-user, as it were. If `Pen` were to inject a scoped service, a problem arises.

What happens next depends on how your root service provider is configured. If it is configured to validate scopes, then you'll get `InvalidOperationException`, with the message `Cannot resolve scoped service 'Blah...' from root provider.` This is good - your DI environment is protecting you from a potentially terrible bug, where the first user's data is captured in a scoped service and is then provided to all subsequent users, thus leaking information between users. If you don't have that check enabled, that information leak could occur silently.

The solution is to register functions with `AddTransient`. This causes DI to pass us a transient provider, which doesn't cache anything scoped.

So you can now sling new services into `Pen`'s constructor and not have touch the registration. It's a bit ugly looking as registrations go. But we can hide this by creating a few reusable extension methods of our own:

```cs
public static class FactoryExtensions
{
    public static IServiceCollection AddFactory<TInterface, TImplementation>(this IServiceCollection services)
        where TImplementation : class, TInterface
        where TInterface : class => services.AddTransient<Func<TInterface>>(sp => ()
                                        => ActivatorUtilities.CreateInstance<TImplementation>(sp));

    public static IServiceCollection AddFactory<TInterface, TImplementation, TArg1>(this IServiceCollection services)
        where TImplementation : class, TInterface
        where TInterface : class => services.AddTransient<Func<TArg1, TInterface>>(sp => arg1
                                        => ActivatorUtilities.CreateInstance<TImplementation>(sp, arg1));

    public static IServiceCollection AddFactory<TInterface, TImplementation, TArg1, TArg2>(this IServiceCollection services)
        where TImplementation : class, TInterface
        where TInterface : class => services.AddTransient<Func<TArg1, TArg2, TInterface>>(sp => (arg1, arg2)
                                        => ActivatorUtilities.CreateInstance<TImplementation>(sp, arg1, arg2));

    public static IServiceCollection AddFactory<TInterface, TImplementation, TArg1, TArg2, TArg3>(this IServiceCollection services)
        where TImplementation : class, TInterface
        where TInterface : class => services.AddTransient<Func<TArg1, TArg2, TArg3, TInterface>>(sp => (arg1, arg2, arg3)
                                        => ActivatorUtilities.CreateInstance<TImplementation>(sp, arg1, arg2, arg3));
}
```

So those variants support between 0 and 3 type parameters in addition to the first two (interface and class). So registering a `Func<string, IPen>` is as simple as:

```cs
services.AddFactory<IPen, Pen, string>();
```

If you need more than that then you should probably define a wrapper type containing all the parameters as properties and pass that as the only parameter (this is often a good idea anyway, but is essential when the only criterion for matching arguments to parameters is assignment compatibility - what if you need to pass two different strings?)

By the way, if you haven't tried injecting `Func` before, you may be worried about whether your mocking framework will still work with this approach. I can vouch for Moq, which deals with it beautifully:

```cs
var createPen = new Mock<Func<string, IPen>>();
var greenPen = new Mock<IPen>();

createPen.Setup(c => c("green")).Returns(greenPen.Object);

new Artist(CreatePen).Draw();

createPen.Verify(c => c("puce"), Times.Never);
```

tags: typescript mobx react
date: 2017-01-07

This concerns quite an abstract, simple building block, but it is a neat tool for use with React and MobX.

For the overall idea, see [the project page](https://github.com/danielearwicker/meta-object), or just look at the takeaway:

```tsx
// MobX model:
class Person {
    @observable firstName: string;
    @observable lastName: string;
    @observable dateOfBirth: Date;
}

// Two-way binding in React component:
const { firstName, lastName, dateOfBirth } = from(props.person);
return (
    <div>
        <label>First name: <TextInput value={firstName} /></label>
        <label>Last name: <TextInput value={lastName} /></label>
        <label>Date of birth: <DateInput value={dateOfBirth} /></label>
    </div>
);

```

That is, incredibly easy, tidy, declarative and statically-typed two-way binding. I'm working on another project called [bidi-mobx](https://github.com/danielearwicker/bidi-mobx) that will exploit this idea and provide examples (including validation).

Here I want to mention how it uses a few new-ish TypeScript features, and where it calls for possible future extensions to the language.

Way back when [Roslyn](https://github.com/dotnet/roslyn) first went open source and I got excited about how hackable it was, I added [[A new kind of managed lvalue pointer]]. Just like you can get a reference to a method (called a _delegate_ in C# - and, wonder of wonders, it's always properly bound to the right `this`), why not a reference to a specific mutable property? It's a bundling together of two methods: a getter and a setter. The pain is having no neat syntax to construct the reference, specifying the object and the property just once each.

And as if in a demonstration of how TypeScript is *way* better than C#, you can now achieve the same end without having to change the compiler! It's statically type checked, although there is a limitation to this (and I'm not entirely sure how it would be fixed, but I wouldn't bet against TS fixing it soon).

It's thanks to three separate features that play together very nicely. First, `keyof T` is a union of string literal types, in which each string is the name of a property of `T`. So it's a compile-time analogue of `Object.keys`.

Second, if `K` is a string literal type and `T` has a property of that name, the type expression `T[K]` gives us the type of that property. This is a *type indexer*. The syntax looks just like the runtime JavaScript indexing operation where you pass a string property name to get its value. One way to think of this is that an interface is a collection (a dictionary or map) of types, keyed by names, and now we have a way to fetch an item from the collection. Maybe next we'll have [conditional types](https://github.com/Microsoft/TypeScript/issues/12424), and then who knows [where we might end up](http://www.boost.org/doc/libs/1_63_0/libs/mpl/doc/refmanual/map.html). Conditions need booleans to steer them, but TypeScript already has `true` and `false` as *types*. Hold onto your hats...

One slight wrinkle is that `T[K]` identifies a property, which might have the `readonly` modifier. Type indexing seems to ignore that modifier so that information is lost. This leads to the type hole I mentioned above. We want to target mutable properties only, but we can't tell if a property is `readonly` (or do much about it, even if we could tell - this is one place where conditional types would come in handy).

Finally, there are now *mapped types*, which is a way of declaring a set of properties with a single declaration, e.g. there's now a standard definition in the TS core library:

```ts
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
}
```

The magic part is the `[P in keyof T]` which roughly means "repeat this line for each property of T", so if `T` has five properties then so will `Readonly<T>`. This is like `Array#map`, but operating on types at compile time instead of values at runtime. It might grow into a compile-time form of [list comprehension](https://en.wikipedia.org/wiki/List_comprehension).

My use of these features is structurally very similar to `Readonly<T>`, except I wrap each property in another type:

```ts
export type MetaObject<T> = {
    readonly [K in keyof T]: MetaValue<T[K]>;
};
```

And that type is:

```ts
export interface MetaValue<P> { 
    get(): P;
    set(v: P): void;
}
```

So a `MetaObject<T>` has properties who have the same name as the properties of `T`, and each property type `P` is "amplified" (wrapped) to become `MetaValue<P>`.

The only other thing is to look at the implementation. Actually there are two. Implementing `MetaValue` is trivial, but `MetaObject` must *seem* to have a property when you ask it for one. The fast way to do this (I've timed it) is to use [Proxy](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

```ts
const handler: ProxyHandler<any> = {
    get(target: any, key: PropertyKey) {
        return makeMetaValue(target, key);
    }
}
```

How neat is that? Unfortunately no version of IE has `Proxy`, so there's a fallback that just generates an object that has every property of the underlying object created on it.

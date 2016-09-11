tags: typescript
date: 2016-09-11

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

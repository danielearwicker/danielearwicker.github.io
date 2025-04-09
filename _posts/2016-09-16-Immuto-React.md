---
tags: typescript immuto
date: 2016-09-16
layout: post
title: Immuto - Working with React (An Example)
---

_UPDATE - I'm in the move-fast-and-break-things phase so a couple of details in here are already out of date. In particular, properties are now unified with cursors. See the various repos for details._

In [Immuto - Strongly Typed Redux Composition](../Immuto) I introduced the [Immuto library](https://github.com/danielearwicker/immuto) by coyly describing a wish-list of features, as if I hadn't already written the darn thing. Shucks!

What I didn't do was show how to make a working UI in React, using Immuto to define all the actions and the structure of the store. The missing piece is another package:

-   `npm install immuto-react`

However, the majority of this document is just plain `immuto` used in conjunction with `react`. We won't need `immuto-react` until the very last step.

Also there is nothing DOM-specific at all. This should all work with React Native, or in server-side rendering, or what-have-you.

## Example app

There's a running example here:

-   [Live demo](https://danielearwicker.github.io/resources/immuto)

The source is here:

-   [immuto-example](https://github.com/danielearwicker/immuto-example)

Clone it and get it running like this:

```bash
git clone https://github.com/danielearwicker/immuto-example
cd immuto-example
npm install
webpack
http-server
```

You'll need to global install the last two tools from `npm` also if you don't have them already. When it's up and running you can hit `localhost:8080`.

In the TypeScript editor of your choice (I've been using `alm` recently, because AWESOME) one neat thing to look at is `exampleData.ts` [(link)](https://github.com/danielearwicker/immuto-example/blob/master/exampleData.ts). It first glance it looks like a pretty boring copy/paste of a JSON log of actions. Which is what it is. Maybe I just like boring stuff?

But what's really cool is that if you edit the `type` property of any action, including the nested ones, or change a payload from a string to a number, TypeScript starts moaning. It's type-checking the shizzle out of it. Every action in the log is of type `typeof Shop.reduce.actionType`. This means that if I restructure the app, changing even the slightest detail of the actions supported by my reducers, TypeScript pipes up and says "You need to update your example data!"

It's a neat demonstration of how the deep the type checking goes in Immuto. It doesn't just rely on you going through a special API. Even if you hand-build your actions, they can (if you wish) be fully validated at compile time. I know I shouldn't be surprised by this, having designed it to work this way from the ground up, but I genuinely did change the type string of one of my actions and TypeScript _did at once_ tell me to fix the example data, making me say "Well, I'll be a monkey's uncle" or similar earthy reflexive sobriquet.

## Two-Way Binding? Inconceivable!

I've continued with the book/shelf/shop theme. Let's start with the simplest piece, the `Book` (slightly simplified):

```ts
interface Book {
    readonly title: string;
    readonly price: number;
}
```

Of course I like to gather related useful stuff for a type in a namespace with the same name:

```ts
namespace Book {
    export const title = property("TITLE", (book: Book) => book.title);

    export const price = property("PRICE", (book: Book) => book.price);

    export const empty: Book = { title: "", price: 0, authors: [] };

    export const reduce = reducer<Book>(empty).action(title).action(price);

    export type Cursor = typeof reduce.cursorType;
}
```

And here's a really minimal component that lets the user edit a book:

```tsx
const BookEditor = ({ book }: { book: Book.Cursor }) => (
    <div>
        <TextInput property={Book.title(book)} />
        <DecimalInput property={Book.price(book)} decimalPlaces={2} />
    </div>
);
```

This looks a lot like "two-way binding", and so it is, but it's all layered over pure Redux actions that are submitted to a single store. And yet nothing in that definition has been bound to a specific store at this stage. It's a perfectly reusable component.

`TextInput` and `DecimalInput` are components that wrap the `<input>` element. They both take a prop called `property`, which can be anything conforming to this extremely simple interface:

```ts
interface Property<P> {
    readonly state: P;
    (newValue: P): void;
}
```

That is, a function that can be passed a new value, and the function also has a property `state` containing the current value. And so a minimal definition of `TextInput` would be:

```tsx
function TextInput({ property }: { property: Property<string> }) {
    return (
        <input
            type="text"
            value={property.state}
            onChange={(e) => property(e.currentTarget.value)}
        />
    );
}
```

As you can see, it wouldn't be that much bother to use `<input>` directly. But text input fields are pretty commonplace and so why not shrink them down to something neat and remove as much noise as possible from your myriad views in JSX? I plan to add a generalised form of `TextInput`, `CheckBox` and so on to `immuto-react`.

## All About Properties

So what is `property` and how does it work? If you look at how `Book.title` is used in `BookEditor`, you'll see that we call it (so it's a function), passing it a `Book` cursor, and we must get back a `Property<string>` because we pass that sucker directly into `TextInput`'s `property` prop.

If you made it through the last episode, you'll have seen the most general way of declaring an action:

```ts
export const setTitle = action("SET_TITLE", (book: Book, title: string) =>
    amend(book, { title })
);
```

It defines a Redux action creator: a function `setTitle` that can be called with a string argument `"Something"` and returns a strongly typed action: `{ type: "SET_TITLE", payload: "Something" }`.

Actions are the only way anything changes in Redux, period. They should be as high-level as possible, and descriptive of the change being made. If we have data that has some invariant that must apply to it, for example:

-   if string `permission` is empty then number `quota` must be greater than 0.

then we shouldn't expose a way to independently set those values. We should instead expose high-level actions that change both values together, in ways that preserve the invariant, so that it is simply not possible to break it.

But this typically still leaves a lot of situations where we have a primitive value, such as a string, that is independently chosen by the user. It's the "bread and butter" of a lot of data models: bunches of named properties that can be independently modified.

[As I've noted before in another context](../../2014/A-new-kind-of-managed-lvalue-pointer), a "property", an addressable value that can be read and written, is a powerful idea that should be [reified](https://en.wikipedia.org/wiki/Reification), turned into an object that can be stored in a variable, passed as a parameter, etc. The `Property` interface is that concept in Immuto.

An Immuto cursor implements a variant that idea in which we express "writing" by accepting an action to perform on the value. But for some simple values there is only one action: to set it to a new value carried in the payload. In such cases, requiring you to create and pass that action explicitly is pure ceremony with no purpose.

So in these simple and ubiquitous cases, where it makes sense, instead of `action` we can use `property`:

```ts
export const title = property(
    "TITLE",
    (book: Book) => book.title,
    (book, title) => amend(book, { title })
);
```

This assigns to `title` an object that is both:

-   an action definition, so it can be added to `Book`'s reducer, and
-   a function to which we can pass a `Book` cursor, and get back a property instance that is bound to the title of the book we passed.

So when we call that function passing a new title `"1984"` for the book, it builds an action `{ type: "TITLE", payload: "1984" }` and dispatches it to the `Book` cursor, which will take it from there, producing an action path and ultimately dispatching it to the big store in the sky.

(Note that I've used the name `TITLE` rather than `SET_TITLE`; of course, action names are entirely up to you. I think if there is nothing else you can do to something apart from `SET` it, then there's no need to qualify it.)

In the call to `property`, the second argument is the same reducer definition we originally passed to `action` in the earlier `setTitle` example. The first argument is the new part: a "getter" for the same property.

But what a shame to have to effectively say the same thing twice. In a simple example like this, we just want to specify a property name. [In a future version of TypeScript](https://github.com/Microsoft/TypeScript/issues/10826) (see `keysof` operator) we may be able to do something super-succinct. But for now it seems we're stuck with ugly repetition. Ugly, ugly repetition. Or are we? Or _are_ we?

There is one [clever trick](http://perfectionkills.com/those-tricky-functions/) we can play, so we only have to pass the getter:

```ts
export const title = property("TITLE", (book: Book) => book.title);
```

If called in this way, the source of the getter function is parsed, and if it matches a simple enough pattern, then the corresponding reducer can be automatically generated! If the getter is too complex then this parsing fails at runtime, which sounds bad. But it's not too bad, because it's going to fail at load time, and fail noisily (throwing an `Error`). This is the kind of runtime error that is only a gnat's whisker away from static checking. But this feature does involve sniffing something that is not yet completely standard across browsers, so it's somewhat experimental. Please help me fix my Regex.

So, properties give us a binding capability for simple independent values, and that enables two-way binding layered over type-checked pure Redux actions. Happy Birthday!

## Rendering a collection of books

Let's now move out to the next layer, a shelf containing multiple books:

```ts
export interface Shop {
    readonly name: string;
    readonly shelves: { [name: number]: Shelf };
}

export namespace Shop {
    export const name = property("NAME", (shop: Shop) => shop.name);

    export const shelves = collection(
        "SHELVES",
        Shelf.reduce,
        numberMapOperations<Shelf>(),
        (shop: Shop) => shop.shelves
    );

    export const empty: Shop = { name: "", shelves: {} };

    export const reduce = reducer(empty).action(name).action(shelves);

    export type Cursor = typeof reduce.cursorType;
}
```

The extra interesting part here is the collection of books. As we've just implemented a component that can render a `Book`, let's use it to render all the books in our collection:

```tsx
export const ShelfEditor = ({ shelf }: { shelf: Shelf.Cursor }) => (
    <div>
        {getIds(shelf.state.books).map((book) => (
            <div key={book}>
                <BookEditor book={Shelf.books(shelf, book)} />
            </div>
        ))}
    </div>
);
```

In fact there's nothing here I haven't [previously discussed](../Immuto). `Shelf.books` is the collection definition, and it's a way to get a `Book` cursor if you have a `Shelf` cursor and the key of the book you're interested in.

So these are the basics of how you build components that bind to Immuto models. Note that you are of course free to have other props besides a cursor on a component, and you could even pass multiple cursors in different props.

## Binding to the store

The final mystery is how to start the whole thing off at the root. We need a way to tie our tree of components to the store. In this example the root of our model is a `Shop`. And at last we're going to use something from `immuto-react`!

Assuming we have a `ShopEditor` along the expected lines, requiring a prop of type `Cursor<Shop>`, what we need is an `App` component that requires no props and can be rendered as-is.

```tsx
const store = Shop.reduce.store();

const App = bindToStore(store, (s) => <ShopEditor shop={s} />);

ReactDOM.render(<App />, document.querySelector("#root")!);
```

Here, `bindToStore` is a function imported from `immuto-react`. You pass it a store to bind to, and also a function which will be called back with a cursor of the same type as the store, which you can then pass into your unbound component.

And that's all there is to it, on a logical level. All data is passed down in pure props. Everything in the entire app is immutable except for one variable, hidden inside the implementation of the Redux store. Components are stateless functions.

## Optimization by minimal rendering

There is one other matter that might be of concern in large apps. If we proceed as described here, we'll end up re-rendering the entire page every time anything changes, because that's the default behaviour in React; whenever props are passed in to a component, even the same ones, the component's is re-rendered. React has to do this because it doesn't mandate that props are immutable.

To avoid this, `immuto-react` has another function called `optimize`. This wraps a stateless component and returns a new component which is more reluctant to render itself. The rules it uses are quite straightforward.

Each time it has the opportunity to re-render, it compares the values of its props to see if they've changed. To ensure this happens properly, it compares them with `==`, not with `===`. This causes the JS engine to call the `valueOf` method on each prop; it's a built-in feature of JavaScript. All objects have a `valueOf` method, although most just inherit the default which returns `this`. But it can be overridden to return the value that an object represents.

And guess what? Immuto's cursors and properties override `valueOf` to return their `state`. This means that if you use `optimize`, where you have props that are cursors, they will correctly only cause a re-render if the value they refer to has changed, not just because a new cursor has been generated that wraps the same value.

Sadly we're not quite done. A very common pattern in `React` is to pass functions as props, to be used as callbacks typically when the user clicks something. These will likely be lambdas that get allocated every time, and yet in many uses they have no effect on rendering. They will completely ruin your attempts to optimize. So to handle this, `optimize` also has to allow you to pass an array of string names for the props you want it to ignore. This is the one concession to dynamic typing so far! If you add/remove properties, you will not get any compiler errors if you forget to update your `ignore` array. On the other hand, if you do specify a name that is not actually from your props interface, this will not cause a repaint bug. But if you misspell a prop that should be ignored then you'll get unnecessary repaints.

That `keysof` operator we may see [in a future version of TypeScript](https://github.com/Microsoft/TypeScript/issues/10826) would work well here; if that is added, we'll be able to ensure that everything on the `ignore` array is a true prop name.

## Next steps

One topic I'd like to cover is polymorphic components. For example, suppose a shelf could contain a mixture of items (books, food), but all having a price. In mutable OO there would be a `Product` base class with a `price` property and the other two would derive from it. But here we have UI in stateless React, we have immutable data which needs to be easily persisted, and we have reducers taking actions. This seems like an interesting thing to figure out a nice solution to.

I've had a request already to look into how async should work (given that I've pooh-poohed Redux middleware), and that's definitely worth getting into.

It would probably be good to do a full comparison with regular Redux, re-implementing the Redux tutorial.

Feel free to [suggest more](https://github.com/danielearwicker/immuto/issues).

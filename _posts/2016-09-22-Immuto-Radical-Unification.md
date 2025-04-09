---
tags: typescript immuto
date: 2016-09-22
layout: post
title: Immuto - Radical Unification
---

[Immuto](https://github.com/danielearwicker/immuto) continues to evolve rapidly. To ensure that I comply with Semantic Versioning, in which major version 0 implies an unstable API, I've been making major breaking changes every day or so.

The major shift since the first write-up is left-to-right cursor composition. Example - here's the signature of a function that gets a book from a shelf:

```ts
declare function getBook(shelf: Shelf, id: number): Book;
```

And here's one that gets a shelf from a shop:

```ts
declare function getShelf(shop: Shop, id: number): Shelf;
```

If we have a `shelfId` and a `bookId`, to go straight from shop to book:

```ts
const book = getBook(getShelf(shop, shelfId), bookId);
```

Ugh. The nesting makes it confusing. This is why people like methods on objects:

```ts
const book = shop.getShelf(shelfId).getBook(bookId);
```

That's the clarity of left-to-right composition. In Immuto we have clean pure-data interfaces, and we declare actions on them and form them into reducers. One kind of action is called a `reference` and it builds a function that works a bit like `getBook` and `getShelf`, except it deals with cursors to data. So it suffered from the same nested composition ugliness.

What we need, taking a leaf out of functional programming, is a piping operator. I've added a method called `$` to the `Cursor` interface, which means "look up", and corresponds to the familiar `.` operator in many object orientated languages.

So if my `Shop` has a collection `shelves` (of type `Shelves`) in which each item is a `Shelf`, and a `Shelf` has a collection `books` (of type `Books`) in which each item is a `Book`, I can get a cursor to a book like this:

```ts
const book = shop
    .$(Shop.shelves)
    .$(Shelves.at(shelfId))
    .$(Shelf.books)
    .$(Books.at(bookId));
```

It makes complicated manoeuvres pretty readable and logical. Each step is like:

```ts
whatIGot.$(whatIWant);
```

So it's easy to understand by analogy with the ordinary `.` operator, although a bit more syntactically noisy. It would be nice if I could implement the `[]` operator, and so get:

```ts
const book =
    shop[Shop.shelves][Shelves.at(shelfId)][Shelf.books][Books.at(bookId)];
```

But indexers are very special in JavaScript and you can't just implement them like any function.

One other change I made yesterday which I've hinted at above is that I've ripped out the special treatment of collections. It was an unnecessary concept that needed special explanation, it was a bit too magical which made the explanation difficult, and it baked in too much functionality that you might not want. Not all collections need to support random access deletion, for example. Also there are fundamental difference between kinds of collections: if you delete item 4 from an array, you renumber items 5, 6, 7... whereas that doesn't happen with a map. Do I hide that difference or let it leak out? These are all decisions I shouldn't be taking.

So now collections are just a data type with a reducer and some actions, same as anything else:

```ts
export type Books = { [id: number]: Book };

export namespace Books {
    export const empty: Books = {};
    export const at = objectByNumber(Book);
    export const reduce = reducer(empty).action(at);
}
```

I give the collection type a name, then I write a namespace for it, exposing only the actions I want. The `objectByNumber` function provides a way to get a cursor to a `Book` out of a collection of `Books`, i.e. it returns a traversal function suitable for passing to the new `.$()` piping operator.

There are now quite a few examples of this in [immuto-react](https://github.com/danielearwicker/immuto-react) and [immuto-example](https://github.com/danielearwicker/immuto-example).

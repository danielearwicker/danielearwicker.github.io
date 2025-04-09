---
tags: javascript immutability functional react
date: 2016-07-24
title: What's good about Redux
layout: post
---

[Redux](http://redux.js.org/) is based on series of really simple _what-if_ questions:

1. _What if_ all the data in your app was immutable?
2. Okay, now it's stuck. But _what if_ there was only a single solitary mutable variable holding the complete state for your entire app? To change any bit of state, you just assign a slightly different immutable tree to that variable.
3. And _what if_ the only way to mutate the state was to create a POJO describing a high-level action, and dispatch it through a single giant processing system, describing the change to make?

A number of interesting advantages follow from sticking to this discipline. It's ideal for [ReactJS](https://facebook.github.io/react/). You can log everything your users do and replay it, stuff like that. You can store the state snapshots, or just the actions, or both. You can recover your app by loading in an old snapshot and then playing the recent actions to bring it up to date. If you want to know the complete story of how your application ended up in the state it's in now, you've got it. And aside from these nice capabilities, it's worth remembering a lot of bugs arise from fiddling with mutable state at the wrong time. Who needs that?

But just how easy is it to make each bit of your application capable of finding and update the bit of data relevant to itself within _the entire state_? What about modularity, composability, loose coupling, minimal dependency? It seems that, when I want to change the title of a book, I need to know that the book is in a shelf and the shelf is in a shop, so I can create an action that tells the single global store how to update. The "leaf nodes" of my app seemingly need to know far too much about where they sit in the world. Famously, in purist functional programming, every time I change something I've _created a new version of the universe_.

Redux as a pattern doesn't rule out interesting solutions to these problems, but nor does it mandate (or provide) them. A common approach in functional programming is the [cursor](https://github.com/facebook/immutable-js/tree/master/contrib/cursor). The originator of Redux, [Dan Abramov, points out that](https://github.com/reactjs/redux/issues/155) classical cursors allow you to directly manipulate data, which then bypasses the idea of high-level actions, so something a little different is needed. I'm thinking of an abstraction that could be called a cursor but which accepts actions.

Redux has also presented a challenge for TypeScript users because of the apparently disconnected nature of the pieces involved. Actions can be independently created, and thrown into the One Giant Store, which then has to figure out what to do. So it seems the store accepts _any_ kind of action across your entire application, and that doesn't sound very static type applicable. Of course this is not a problem that can be solved by saying "Oh, let's not bother with static typing"; more a sign that, because it is difficult to declare the static type relationships, it will be difficult for human beings to manually keep everything straight without any help.

These challenges will be overcome however. The core idea is so simple and enticing, it has to be made to work.

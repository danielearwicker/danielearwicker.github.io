---
tags: javascript immutability functional redux
date: 2017-01-28
layout: post
title: Redux in Pieces
---

Last July I noted down my thoughts on [Redux](../../2016/Good-Redux) with some hints of the concerns that eventually led to [Immuto](../../2016/Immuto/).

I've since rediscovered my love of `observable` and `computed` via [MobX](../../2016/MobX), which is like the good parts of [Knockout.js](http://knockoutjs.com) made even better by a very careful, thoughtful implementation.

Even so, this is _not_ the same thing as abandoning immutability and purity. There's nothing stopping you using those techniques within a system of observables. Indeed [bidi-mobx](https://github.com/danielearwicker/bidi-mobx) abstracts away all mutation and allows entire UIs to be declared from pure expressions. The data transformation is carried out by objects called adaptors that contain pairs of _pure_ functions between `View` and `Model` representations. Only the user gets to do mutation!

What is the advantage of modelling change through immutability? Primarily it's to allow the different versions of the state to co-exist. One part of your application can refer to an old version even as another is working from a new version. Sometimes this is what you want (an undo stack keeps old versions). Other times it's not (you're concerned mostly about data consistency and you want all parts of your app to be on the same page). Also it's worth remembering that old versions can be retained by cloning, so immutability is not the only way to retain history.

Consider React: every time you return a new UI structure from `render`, it compares it with the structure you returned last time and so is able to mutate the DOM accordingly. Imagine flipping this around. In your code, right after you mutate your data structure, you ask a library to take a `snapshot`. The library walks your current data to create a deep clone of it, compares it with the clone it made last time, and saves a succinct statement of the _differences_ in its history stack. This, after all, is what a log of actions is: an ordered sequence of instructions for how to mutate the data in little steps. So it's like the library is watching you mutate your data and automatically recording a description of each mutation (at snapshot boundaries), which allows you to visit all historic states (i.e. "undo") whenever you need to construct them. It's more expensive at runtime, but it may also be much easier to write your app, and remember Jackson's Rules of Optimisation:

1. Don't.
2. _(for experts)_ Don't _yet_.

My point is that immutability is just a tool for achieving something, and there are other ways. It depends what you want to make easy or fast. This varies depending on the application.

But anyway, (partly) as a joke I wrote down a minimal Redux implemented over MobX so I wouldn't need a `subscribe` method:

```ts
import { observable, runInAction } from "mobx";

// An action has a string property called type
export interface Action<Type extends string> {
    readonly type: Type;
}

// Reducer evolves state as instructed by an action
export type Reducer<State, Action> = (state: State, action: Action) => State;

export interface Store<State, Action> {
    getState(): State;
    dispatch(action: Action): void;
}

// Stores a State value and uses reducer that accepts Action (typically a union of Action<T> variants)
export function createStore<State, Action>(
    init: State,
    reducer: Reducer<State, Action>
) {
    const state = observable.shallowBox<State>(init);
    return {
        getState(): State {
            return state.get();
        },
        dispatch(action: Action) {
            runInAction(() => state.set(reducer(state.get(), action)));
        },
    };
}
```

It's worth asking: what's the advantage of actions being "pure data" (i.e. JSON-persistent)? Obviously its that they can be persisted and shipped elsewhere to be replayed. If you don't need that (and I would hazard a guess that almost no apps using Redux rely on this capability at all) then you could toss it out.

An action could be a function:

```ts
// An action evolves state:
export type Action<State> = (previousState: State) => State;
```

Given a state, it returns a new state. It can do this however it wants. Crucially it's not constrained at all so there is no enforcement of an invariant on the state. No problem:

```ts
// An invariant checks that a state is allowed:
export type Invariant<State> = (possibleState: State) => boolean;
```

So a store is just:

```ts
export interface Store<State> {
    getState(): State;
    dispatch<A extends Action<State>>(action: A): void;
}

export function createStore<State>(init: State, invariant: Invariant<State>) {
    const state = observable.shallowBox<State>(init);

    return {
        getState(): State {
            return state.get();
        },

        dispatch<A extends Action<State>>(action: A) {
            runInAction(() => {
                const possible = action(state.get());
                if (!invariant(possible)) {
                    throw new Error();
                }
                state.set(possible);
            });
        },
    };
}
```

So now the store is responsible for protecting the invariant. It doesn't allow changes that break the invariant. Only valid states are allowed. But you can dispatch actions to get to allowed states by whatever route you want.

After all, what operations are available on some state is not the issue. The issue is understanding what the invariant is, and enforcing it rigidly. The Redux action/reducer pattern does not capture this or enforce it. It's up to the author of the reducer to impose consistency on themselves. Redux focuses on interpreting actions into updates on state, only because it introduces that problem by insisting that actions are pure JSON-able data (just in case that's useful).

Summary: think about what you actually need, and use the abstractions that aid you in achieving it.

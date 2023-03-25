tags: javascript react redux
date: 2023-03-08

Since React finalised its context feature, many apps (even quite complex ones) no longer need any sophisticated state management library. And the most well known such library (Redux) gained a reputation for being overly verbose and ceremonial.

But there are certain situations where some of the patterns of Redux are very useful, and you can dip your toes into it without adopting every ceremonial aspect. And (as with most things) TypeScript makes it even better.

The most minimal starting point is React's built-in hook `useReducer`, which is only a very thin wrapper around the ubiquitous `useState`. We can think of an evolutionary path like this. First you learn to store various pieces of state separately:

```ts
const [firstName, setFirstName] = useState("Murray");
const [lastName, setLastName] = useState("Hewitt");

// in some event handler:
setFirstName(e.target.value);
```

Then you decide it would be better to be explicit about the fact that you're editing a "person", which is an object, so it would make more sense to store the person as a whole:

```ts
const [person, setPerson] = useState({
    firstName: "Murray",
    lastName: "Hewitt",
});

// in some event handler:
setPerson((previous) => ({
    ...previous,
    firstName: e.target.value,
}));
```

And here we take advantage of the fact that `useState`'s set-function is able to accept an "updater function", which maps from the previous value to the desired new value. This is instead of:

```ts
setPerson({
    ...person,
    firstName: e.target.value,
});
```

where we base the updated version on the `person` value we got from the hook. This would require the event handler to be recreated whenever the value changes, or else it will be reading a stale `person`.

Then as your `person` state becomes more complex, perhaps extending to include their employment history, tax records, dental records, etc. there will lots of interesting kinds of update you can perform on the person object. But it's okay because each update just calls `setPerson` with an appropriate updater function.

Even so, you might want to centrally define what are the valid state transitions that are allowed to happen on a person, and keep this separate from all the presentational code that defines inputs, buttons, event handlers and so on.

So you invent the notion of an _action_, which has a `type` property (one of a fixed set of strings), plus any other properties needed to carry information about the action. And then you write a reducer:

```ts
function personReducer(previous: Person, action: PersonAction) {
    switch (action.type) {
        case "CHANGE_FIRST_NAME":
            return { ...previous, firstName: action.firstName };
        case "CHANGE_LAST_NAME":
            return { ...previous, lastName: action.lastName };

        // ... other action types

        default:
            throw new UnreachableCaseError(action);
    }
}
```

As ugly as it may look superficially, TypeScript in fact makes it beautiful because `PersonAction` is defined as:

```ts
type PersonAction =
    | {
          type: "CHANGE_FIRST_NAME";
          firstName: string;
      }
    | {
          type: "CHANGE_LAST_NAME";
          lastName: string;
      };
    | // other actions...
```

So every aspect of it is statically type-checked, including the requirement that there is a `case` for every `type`. By the way, `UnreachableCaseError` is in the `ts-essentials` package or you can just define it as:

```ts
export class UnreachableCaseError extends Error {
    constructor(value: never) {
        super(`Unreachable case: ${value}`);
    }
}
```

And once you have a reducer, you can write a higher order function that creates updater functions suitable for `useState`:

```ts
function updatePerson(action: PersonAction) {
    return (previous: Person) => personReducer(previous, action);
}
```

So this takes an action and returns a function of the form `Person => Person`, i.e. an updater. So in an event handler that wants to set the `firstName`, you can say:

```ts
setPerson(
    updatePerson({ type: "CHANGE_FIRST_NAME", firstName: e.target.value })
);
```

And naturally it gets a bit tiresome repeating that `setPerson(updatePerson(...))` pattern everywhere (and also misses the point, because you want to _know_ that only your official reducer is used to perform all updates). This is where `useReducer` comes in. Instead of `useState`, say:

```ts
const [person, dispatch] = useReducer(personReducer, {
    firstName: "Murray",
    lastName: "Hewitt",
});
```

Of course, `dispatch(...)` is exactly the same thing as `setPerson(updatePerson(...))`. So within your `Person`-editing component, you have a miniature application of the pattern of Redux in its simplest form. But always remember that `useReducer` is a wafer-thin layer over `useState`, merely like a gatekeeper, a limit on the unbounded freedom to make random updates, not a provider of some extra capability.

There's another advantage to requesting updates via actions, rather than updater functions. An action is something that can be round-tripped via JSON, or cloned with `structuredClone`. This is not possible with an updater function (as with any function). Also there is no way to be sure in JS that a local function is pure, i.e. that it always produces the same outcome from the same arguments (with no side-effects). It's all too easy to accidentally depend on some external variable whose value might change between invocations. All these dangers go away if you describe your update request with a simple action object.

And now you can dream big. Your `Person`-editing component initialises the state. But let's say it is provided that initial state in a prop. So this is the classic problem: what to do if that prop changes?

Maybe you have a websocket channel open so the server can notify you when another user edits the person, and the new version is downloaded and your editor is re-rendered with the new prop value. But your user has made their own edits, so there's a conflict. What you need is a kind of automatic back and forth that keeps everyone synchronised with the latest state.

We've already assumed that the server holds the authoritative definition of the current state. The question is, how do you tell the server to update the state, in such a way that you know you won't overwrite someone else's recent changes? One way to do this is to include some kind of version number, or time stamp, in the state:

```ts
interface Person {
    firstName: string;
    lastName: string;
    // other complicated information about the person

    versionId: number;
}
```

So when you retrieve the `Person` from the server it has a `versionId` in it, and when you post a modified `Person` back to the server in an attempted update, that same `versionId` back will be passed back along with all the other data. If your update succeeds, you receive back a new `Person` that matches what you sent except it has a new `versionId`.

But before applying your update, the server checks whether your update's `versionId` still matches the server's current state. If it doesn't, because someone else has snuck their own update on to the server, the server returns the new current state, which will therefore have a higher `versionId`.

As well as returning a `Person` with a higher `versionId`, the server also returns something that specifically indicates whether the update was successful. One way to do this is to return the status code `409 Conflict`.

What should a client do if its update fails? It has received the server's new latest state, so all it has to do is reapply any pending local changes on to that new basis, and then ask the server to try again. Of course, the client could get unlucky a second time because yet again another user has managed to sneak another update in first, but eventually every client will succeed. So evidently there needs to be a retry loop.

But what do I mean by "reapply any pending local changes"? This is the perfect situation to use a reducer and a set of actions. When a user interacts with your `Person`-editing component, they might make two or three changes in quick succession. But as well as applying them locally so the UI updates immediately, those actions could be temporarily held in a list, until their effects have been successfully committed to the server. This means that the actions can be easily replayed onto a new starting state if necessary.

In this way, the reducer becomes a "reconciler". It determines how to settle conflicts between users who are concurrently editing the same object. How can we model this pattern in a hook?

First, let's encapsulate the function for saving a new state to the server. It returns a `Promise` to something that indicates whether the update succeeded and what the new current server-side state is:

```ts
export interface PersistentUpdateResult<S> {
    succeeded: boolean;
    current: S;
}
```

So in our example the function has this signature:

```ts
function savePerson(person: Person): Promise<PersistentUpdateResult<Person>> {
    // ... ask the server to attempt an update
}
```

Another function we need is a comparer that examines two `Person` objects and figures out which is newest. It's exactly the same kind of function you'd pass to the array `sort` method:

```ts
function comparePersons(a: Person, b: Person) {
    return a.versionId - b.versionId;
}
```

By encapsulating this in a function, we don't make any assumptions about how the version is encoded in the object.

Now we're ready to use the new hook in our editor, in place of `useReducer`:

```ts
const [person, dispatch] = usePersistentReducer(
    initialPerson,
    personReducer,
    comparePersons,
    savePerson
);
```

The way it works differs from the normal `useReducer` in one very important respect: if the user has not recently dispatched any actions, and so there are no pending (unsaved) actions here, the returned `person` state is precisely the same object passed in as `initialPerson`. So if your user is passively watching the screen, and other users are making changes (which are making their way to your user via notifications on the websocket), then your user will see the `Person` updating in realtime. It doesn't get stuck on an old state.

If your user dispatches one or more actions, the returned `person` is no longer the same object passed in as `initialPerson`. Rather, it is a derived object resulting from applying the reducer function to `initialPerson` as it was when the first action was performed. A background save will be attempted soon however, and when it succeeds, the server will notify all clients (including this one) via the websocket that the person has been updated, and this client will fetch the new version and so re-render the hook with the new `personReducer`. Also the `usePersistentReducer` can now happily discard its list of pending actions, and revert to returning whatever `personReducer` object it receives as its first parameter. Normality is restored!

Here's how the hook is implemented:

```ts
function peristentReducerState<S, A>(initialState: S, setEditingState: ) {
    let timer: number | undefined = undefined;
    let editingState = initialState;
    let passiveState = initialState;
    let pendingActions: A[] = [];

    async function attemptSave() {
        const result = await save(editingState);
        if (result.succeeded) {
            // It was accepted as a new version so we can discard our pending actions and update our local
            pendingActions = [];
            timer = undefined;
            setEditingState(result.current);
        } else if (result.current) {
            // It was rejected and we got back the latest version which we should "rebase" on to
            setEditingState(
                stateRef.current.pendingActions.reduce(
                    (state: S, action: A) => reducer(state, action),
                    result.current
                )
            );
            // Do another save soon
            stateRef.current.timer = window.setTimeout(attemptSave, delayMs);
        }
    }

    // Make dispatch appear stable ----- but this depends on initialState??

    const dispatch = useCallback(
        (action: A) => {
            // If this is the first action since we last saved, make sure our editingState matches the initialState
            setEditingState((previous) =>
                stateRef.current.pendingActions.length === 0
                    ? reducer(initialState, action)
                    : reducer(previous, action)
            );
            // Store the action so we can replay it if necessary
            stateRef.current.pendingActions.push(action);
            // Save soon
            if (stateRef.current.timer !== undefined) {
                window.clearTimeout(stateRef.current.timer);
            }
            stateRef.current.timer = window.setTimeout(attemptSave, delayMs);
        },
        [stateRef]
    );
}

export function usePersistentReducer<S, A>(
    initialState: S,
    reducer: Reducer<S, A>,
    compare: (s1: S, s2: S) => number,
    save: (updated: S) => Promise<PersistentUpdateResult<S>>,
    delayMs = 50
): readonly [S, (a: A) => void] {
    const [editingState, setEditingState] = useState(initialState);

    // Keep details of unsaved actions in a ref so our delayed saves always see the latest situation
    const stateRef = useRef<{
        timer: number | undefined;
        editingState: S;
        pendingActions: A[];
    }>({ timer: undefined, editingState, pendingActions: [] });
    stateRef.current.editingState = editingState;



    // If no unsaved changes, return the initialState itself (another user might change it at any time)
    const returnedState =
        stateRef.current.pendingActions.length !== 0 ||
        compare(editingState, initialState) > 0
            ? editingState
            : initialState;

    return [returnedState, dispatch] as const;
}
```

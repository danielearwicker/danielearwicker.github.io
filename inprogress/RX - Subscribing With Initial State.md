tags: reactive
date: 2017-01-28

If object A is maintaining state that is frequently changing, and elsewhere you want to design an object B which needs to follow that state somehow (in the simplest cases mirroring it, or more usefully, transforming it and summarising it) there are two parts to the problem:

1. B needs to get the initial state of A when it first latches on to it.
2. B needs to get notified when the state of A changes so it can keep up to date.

What makes this tricky is concurrency. Suppose B fetches the initial state, then subscribes. Between these two steps A could notify a change which would be lost, so that's a disaster. How about if B subscribes first and then gets the state? Now we have the opposite problem: events arriving as we are processing the initial state and no idea when they become worth paying attention to.

One way around this is for A to increment a counter each time its state changes, effectively the version number of the state, and for this version to be returned in every notification and state query. This has added advantages of enabling robustness even over poor quality links or where notifications might arrive in the wrong order or be duplicated or dropped.

But more simply, the problem of concurrency during initialization can be solved by combining the two parts into one: B subscribes to A for notifications and as a result of this, A immediately dumps out a set of notifications that bring B up to date (this could be the complete history of events so far, or it could be a minimal set of "add" notifications).

So A does not need to expose a query mechanism; subscribing for notifications is enough, as long as each new subscribed initially gets a little flood of notifications that describe the current state.




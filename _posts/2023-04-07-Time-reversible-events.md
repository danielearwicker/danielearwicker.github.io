---
tags: events
date: 2023-04-07
layout: post
title: Time reversible events
---

The current state of a system might be represented by the contents of a database table. The table could have many columns of various data types, but to simplify we'll say there is only a single integer column, so our table is just a list of integers. (Each integer could in reality be a foreign key into another table holding immutable and distinct tuples, each describing a frozen configuration of a more interesting entity such as a person, a medical record and so on. So we can make this simplification without loss of generality.)

We can describe the history of the table's state by creating another table in which the rows represent _events_. Of course in a database we need to think about atomic transactions; some kinds of change may not make sense by themselves and must always occur atomically as part of a transaction along with certain related changes. Therefore an event always belongs to a _batch_, and a batch may contain multiple events. Batches occur in a definite order, so we can number them (that is, the primary key of a batch is a sequence number). A batch is also the ideal place to record the clock time that the events in the batch were applied.

Aside from the `batch_id` an event has just two columns:

-   the `value` that would appear in the current state table
-   a bit `added` that is 1 (true) if the value was added or 0 (false) if it was removed (the only other possible event in such a simple system)

Given this table, we can begin with an empty state table, and "play back" the changes, inserting the `value` if `added` is 1 and removing it if `added` is 0, and we will reconstruct the latest state.

When deleting, we remove one instance of the specified `value`; any two instances of the same `value` are equivalent so it doesn't matter which we delete. All that matters is how many instances there are. Generally is possible that the events in a batch might arrive at a net effect by some redundant route:

| `value` | `added` |
| :-----: | :-----: |
|    3    |    1    |
|    3    |    0    |
|    3    |    0    |
|    3    |    1    |
|    3    |    1    |

This has the net effect of adding 3, as there is one more added than removed. The only danger with such a situation is that order in which the events are replayed is important, as if all the removes were performed first, this could imply that `3` occurs a negative number of times in the state table! But such a batch could be simplified at the point of its creation to remove both the unnecessary events and also this problem.

To be certain that our events describe the complete history, it would be safest to never directly update the state table, but instead write a batch of events and then execute that batch as described above. The event table is the definitive record of what has occurred. The latest state, arrived at by executing the events, is merely a convenient representation _derived_ from the events.

And if we are mostly interested in recent past states, we would prefer to start with the latest state and "rewind" back to a recent past state, if only because this is a shorter journey than starting from the ever-more-distant empty initial state and playing forward. Fortunately our events have an interesting property: we can flip the `added` bit, setting it to `1 - added`. This makes each "add" into a "remove" and vice versa.

This backward time travel can be implemented easily by making our algorithm for playing back events accept an `undo` bit parameter. An event causes an insertion if `added != undo`, and it causes a removal if `added == undo`. Think it through:

-   playing forwards: `undo` is 0, and so `added != 0` implies adding, while `added == 0` implies removal, as we originally said.
-   playing backwards: `undo` is 1, and so `added != 1` implies adding, while `added == 1` implies removal, so `added` has the opposite meaning.

There's an amusing similarity here with quantum field theory, in which a positron can be thought of as an electron moving backward through time.

What makes an event stream time-reversible? There must be no loss of information. In databases we often avoid immutable approaches, and instead overwrite values in existing records. To support this we nominate one column to be immutable so it can act as the primary key. An event that says:

> In row 15, change `last_name` to `"Smith"`

is _destructive_, as the previous value is lost. The destruction of information rules out reversibility. But capturing it as:

> In row 15, change `last_name` from `"Jones"` to `"Smith"`

is enough to restore reversibility. To convert to an undo operation, we simply swap the values in the _from_ and _to_ slots. No doubt we will also support a delete event, in which case the event will have to capture its entire contents:

> Delete row 15, in which `last_name` is `"Smith"`, `first_name` is...

When that event is reversed, it becomes:

> Insert row 15, in which `last_name` is `"Smith"`, `first_name` is...

(Note that the primary key 15 has to be retained, as there must be at least one other event in the past referring to row 15, so we can't use the popular RDBMS feature that creates a new key from a counter on each insert.)

The rules for how to time-reverse an event may appear haphazard, but really they are perfectly consistent. The "change" event is really two events, one that removes a value and the other that adds, so in every case we are in fact turning add into remove and vice versa.

Even so, in the simpler scheme where our current state is just integers (which are foreign keys into another table holding immutable records, retaining every distinct combination of values we've ever encountered), this quite involved event vocabulary is unnecessary.

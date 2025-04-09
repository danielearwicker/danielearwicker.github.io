---
tags: Ember React TypeScript MobX 
date: 2018-03-18
layout: post
title: "From Ember to React, Part 2: Baby, Bathwater, Routing, etc."
---

_Abstract_: Last time, which was too long ago, I explained why Ember is terrible and must be burnt to the ground. This time I'll begin to explain why it's not actually all terrible and we should run back into the burning building to rescue the good parts. This will lead us to answer the question: can React Router be used with MobX?

-   [From Ember to React, Part 1: Why Not Ember?](../../2017/Ember-React-1)
-   _From Ember to React, Part 2: Baby, Bathwater, Routing, etc._

# Magic

A lot of the good parts of Ember are replaced, but made much better, by [MobX](https://github.com/mobxjs/mobx), which is a small library that has a huge impact. I've introduced people to it and seen them become _giddy_ at how easy things suddenly become.

As we replace Ember with React, and we find it a much more sparse and simple offering, MobX fills an extraordinary number of gaps. A lot of the "magic" in Ember, things that update automatically and so on, is just repeated application of the core ideas of reactive programming. By applying them ourselves explicitly, they become clearer, less magical but no less powerful and helpful.

# Routing

Web apps obey the address bar, or (in fancy terms) the web app is in some sense a _projection_ of the address bar. The address bar says where we are in the app. To ensure consistency, if some part of the UI serves as a doorway to get to another place, it should _not_ directly update the UI. It should update the address bar, and then that should have the effect of causing the navigation to occur. This sequence of cause and effect is important because it guarantees that pasting a URL into the address bar will also work as a way to get there: external links, bookmarks and history will all work as expected.

This is enforced by using routes and links in your app. Actual `<a>` elements are best, if you can stick to them, because they also afford the expected right-click-open-in-new-tab behaviour. Failing that, use `history.pushState` to set the `location` to the new address. The rest should be done by handling routes. A routing library is just a pattern for handling an event when the address bar changes.

Ember has a pattern for doing this which (like a few other things in Ember) is driven by how your lay out your source files.

React has nothing built-in for routing, because it doesn't need to. It's designed to do one thing very well, as part of an ecosystem of libraries in `npm`. Probably the most popular routing solution in React is [react-router](https://reacttraining.com/react-router/). Let's go with it, because it's very simple at heart: the `Route` element is really just a disguised `if` statement. React Router is well known and should be unsurprising...

Well, there are some things about it that may come as a surprise.

## Query Strings

First, it completely ignores the query string portion of the URL, a.k.a. `location.search`. That is, in a URL such as `https://mysite/store/tshirts?size=large`, `react-router` is only interested in `/store/tshirts`. It pays no attention to the `?` and what comes after it. This was a change in version 4 and so you can [find a lot of people bellyaching about it here](https://github.com/ReactTraining/react-router/issues/4410).

The bellyachers think that all parts of the URL ought to be treated the same way. The authors of React Router don't think so. Neither did the authors of Ember. I think you could argue it several ways. Yes, `/store/tshirts` is a place, but isn't `?size=large` essentially the "place" where we keep the large T-Shirts? Well, if it is we should call it `/store/tshirts/large`. It's not a place, but rather a filtered view of a place. We want it to behave like a place in some ways, because we've mentioned it in our address bar. But we also want to clarify that it is less solid than a place, because it can be combined with `&color=red` and various other criteria, in whatever order. Ultimately these distinctions are fragile choices driven by our mental model of one small part of the world. But the `?` part of the URL has a distinct purpose. It is not path-like; it's a bag of name/value pairs separated by `&`.

In Ember, there is (of course) some built-in magic. If the user navigates to `/store/tshirts` and then adjusts their filtering options so the address becomes `/store/tshirts?size=large`, and then they navigate away to `/store/houseplants`, Ember secretly holds onto that `?size=large` somewhere. They call it [Sticky Query Parameter Values](https://guides.emberjs.com/v2.13.0/routing/query-params/#toc_sticky-query-param-values). It means that links going back to `/store/tshirts` will automatically go to `/store/tshirts?size=large`. This is opinionated, but it's a reasonable opinion: query params are filter settings specific to a path, and when we leave a room it shouldn't magically tidy itself back to a starting state. It should remain as we left it, so we can come back to it and find it the same. So this is really unmagic.

I will return to this in part three, because first we have to deal with a more basic issue.

## Update Blocking

This is the guilty secret of React Router, but if you read far enough [you can find a full confession](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/guides/blocked-updates.md). Unfortunately the library's whole approach depends on an assumption that isn't reliable, and it would be a deal breaker if we couldn't fix it. But fortunately we can.

To clarify why this is important, what they call "update blocking components" really should be all components. React performs much better if components only re-render when they need to. This is one of the excellent things about `mobx-react`. Wrapping your components with `@observer` automatically means that they only update when there is a change of the values of props or observable data. This is not the default behaviour of React components (though [PureComponent](https://reactjs.org/docs/react-api.html#reactpurecomponent) does something similar). React Router is broken by this; any conditional rendering using the `Route` component can only be re-evaluated if a render takes place. That means the enclosing component has to re-render. And why should any component re-render just because the address bar has changed?

That question is the clue to the answer: the current location should be an observable. If it changes then anything dependent on it should change; so in turn the `Route` component should be an `@observer`. The address bar would be like a two-way bound text field for an observable `location.href`. Then everything would be fine. If only MobX was built into browsers, eh?

## Routing Backwards

The creator of MobX wrote [a nice post on this subject](https://hackernoon.com/how-to-decouple-state-and-ui-a-k-a-you-dont-need-componentwillmount-cc90b787aa37). He rolls a custom routing solution with three parts:

1. A view-model of observable properties that describe the current state, including `currentView` which corresponds to the path of the route.
2. An off-the-shelf non-React specific router library, [director](https://github.com/flatiron/director), which describes how to map from locations to actions that update the view-model.
3. A computed `currentPath` property that defines what the address bar should contain right now, derived from the view-model.

So the mapping between view-model and address bar has to be described twice, once for each direction. Here's mapping path changes to update actions:

```ts
const router = new Router({
    "/document/:documentId": (id) => store.showDocument(id),
    "/document/": () => store.showOverview(),
});
```

And here's the reverse, computing `currentPath` from the view-model (which is observed by an `autorun` that copies the value into the address bar if it doesn't match what's already there):

```ts
@computed get currentPath() {
    switch(this.currentView.name) {
        case "overview": return "/document/"
        case "document": return `/document/${this.currentView.documentId}`
    }
}
```

On the plus side, this means that rather than following the rule that the app navigates by changing the address, it can do so by changing the view-model. This moves you out of dealing with URL syntax and into a high-level vocabulary of actions and state, which can be statically typed. Changing the view model will automatically have the side-effect of updating the address bar.

But on the other hand, the majority of navigations will (should?) be user-driven, and will be triggered by links in the rendered UI. These should as much as possible be real `<a>` links, so the browser's standard behaviour can be exhibited. Those links need address strings to link to. So that's a third place where we need to encode the relationship between view-model and address strings. All these must be kept consistent.

If we take this approach, we'd discard the unidirectional principle: that the web app's visible location is a projection of the state of the address bar. We could unintentionally introduce a way for the app to update the address bar that would not have the same effect if the address was pasted into a new browser window. The discipline of making the address bar be in the "driving seat" forces us to ensure consistency, by making it necessary for us to encode everything about the new desired state into the address string.

We can restore the primacy of the address bar. Instead of using an `autorun` to copy a computed address to the address bar, we can do the opposite: maintain an observable value of the current location and copy from the address bar into that observable any time the address bar is changed:

```ts
const locationStore = observable.box(history.location);

history.listen((location) => locationStore.set(location));
```

(In strict mode, a.k.a. `enforceActions`, you'd need a `runInAction` in there). Now we could write computed properties that derive a high-level description of the current state from the current location. The only time we go the other way is when we generate address strings to go in links.

And now we can also rescue React Router. It's really simple:

```ts
type OptionalLocation = { location?: H.Location };

// HOC that injects the observed location as a prop
function locationObserver<P extends OptionalLocation>(
    C: React.ComponentClass<P>
) {
    return observer((props: P) => (
        <C {...props} location={locationStore.get()} />
    ));
}

// Wrap the standard RR components so they properly observe the location
export const Route = locationObserver<RouteProps>(Route_);
export const Switch = locationObserver<SwitchProps>(Switch_);
export const NavLink = locationObserver<NavLinkProps>(NavLink_);
```

Remember how I said `Route` should be an observer? Well, now it is. We just use the wrapped versions of the `Route`, `Switch` and `NavLink` components. They behave exactly like the originals, passing through the same properties, except that the `location` is pulled from our global `locationStore` and passed in as a prop. So any rendering decisions based on the location will be re-evaluated automatically when the location changes. Any `Route`s and `NavLink`s scattered around the page will magically (and minimally) update themselves whenever necessary. The update blocking problem is no longer an issue.

Note that we only have to wrap those components that accept a `location` property, and hence depend on the location. For example, `NavLink` does this so it can add an `active` class to links if they match the current location, just like the corresponding Ember feature. When I first looked at this last year, [someone else had fortunately just come the same way](https://github.com/ReactTraining/react-router/issues/4910), though as you can see I did have to update the type definition.

One of the points made in Michel's post was how the React Router approach makes us use `componentWillMount` to detect route changes and use them to update our view model. As Michel puts it:

> That doesn’t look like our UI is a function of our state. It looks more like our state is initially function of our components.

I don't think that's necessarily true. Our state _includes_ the address bar. How we interpret the address bar is a presentational problem. So the mapping from address string to view-model updates is encoded in our components. This doesn't seem wrong to me; components are for declaring presentation, and the address string is an externally exposed part of the UI in all webapps. And as we've seen, due to the need to include links in the UI, components are naturally the place where we'll create mappings in the opposite direction whenever we build an address string for a link.

All this means is that we've chosen to put all the stuff to do with encoding view-model state as address strings into the components. This can look messy or tidy depending on how we do it.

To explicitly follow the pattern, we write something like an `updateState` method that accepts props, and we add this bit of boilerplate:

```ts
componentDidMount() {
    this.updateState(this.props);
}

componentWillReceiveProps(nextProps: T) {
    this.updateState(nextProps);
}
```

This is messy, but it's just because the React lifecycle gives us two entry points by which props can arrive, in slightly different ways, because it's a low-level API. Of course, we can eliminate that boilerplate with an HOC:

```ts
export function observerOfProps<Props>(
    component: (props: Props) => JSX.Element,
    onProps: (props: Readonly<Props>) => void
): React.ComponentClass<Props> {
    const Observer = observer(component);

    class WithProps extends React.Component<Props> {
        componentDidMount() {
            onProps(this.props);
        }

        componentWillReceiveProps(props: Readonly<Props>) {
            onProps(props);
        }

        render(): JSX.Element {
            return <Observer {...this.props} />;
        }
    }

    return WithProps;
}
```

This can be used instead of `observer` as a wrapper around stateless components, accepting a second function that is called whenever props are applied, so the view-model can be updated:

```ts
const DocumentEditor = observerOfProps(
    renderDocumentEditor,
    ({ viewModel, docId }) => viewModel.loadDocument(docId)
);
```

This, combined with the above `observer`-powered versions of `Route`, etc., gives us a neat way of combining MobX with React Router, concentrating all handling of address strings in the presentation layer, and obeying the unidirectional pattern, so that our app's apparent location is a projection of the string in the address bar.

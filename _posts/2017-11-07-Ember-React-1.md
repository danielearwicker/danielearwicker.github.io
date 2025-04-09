---
tags: Ember React TypeScript MobX 
date: 2017-11-07
layout: post
title: "From Ember to React, Part 1: Why Not Ember?"
---

_Abstract_: We just replaced our entire Ember codebase with a new one written in React, TypeScript and MobX. It was a pretty engrossing couple of weeks. THIS IS OUR STORY.

-   _From Ember to React, Part 1: Why Not Ember?_
-   [From Ember to React, Part 2: Baby, Bathwater, Routing etc.](../../2018/Ember-React-2)

# Background

Feel free to skim this part. It's just scene setting: how I came to even evaluate Ember in the first place.

A few months ago [I joined FISCAL](http://www.fiscaltechnologies.com/news/pr/pr11-08-17.html) to pitch in and help to _"bend technology to our will"_, as [our CTO](https://durdle.com/) puts it. It turns out that this [quite often involves LEGO](http://www.fiscaltechnologies.com/lego/), which I could hardly be more pleased about. But sometimes we work on software too.

Before I showed up the team had already begun to put together a brand new, from-the-ground-up next generation product, designed to deliver the same kind of features as FISCAL's existing line up but with a much more user-focused experience.

They struck a smart balance between using familiar technology and staying up-to-date. So for example, the backend REST API is a cloud-hosted .NET Core 2.0 Web App, which is bang up-to-date and is just about the ideal environment for writing such a service (C# is a fine language, and Microsoft's debugging experience is always second to none). On the other hand, the data layer is grounded in Azure SQL Server. There are so many exotic NoSQL alternatives now, but the familiarity of a traditional RDBMS has a lot to recommend it. That said, we are eschewing stored procs (no protests from me there...) and using the latest `EntityFramework`, which has settled down into something fairly simple and minimal, at least compared with the monstrosity that was `.edmx` "model first"... _(shudder)_.

One place where the team stuck with something familiar was the UI. They started building a completely separate single page Web App with [CORS access](https://docs.microsoft.com/en-us/aspnet/core/security/cors) to the API, and they went with Ember as the framework, as they'd used it before.

I hadn't used Ember and so was very interested in having a chance to evaluate it in a real project. So in the usual way I threw myself into implementing features that cut vertically through the whole stack. One very cool thing about this was that, instead of the usual multi-month release cycle I'm used to from on-premise deployment, here we deploy to the cloud at the end of every sprint, a few hours after demoing the features to our colleagues inside the business.

After a month or two, I was Ember-aware.

# Why not Ember?

This is probably going to seem unrelentingly negative. Spoiler alert: we dropped Ember!

But I want to stress that I found it possible to be productive in Ember. It faces challenges on so many fronts simultaneously, and its maintainers face a difficult, frustrating task. They are very careful about continuing to serve the needs of their existing users. This is definitely the right thing to be doing _for those users_. So there's no question that Ember has to continue to be Ember for the foreseeable future. The question is whether a new project, starting now, should choose it as a basis.

Ember is old, but hey, so am I, and I'm awesome! This is not always a bad thing. JavaScript is going from strength to strength having first appeared in 1995. But if a framework is created _just before_ a big wave of change comes along, allowing just long enough for the framework to build up a user community who don't want to rewrite all their code, it can be left looking kind of ridiculous to new users. So it is with Ember. It has its roots in [Sproutcore](http://sproutcore.com/about/), which was an early (2007) pioneer in the art of taking the browser seriously as a app platform. It has certainly evolved in the meantime, but it has been deliberately conservative about it.

Many of what follows are examples of old stuff that is hanging around and keeping Ember stuck in the past, for backward compatibility reasons that are of no interest to anyone starting a new project now.

## Getters and Setters

Ember bears the scars of being designed in the dark times of IE 8 and before. It doesn't even support that browser anymore, yet you can tell it once had to. It brings it up all the time. "We had to suffer back then! Why should it be different for you kids?"

In JS, if you want to get the value of a property `p` from an object `o`, you say `o.p`. What if a framework wants to do something clever behind the scenes to fetch the property value? Modern browsers all support custom property getter/setters to make this seamless, but IE 8 and earlier did not.

The brute force approach is to mandate that property access should look like this: `o.get("p")`. So now the `get` function can do whatever it wants, and users get the fun of writing ugly code. Better still, code written that way will not work on ordinary objects. In order to be dual purpose you need to write `Ember.get(o, "p")`. If you forget to do this, your code will sometimes work.

Or you could just, y'know, not.

## Classes

Modern JavaScript has built-in support via the `class` and `extends` keywords, but ten years ago it was all the rage to invent a system of helper functions to mimic classical inheritance.

Ember has this. It underpins how you do everything. [The Ember team is currently working on](https://github.com/emberjs/rfcs/blob/master/text/0240-es-classes.md) a way to use `class` and `extends` within Ember, but of course it's necessarily a gradual, cautious process ("The Ember Object model will remain exactly the same as today, and will continue to be the recommended path for Ember users.")

## Extensions and packages

Around five years ago it was briefly fashionable to invent component repositories for client-side JS libraries. The most popular was [Bower](https://bower.io), and there was another called `component`. Now these things are [totally over](https://bower.io/blog/2017/how-to-migrate-away-from-bower/), because as [some of us pointed out](https://serverfault.com/a/528250), `npm` is a general purpose JS repository, so why not use it for client stuff too?

Sadly, Ember bet heavily on Bower. When I found an `npm` package I wanted to use, I tried following [the instructions](https://simplabs.com/blog/2017/02/13/npm-libs-in-ember-cli.html). I know the idea isn't to be _actively hostile_ to users trying to do this... it just felt like it.

## Modules

Breaking our apps up into modules is a must, of course, and this was an area where various approaches fought in the ideas marketplace for a few years, and eventually JS itself adopted a syntax for importing and exporting modular features, which most of us use via transpilers like TS and Babel, with Webpack bundling the modules together into a single .js file (I fondly remember writing my own CommonJS bundler in the days before Webpack).

This is one area where Ember actually supports the normal modern way of doing things pretty seamlessly! Kudos. But at the same time, it has its own magical way of finding and loading modules, e.g. the Ember router maps the path in the address bar directly to the modules in your source tree.

This is more cute than helpful. It's not actually that troublesome to explicitly import modules, and there are advantages in having one simple standard way for modules to depend on each other, so (for example) refactoring features in your code editor can track your dependencies for you. Ember's magic is unknown to such features.

## External template language

Prior to React, it would hardly be necessary to point this out; all the frameworks worked this way. One reason people like it is because it "separates view from logic".

This is a myth. Templates always end up having some logic in them, because they always support loops, conditionals, concatenation, and all manner of custom extensions. So of course StackOverflow consists mostly of people asking "How can I do X in framework Y?" where X is something they already know how to do in plain JavaScript, and Y is the new bane of their existence.

Perhaps it's not until you've really tried React that you even realise what strange and unnecessary diversions these external templates are. The genius of JSX is that it is the most minimal possible extension of JS. So when you start using it, you already know how to do functions, variables, loops, conditionals, code reuse, formatting strings, modules, namespacing and so on.

TypeScript opens up another front on which JSX has the edge on external templates: it is statically type checked by the TS compiler, just like the rest of your code. Yes, code editors can be enhanced to do type checking in external templates (and TS already supports this for a few frameworks, though not Ember), but it's never as seamless and automatic as JSX.

## CRUD data management

There's a thing called Ember Data which, in terms of the value it provides, is really just a cache for data retrieved from the server. That's quite a simple thing to implement though. Ember Data is way more complex and restrictive than that. It effectively assumes CRUD operations will be taking place on records of various types. To tell it how to make calls to your backend, you write an adaptor, and there are several pre-existing ones to base your work on.

To me this seems like a case of taking something that is pretty simple and standardised these days (calling `fetch` to perform REST calls to your API) and wrapping it in something that doesn't really make it simpler. It just makes it equally complex in a different way; and if something goes wrong you have to dig through the internals of Ember Data to figure out what's up.

It does do some neat things with its cache, but these are also straightforward to implement if you have a good implementation of reactive data.

## Not-so-good reactive data

Elsewhere on this blog you'll find me waxing lyrical about [MobX](https://github.com/mobxjs/mobx). It's great. Before that I used
[Knockout.js](http://knockoutjs.com/) which was similar conceptually but, like Ember, IE8-vintage. The thing they have in common is something called a `computed`, which is a value that is produced by a pure function of some other values that may change at any time. When they change, the `computed` automatically re-evaluates itself. A `computed` can depend on other `computed`s. It's a very powerful, very easy, spreadsheet-like way to create derived data that stays consistent as the ultimate source data changes and performs minimal recomputation.

Ember itself has this, but it's quite unnecessarily crummy. When you create a `computed` in Ember, you have to give it a list of the names (strings) of all the observable data values it will depend on. A very common bug is to forget to manually add the name to the list whenever you change the evaluation function, so your computed no longer updates when it should.

Both MobX and the ancient Knockout.js automatically figure out the dependencies for you.

## TypeScript

This is the really big one. I can't do better than direct you to [this great series of blog posts](http://www.chriskrycho.com/2017/typing-your-ember-part-1.html), and the TL;DR is in part three:

> Let’s get this out of the way up front: right now, using types in anything which extends `Ember.Object` is going to be a lot of work for a relatively low reward.

He goes on to suggest that right now the best way to take advantage of TypeScript is to write most of your code in such a way that it doesn't depend on Ember. That's pretty much the way I'm leaning here...

# Conclusion

... except I go a little further and say that, considering all the other parts of Ember that have better alternatives now, maybe don't use Ember at all.

Just as IE 8 is the very best browser in the world at running apps that only work in IE 8, so Ember is the framework for you if you already have a gazllion lines of Ember code that you're maintaining. Long may it continue to support its users.

It could well be that over the next few years, Ember evolves into something radically different and more modern, and the most heavily invested Ember users will be able to gradually migrate to the new approaches.

For the rest of us, there's already:

-   [React](https://reactjs.org/) for state-of-the-art UI templating
-   [TypeScript](https://www.typescriptlang.org/) for static typing and transpiling
-   [Webpack](https://webpack.js.org/) for bundling modules and other stuff
-   [MobX](https://github.com/mobxjs/mobx) for practically perfect reactive data modeling
-   [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) has happened

In fact you can get the first three of these up and running, along with linting, unit testing, development server and production build minifying, by using [create-react-app in TypeScript mode](https://github.com/wmonk/create-react-app-typescript):

```bash
npm install -g create-react-app

create-react-app my-app --scripts-version=react-scripts-ts
cd my-app/
npm start
```

In Part 2, I'll consider a few neat things built into Ember that need alternatives in our brave new world.

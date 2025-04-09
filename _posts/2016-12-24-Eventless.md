---
tags: FRP functional reactive Eventless c#
date: 2016-12-24
layout: post
title: Eventless - XAML Flavoured
---

About four years ago, being so taken with data modeling approach used in
[Knockout.js](http://knockoutjs.com), I wanted to
[recreate it for C#](https://smellegantcode.wordpress.com/2013/02/25/eventless-programming-part-1-why-the-heck/).
At the time I wasn't actively using C# so I never got to really use it and left it alone.

But in the last year and a half I've written a few view models for a WPF application. The first time
I did it I couldn't believe how primitive and laborious it was in comparison. So I started idly
messing with Eventless in my spare time - mostly deleting stuff - to make it XAML-friendly.

Just like Knockout, and now [MobX](https://github.com/mobxjs/mobx), it makes the process delightfully simple. You just declare stuff and it works!

[Fork away!](https://github.com/danielearwicker/eventless)

Or just install it via [nuget](https://www.nuget.org/packages/Eventless/). Also there is [complete API reference
documentation](http://earwicker.com/eventless/html/ca2f21b1-fdbc-4b93-8fc1-051fdf574854.htm).

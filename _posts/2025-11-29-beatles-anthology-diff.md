---
tags: beatles ai
date: 2025-11-29
title: Diffing the Beatles Anthology
layout: post
---

As a life-long Beatles nerd (my earliest memory is connected with listening to their records) I was of course excited by the arrival of a new version of the Anthology documentary series. But I was only a few minutes into Episode 1 when I began to get a curious feeling of disorientation. Confession: I have watched the DVD release from 2003 _quite a few times_. And before that I had the same edition on VHS since the 90s, which I'd also watched obsessively. The only change between those two versions, as far as I'm aware, was the soundtrack being remastered. But this new 2025 version felt strangely altered, so much so that it was starting to make me almost itch with curiosity about just how many changes had been made. So I "rewound" (as we used to say) to the start and played the DVD version along with it in parallel.

_It's completely different!_ And yet, that's not quite right either, because obviously there is a huge amount of the same material. It's like a new documentary that draws on the same sources. Well, no, that's not really true either because the two versions share whole sequences lasting a few minutes that take the same set of sources and cut between them in the same way. Except... that's not exactly accurate because the new version cuts between them in a different way (it uses simple edits instead of the slow fades favoured by the 90s version), meaning that the whole thing really has been rebuilt from scratch, sometimes closely following the old model but at other times liberally ignoring it.

As I kept watching, I found they diverged very frequently. The material had been totally resequenced, as well as cleaned up. I wondered how deep this went. The first episode has a striking moment based on a scene from _Help!_ where the boys are riding in circles on bicycles and girding themselves to "go back and get 'em", and one of these urgings from John is edited into a rapid loop, so he says "let's go back 'n back 'n back 'n..." about a hundred times as photos flash before us, taking us back through time from the end of the Beatles to their various infancies.

In a moment of madness I took a crummy video of this sequence from the new Disney+ version using my phone, and dragged it and the DVD version into Final Cut so I could line them up and easily step through frame by frame to see if the photos were different. Many of them were. For example, stills from the _Let it Be_ movie had been replaced with cleaned-up versions from the recent Peter Jackson restoration, and others had been similarly enhanced or possibly rescanned from better originals, and differently cropped. So even this sequence had been reconstructed from scratch - and it can't even be stepped through slowly on the Disney+ service! It's like those giant hollow columns in medieval cathedrals that were polished smooth on the inside, even though they would be sealed up forever.

Anyway, knowing how much was changed only worsened the itch. I wanted - no, needed - some kind of map that would show me how all the pieces had moved around, and, most importantly, which pieces were newly added and which old pieces had been discarded. This would be considerably easier if humanity would just come to its senses and use `git` for everything, including revising documentaries about themselves. But that's seemingly still some way off. In the meantime, could it be possible to construct something that visually represented a `diff` of the two versions? Clearly it could, and the first step would involve one of my favourite activities: watching the Beatles Anthology! Except this time with two markdown files open, one for each version, so I could write in them paragraphs of commentary and descriptions of footage, prefixed with approximate time stamps `MM:SS`.

I did this entirely manually for episode 1, and it took a surprisingly long time. But eventually I had the two files:

-   [1-dvd.md](../../../beatles-anthology-diffs/1-dvd.md)
-   [1-dplus.md](../../../beatles-anthology-diffs/1-dplus.md)

For example:

```
10:57 _Hound Dog_ live performance

11:24 Paul: "One of our favourite records around that time was one called _Searchin'_, by the Coasters"

11:26 _Searchin'_

11:49 George: "We got to hear people like Big Bill Broonzy, I think he might even have done a tour of England."

11:53 _When Did You Leave Heaven_
```

Between the two files, there was clearly some commonality. I considered actually just using `diff`, but then realised it would be too low-level. This is a process requiring some degree of intelligence and common sense and... wait a minute! Artificial Intelligence exists now. It could also take care of working out the details of how to present the results. That's the kind of thing I actually enjoy working out for myself, but I'm also fascinated by the ability of current AI to tackle such a problem.

Of course there is a huge amount of controversy and hype around AI, for a mix of reasons, some valid and some bogus. On the one hand AI-aligned CEOs haven't been shy about claiming the technology is on the verge of eliminating all jobs, [including their own](https://fortune.com/2025/02/03/klarna-ceo-ai-replacing-human-workers/), but another perspective holds that [AI is normal technology](https://knightcolumbia.org/content/ai-as-normal-technology), meaning that its impact will increase slowly over many decades, giving the economy time to reconfigure itself around this technological shift as it makes us all more productive. In recent years "The Beatles" (in the sense of the on-going project to both serve and exploit the group's legacy) has taken full advantage of various AI-based tools to rework old footage to create new documentaries, and to remix their music in ways that would have been impossible just a few years earlier.

So in that spirit I want to highlight a simple example of how AI can be applied today to make something useful, and depending on your own level of experience or what preconceptions you have gathered so far on AI, this may shed light on some surprising capabilities.

I fired up `claude`, [grabbed the mouse, and spoke clearly into it](https://youtu.be/hShY6xZWVGE):

> I have here two files that are selective transcripts in markdown, from the first episode of the Beatles Anthology, which I made by comparing the old version I have on DVD with the new version that came out to day on Disney+. I want to see if there's a good way to generate an HTML page that presents the two timelines side by side. Each item has a timecode. I'd like to align items according to their content being similar (some clips in the new version are alternate interview takes on the same topic), and to leave gaps where it helps the alignment. I also want to have some kind of arrows connecting the same (or mostly the same) items between the two sides. This is a challenge I think because SVG or absolute positioning would be the easiest way to overlay arrows, and yet the paragraphs of text need to be wrapped onto lines by the HTML engine, so their heights and (therefore positions) won't be fixed. Unless you know of a way to attach arrows to paragraphs in CSS, I think it requires a JS solution that gets the heights and positions of all the paragraphs, and repositions them to align them by content, and therefore knows the positions for the arrows. Does that sound practical?

I find I get the best results the more detailed my request is, and if I talk to it like it's a very competent contractor to whom I'm handing over some task. Anything I can think of that might be relevant, my own guesses for how it might be best implemented and so on. Also with a tool like Claude Code - which [isn't just for coding](https://www.lennysnewsletter.com/p/everyone-should-be-using-claude-code) - it is always very keen to read whatever files you mention and that gives it even more clues as to what you're getting at. It had a good look at my two markdown files and this provided it with a far deeper understanding of what I was asking it to do.

To provide you with all the context (why should you be denied what an AI would be given?):

- [Beatles Anthology Comparison](../../../beatles-anthology-diffs/comparison.html)
- [Source on Github](https://github.com/danielearwicker/beatles-anthology-diffs)

I didn't write any code for this _at all_. And yes, I know this is called [vibe coding](https://blog.collinsdictionary.com/language-lovers/collins-word-of-the-year-2025-ai-meets-authenticity-as-society-shifts/), but I think as well as being a ridiculous term in itself, I think it's extremely misleading, because I have to stress: _I didn't do any coding_. So whatever the activity is from my perspective, it's not _anything_ coding. I asked something else to do the coding for me, and it did that. I just said things like:

> I really like the look and the basic idea seems to have worked well in places. But I think the comparison of items isn't quite working. There are a lot of examples where the text is identical (apart from the time code) and yet they are not linked by arrows. Also I think the insertion of gaps isn't working either. There are some places where there are very large gaps on both sides, which serves no purpose. Would it help if you generated a separate file of metadata about the items, using your intelligence to do the comparisons and identify the most similar items between the two sides, such that that the JS could load that file in addition to the markdown and use the metadata to improve the results?

That was the second piece of input I provided. Claude's first attempt had taken an interesting approach where it:

- loaded the markdown files directly into the browser
- parsed them to get the lists of time-stamped items
- attempted to identify similar ones in JS code
- rendered Bezier-curve links between them

The smart thing about this approach is that I could easily tweak the markdown and the site would reflect my changes without any work. The weak thing about it was that the intelligent eye I'd hoped would look for similar items to link together had been replaced by a simplistic procedure written in JS, which had no intelligence at all. That's why I brought up the idea of a third file to specify the links, and tasked Claude with generating that file.

This is an absolutely key point about effective use of the current generation of AI: identifying where to divide responsibilities between AI and regular code. If you choose this well, you get something more effective than either, something that combines the _reliably correct_ nature of a formally-defined algorithm with the flexible application of common sense and understanding, grasping of the big picture, seeing how the present task fits within all human knowledge, but also negotiating all the various edge cases encountered on a more detailed level (what we might call "micro-creativity"). Social media is riddled with hilarious examples of AI getting basic things wrong, usually involving algebra. But such examples are little more than a failure to draw that dividing line in a good place. We laugh at AI for failing to do things that most of us can't do very reliably either. Professional mathematicians [get their minus-signs mixed up all the time](https://www.reddit.com/r/math/comments/1nz7s7e/how_often_do_mathematicians_and_scientists_make/). For decades now software has been doing the grunt work of analytical mathematics, such as algebra and solving differential equations.

In Futurama, Bender tries to do some accounting, becomes frustrated and says "I need a calculator." Fry says "You _are_ a calculator!". Bender replies, "I mean a _good_ calculator." Life has imitated art and gifted us not the often-imagined infallible artificial intelligence, but something more realistic. So use the right tool for the right job. You shouldn't ask AI to imitate a spreadsheet, any more than you'd try to fry eggs with a lawnmower. The difficulty is that you might not immediately realise that you're doing that, as we'll see.

The idea of capturing the result of the intelligent comparison in a third file has another side benefit - it makes it easy for me to tweak the results by hand to fix any shortcomings. Now, for the first episode this sadly turned out to be essential, because the result of Claude's effort was frankly pathetic. But I cracked this when I asked Claude to try again for the second episode:

> I'd like you to complete the `2-mapping.json` file with all the mappings between items between the two versions of episode 2. Last time I found many corrections had to be made, so this time I'd like you to first build a tool that generates a separate copy of each of the two timeline files in which each item has a zero-based index prefix before the time code. Hopefully this will make it easier for you to make the correct mappings. Also if an item only appears on one side, you don't need to include it in the mappings at all.

That is, buried within the task, there was one aspect of it - assigning an ordinal number to every item - that was like asking Claude to "be a spreadsheet". Over and over again with AI, you find that you can get the best results if you think of it like a person. It is unlike a person in many ways of course, but its shortcomings are very much like our own: faced with the task of examining two list of items and writing down a list of similar-looking items by referring to the two items by their position in the list, wouldn't you struggle with that a bit? I certainly would. How easy is it to _mentally_ keep track of the item numbers associated with the items as you scan both lists looking for similarities? You'd lose your place and get the number wrong, over and over. Claude is the same.

Obviously what a person would do in this situation is first go down each list and number the items: 0, 1, 2... And this is a job for a traditional robotic algorithm, not for an easily distracted intelligence. Of course, preparing the algorithm _is_ a job for an intelligence, and Claude made [a fine job of that](https://github.com/danielearwicker/beatles-anthology-diffs/blob/main/add-indices.js), and ran my files through that script to produce new files like this:

```
[18] 10:57 _Hound Dog_ live performance

[19] 11:24 Paul: "One of our favourite records around that time was one called _Searchin'_, by the Coasters"

[20] 11:26 _Searchin'_

[21] 11:49 George: "We got to hear people like Big Bill Broonzy, I think he might even have done a tour of England."

[22] 11:53 _When Did You Leave Heaven_
```

It then immediately went ahead and analysed those well-numbered files to produce a mapping file for episode 2. The result this time was essentially perfect.

To give you an idea of the features we accumulated during this exercise, I also prompted things like:

> could you make it so that when I hover with the mouse over an item, it dims the other arrows and highlights only the arrows from that item. Also when I click an item, the page should scroll to centre the corresponding item on the other column (if there are multiple, it should scroll to the first.)

and:

> It would be great if I could make a deep link to an item, i.e. by adding `#blah` to the end of the URL. The items could each be given an anchor like `dvd71` or `dplus16`, the number being their index just as we display in debug mode.

and even:

> Now I'd like to be ready to support adding multiple episodes. There can be a single comparison.html file and the hash could be broken into separate parts by an ampersand delimiter. For backward compat, if there is no ampersand, it assumes episode 1. If there is an ampersand, e.g. the URL ends `#3&dvd54` that means episode 3, scroll to dvd item 54. So each episode `N` has a `N-dplus.md`, `N-dvd.md` and `N-mapping.json` triplet of files.

At this point I have still barely opened the code file except to add some text at the top and also to switch the `SHOW_INDICES` flag on or off. Naturally this was a feature I asked for:

> Please could you add a temporary way to display item numbers next to the items so I can more easily make corrections to the right items. Would be good to do this as a switch variable in the code so it can be switched on/off easily.

If you want the full details, I got Claude to read its own log of the session and convert it into a human readable form:

-   [claude-session.md](https://github.com/danielearwicker/beatles-anthology-diffs/blob/main/claude-session.md)

You'll see quite a lot of distraction where I tried to get it to fix issues with the layout, but even including that I think I only gave it about 30 prompts overall.

Despite this excellent outcome of using AI to support my efforts, and saving me probably at least a day of coding by hand, the core activity remains the same: watching the two versions of the Anthology side by side, making notes, revising them as I get an idea of how the content has moved around, collapsing runs of items together where they appear as a near-identical sequence in both versions. This is very labour intensive. I enjoy watching the documentary, so this isn't a problem, but it is probably going to take me several weeks to have the time to do the remaining episodes in this way.

Therefore the question arises: could AI take on more of that work? In our Hollywood-fuelled imaginations we picture ourselves as Tony Stark, calling out to an unseen ambient talking computer, "Compare this with the DVD release and show me a parallel timeline of all the changes made" and it just assembles itself from nowhere. Science fiction, pah! But... _pah?_

One thing that made the production of the timelines so time-consuming is that I have to capture what is being said, manually typing it in. This involves repeatedly pausing and playing and typing. And then this is perhaps 50% wasted effort because there are many sequences that are identical between the versions. The problem is that they may be moved from near the start to near the end of the episode, so I don't know they're identical until long after I've done all that pausing and typing, only to reduce it down to this kind of combined entry covering nearly five minutes:

```
08:02 _There's a Place_ (gig locations fly up the screen as newly-rendered faux road signs), up to _It Won't Be Long_ montage of home movies during early tours, ending 12:42.
```

The obvious first step to lifting some of this burden is automatic transcription, something I considered at the start but decided to skip initially because have I mentioned how much I _like_ watching this story? Also this is another area where AI provides us with endless amusement as it mistranscribes what we say in meetings, so it is unlikely to do a perfect job. But that doesn't matter; I can always correct minor errors as I watch the episode (just watching and reading along to check the accuracy won't count as effort) I can easily extract the audio from the next episode of the DVD.

I asked Claude about transcription tools that could include timestamps, and it recommended `whisper`, so I told it get cracking. This turned out to be only somewhat helpful: it avoided the need to do so much raw transcribing by hand, but didn't eliminate the painstaking editing/reviewing process, and watching the two versions of each episode side-by-side to check for major visual changes, and also to identify who is speaking for each quote.

tags: webassembly wasm
date: 2017-03-28

It has recently been announced that the Big Four browser vendors have agreed on the definition of the first cut of the WebAssembly standard, the [Minimum Viable Product](http://webassembly.org/docs/mvp/), that they will all implement. This is a big deal, and on a nerd level I've been very interested to play with it and read about how it works.

This is quite different from using it habitually, however. Some JavaScript users may be wondering if this means it's time to switch to using C to build web apps. Let me explain why that's absolutely not the case right now. As a developer with fond memories of about 15 years using C++, I'm hopefully going to explain to you why you really need to run very fast in the opposite direction, screaming at the top of your voice.

First, an instructive quotation:

> *All through my life, I've always used the programming language that blended  best with the debugging system and operating system that I'm using. If I had a better debugger for language X, and if X went well with the operating system, I would be using that.* 
> 
> Donald Knuth

So we can predict that the first problem with the WebAssembly [MVP](http://webassembly.org/docs/mvp/), the lack of source-level debugging, will be solved fairly soon. Whenever source-maps stop working and I need to debug the JS output from my TypeScript, that's usually fine, as semantically they are mostly identical. But debugging low-level stack machine instructions, and trying to relate them back to my code, would be positively medieval.

But this is relatively trivial, short-term limitation.

One way we can distinguish between program languages is by how they treat memory. There's the "managed" way, used by JavaScript, Java, Python, Ruby, Smalltalk and tons of other languages going back to the great-granddaddy of them all, Lisp. Information is stored in little strongly-type pieces, definite numbers or strings or booleans, or more elaborate user-defined object types that are complexes, composed of smaller pieces. There are no instructions that allow any of this structure to be damaged at a low level. Every operation has a definite effect, and the declarations we make in our code are the absolute underlying reality we have to understand and deal with.

Then there's the unmanaged way, almost universally used by C and C++. Here memory is best understood as "linear", just a big byte array, each byte being addressable by a number. There is not necessarily any self-describing type information available, and so there is not necessarily any way to check at runtime if information is being misinterpreted. A bug can cause any part of memory to be scribbled on, therefore completely undermining anything else the source code says. You are free to misinterpret memory. Or to put it another way, there is no correct interpretation of a given region of memory! The declarations in your code are more like *suggestions*. They can contradict each other.

Some languages have a foot in both camps: C# is almost entirely managed but has rarely-used `unsafe` blocks inside which you can get at linear memory. Golang has something similar and also [something much worse](https://research.swtch.com/gorace).

WebAssembly is a bridge between these two worlds, with the JavaScript runtime acting as the managed world. [As the docs say](http://webassembly.org/docs/c-and-c++/#undefined-behavior):

> ... programs which invoke undefined behavior at the source language level may be compiled into WebAssembly programs which do anything else, including corrupting the contents of the application’s linear memory...

In other words, when your page's JS loads up a bit of WebAssembly, it is given a sandbox of linear memory to play with, outside which it cannot do any damage. 

But inside the sandbox, all bets are off. It can freely corrupt its own internal data structures. This is absolutely essential, strange as it may sound, in order to be able to compile the vast established canon of C code. Why?

A text string in C is just a region of memory that the code chooses to interpret as a string. It can be embedded inside some other structure:

```C
typedef struct 
{
    bool smoker;
    char first_name[40];
    char last_name[40];
    int pets;
} 
Tenant;
```

Code can perform arithmetic on pointers (adding an integer offset to a pointer) so as to locate a buffer buried inside a data structure. The syntax for accessing members and picking items from arrays is all just sugar around pointer arithmetic. Here's one way to get the first letter (assuming it fits in a single byte) of the `last_name`:

```C
Tenant *t = get_tenant();

char lastInitial = t->last_name[0];
```

As with any language, the fastest representation of this in machine code is for the compiler to figure how far away in bytes is the start of the `last_name` string from the start of the whole `Tenant` structure and just add that offset to `t` to get the address in memory of the first character. The difference with unmanaged languages like C is that you can do this kind of thing yourself by hand, and for some very common requirements it's the only way to get stuff done.

There's a standard macro called `offsetof` that returns an integer telling you how many bytes to add to the address of a `struct` to locate a member of it:

```C
offsetof(Tenant, last_name)
```

For the members of my `struct` it gives me:

```
smoker: 0
first_name: 1
last_name: 41
pets: 84
```

So now we know a `bool` is a single byte, because `first_name` begins immediately after it in memory. But note how `pets` doesn't start at 81 (41 + 40). This is because the compiler has "aligned" it on a multiple of 4, as otherwise it wouldn't be directly accessible on some CPU architectures (it would be fine on Intel though). This is the kind of crap you now have to pay attention to. Congratulations!

So with offsets, you can do your own arithmetic, giving us another way to get that initial letter:

```C
char *p = (char *)t;
p += offsetof(Tenant, last_name);
char lastInitial = *p;
```

I cast `t` into a pointer-to-`char` (which really just means pointer-to-byte) so then I can add the offset (which is in bytes) to the pointer. Then I can dereference with `*p` to get the value at that address. This kind of filth has to work. [The ANSI C99 standard](http://www.open-std.org/jtc1/sc22/wg14/www/docs/n1124.pdf) says:

> When a pointer to an object is converted to a pointer to a character type, the result points to the lowest addressed byte of the object. Successive increments of the result, up to the size of the object, yield pointers to the remaining bytes of the object.

This (along with related clauses about the representation of types) doesn't *require* that memory is one big linear array, but it does mean that any other representation would be ridiculously impractical. The only reason for designing a language this way is because you need it to be a very thin layer over linear memory. (And if you didn't need that, you'd be using a managed language.)

It also means that, where C programs perform operations that the language standard says produce undefined or implementation-defined behaviour, they are typically doing so in ways that, in practice, work absolutely fine. Real C programs do this stuff quite often, usually in the name of efficiency.

And also, they often [contain bugs that lie dormant for decades](http://heartbleed.com) and then one day are detected, scribbling on the wrong bit of memory, and so undermining every belief that the author of the code once held. It's really weird. Writing C code that doesn't corrupt its own data structures in linear memory is surprisingly difficult, even in code that *isn't* trying to be clever. Yet people still use C to write logic that doesn't need to be written in C.

Users of C++ (I know because I was one for so long) get very testy at the label *C/C++* that lumps both languages together into a category. But it is undeniable that they share a common basis in being unmanaged. C++ adds a ton of features, but it doesn't really subtract any. It also has a tendency in its new constructions to proudly carry the legacy of its unmanaged nature. This is based on an important principle of the language: if you're working under the constraints of [systems programming](https://en.wikipedia.org/wiki/System_programming), you still need pleasant, high-level abstractions like generic typing, type relationships, meta-programming and so on. You shouldn't have to accept *any* significant runtime cost, compared to C, to get these facilities.

In practice what this means is that C++ never strays far from its unmanaged heritage. The *reference* (as opposite to the *pointer*) is an elemental feature that distinguishes C++ from C, but it is deliberately a baby step. The only differences between a reference and a pointer are: 1. it cannot be rebound and 2. it automatically dereferences. It has all the same lifetime pitfalls: it may easily outlive the object it was bound to. In other words: no garbage collection.

My approach, on those rare occasions where I have to write something in C++, is onl
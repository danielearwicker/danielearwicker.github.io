tags: typescript
date: 2016-09-10

*Prompted by [this comment from Anders Hejlsberg](https://github.com/Microsoft/TypeScript/pull/10676#issuecomment-245653348).*

Something wonderful happened between `typescript@beta` and `typescript@rc` (i.e. just in time for version 2.0).

Way, way back in TypeScript 1.8 (February 2016!) we gained the ability to use string literals as types:

```ts
const str1: "hello" = "hello"; // fine
const str2: "hello" = "goodbye"; // type error
const str3: string = str1; // fine
```

The variables `str1` and `str2` are not just typed as `string`; they have to be specific strings. Seems useless
˜˜

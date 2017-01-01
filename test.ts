"use strict";

interface I {
    f(this: I): void;
}

function f(this: I) { 
    console.log(this === o, this === undefined);
}

const o = { f };

//f();
o.f();
o["f"]();

const f2 = o.f;
//f2();

interface Measurable {
    length(this: this): number;
}

class Vector {
    constructor(public x: number, public y: number) {}

    length(this: this) {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
}

const v: Measurable = new Vector(3, 4);
const m = { length: v.length };
console.log(m.length()); // Prints: NaN


function vector(x: number, y: number) {
    return {
        get x() { return x; },
        get y() { return y; },
        length() { return Math.sqrt(x*x + y*y); }
    };
}

const v2 = vector(3, 4);

console.log("l = " + v2.length());
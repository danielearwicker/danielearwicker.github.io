"use strict";
function f() {
    console.log(this === o, this === undefined);
}
var o = { f: f };
//f();
o.f();
o["f"]();
var f2 = o.f;
var Vector = (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    return Vector;
}());
var v = new Vector(3, 4);
var m = { length: v.length };
console.log(m.length()); // Prints: NaN
function vector(x, y) {
    return {
        get x() {
            return x;
        },
        get y() {
            return y;
        },
        length: function () {
            return Math.sqrt(x * x + y * y);
        }
    };
}
var v2 = vector(3, 4);
console.log("l = " + v2.length());

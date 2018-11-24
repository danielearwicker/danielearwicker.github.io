/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Sprite = (function () {
    function Sprite(x, y) {
        this.x = x;
        this.y = y;
    }
    return Sprite;
}());
exports.Sprite = Sprite;
function renderSprites(ctx, sprites, game) {
    for (var s = 0; s < sprites.length; s++) {
        var sprite = sprites[s];
        if (!sprite.move(game)) {
            sprites.splice(s, 1);
            s--;
        }
        else {
            sprite.draw(ctx);
        }
    }
}
exports.renderSprites = renderSprites;
function hitTest(game, first, second, handle) {
    for (var f = 0; f < first.length; f++) {
        for (var s = 0; s < second.length; s++) {
            var rect1 = first[f].rect(), rect2 = second[s].rect();
            if (rect1.left + rect1.width < rect2.left ||
                rect1.left > rect2.left + rect2.width ||
                rect1.top + rect1.height < rect2.top ||
                rect1.top > rect2.top + rect2.height ||
                !handle(first[f], second[s])) {
                continue;
            }
            first.splice(f, 1);
            second.splice(s, 1);
            f--;
            s--;
            break;
        }
    }
}
exports.hitTest = hitTest;
function runSprites(state, canvas, frame) {
    var ctx = canvas.getContext("2d");
    var oldTime = 0;
    var loop = function (time) {
        resize(canvas);
        state.width = ctx.canvas.width;
        state.height = ctx.canvas.height;
        if (oldTime !== 0) {
            state.elapsed = time - oldTime;
            frame(ctx);
        }
        oldTime = time;
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}
exports.runSprites = runSprites;
function resize(canvas) {
    var w = canvas.parentElement.clientWidth;
    if (canvas.width != w) {
        canvas.width = w;
    }
    var h = canvas.parentElement.clientHeight;
    if (canvas.height != h) {
        canvas.height = h;
    }
}


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function withinBounds(x, y, game) {
    return x < game.width && x > 0 && y < game.height && y > 0;
}
exports.withinBounds = withinBounds;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var sprites_1 = __webpack_require__(0);
var game_1 = __webpack_require__(1);
var AlienSize = 20;
var Alien = (function (_super) {
    __extends(Alien, _super);
    function Alien(game) {
        var _this = _super.call(this, Math.random() * game.width, 1) || this;
        _this.up = Math.random() > 0.5;
        _this.direction = Math.PI * Math.random(),
            _this.speed = 0.3 + (0.5 * Math.random());
        return _this;
    }
    Alien.prototype.move = function (game) {
        this.direction += (Math.random() - 0.5) * 0.5;
        var speed = game.elapsed * this.speed / 5;
        this.x += Math.cos(this.direction) * speed;
        this.y += Math.sin(this.direction) * speed;
        return game_1.withinBounds(this.x, this.y, game);
    };
    Alien.prototype.rect = function () {
        return {
            left: this.x - AlienSize,
            top: this.y,
            width: AlienSize * 2,
            height: AlienSize
        };
    };
    Alien.prototype.draw = function (ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x - AlienSize, this.y + (this.up ? AlienSize : 0));
        ctx.lineTo(this.x, this.y + (this.up ? 0 : AlienSize));
        ctx.lineTo(this.x + AlienSize, this.y + (this.up ? AlienSize : 0));
        ctx.lineWidth = 6;
        ctx.strokeStyle = this.up ? "red" : "blue";
        ctx.stroke();
    };
    return Alien;
}(sprites_1.Sprite));
exports.Alien = Alien;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var sprites_1 = __webpack_require__(0);
var BulletHeight = 20;
var Bullet = (function (_super) {
    __extends(Bullet, _super);
    function Bullet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Bullet.prototype.move = function (game) {
        this.y -= game.elapsed;
        return this.y > 0;
    };
    Bullet.prototype.rect = function () {
        return {
            left: this.x - 2,
            top: this.y - BulletHeight,
            width: 4,
            height: BulletHeight
        };
    };
    Bullet.prototype.draw = function (ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y - BulletHeight);
        ctx.stroke();
    };
    return Bullet;
}(sprites_1.Sprite));
exports.Bullet = Bullet;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var sprites_1 = __webpack_require__(0);
var game_1 = __webpack_require__(1);
var Debris = (function (_super) {
    __extends(Debris, _super);
    function Debris(other) {
        var _this = _super.call(this, other.x, other.y) || this;
        _this.vx = 10 * (Math.random() - 0.5);
        _this.vy = 10 * (Math.random() - 0.5);
        return _this;
    }
    Debris.prototype.move = function (game) {
        this.vy += game.elapsed / 100;
        this.x += (this.vx * game.elapsed / 10);
        this.y += (this.vy * game.elapsed / 10);
        return game_1.withinBounds(this.x, this.y, game);
    };
    Debris.prototype.rect = function () {
        return { left: this.x, top: this.y, width: 0, height: 0 };
    };
    Debris.prototype.draw = function (ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + (2 * this.vx), this.y + (2 * this.vy));
        ctx.stroke();
    };
    return Debris;
}(sprites_1.Sprite));
exports.Debris = Debris;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var sprites_1 = __webpack_require__(0);
var alien_1 = __webpack_require__(2);
var bullet_1 = __webpack_require__(3);
var debris_1 = __webpack_require__(4);
function registerKeys(game) {
    var leftKey = false, rightKey = false;
    [false, true].forEach(function (keyDown) {
        document.addEventListener(keyDown ? "keydown" : "keyup", function (ev) {
            if (ev.repeat) {
                return;
            }
            switch (ev.keyCode) {
                case 90:
                    leftKey = keyDown;
                    break;
                case 88:
                    rightKey = keyDown;
                    break;
            }
            game.velocity = leftKey ? -1 : rightKey ? 1 : 0;
        });
    });
    document.addEventListener("keydown", function (ev) {
        if (ev.repeat) {
            return;
        }
        switch (ev.keyCode) {
            case 77:
                game.bullets.push(new bullet_1.Bullet(game.player, game.height - 60));
                break;
        }
    });
}
var canvas = document.querySelector("canvas");
var audio = document.querySelector("audio");
var game = {
    width: 0,
    height: 0,
    elapsed: 0,
    volume: 50,
    player: NaN,
    velocity: 0,
    bullets: [],
    aliens: [],
    debris: []
};
registerKeys(game);
sprites_1.runSprites(game, canvas, function (ctx) {
    ctx.save();
    ctx.fillStyle = ctx.strokeStyle = "#0F0";
    ctx.lineWidth = 2;
    ctx.clearRect(0, 0, game.width, game.height);
    var margin = 10, volumeWidth = 200, volumeHeight = 50, volumeTop = game.height - (margin + volumeHeight), volumePosition = (game.volume / 100) * volumeWidth;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(margin, volumeTop, volumePosition, volumeHeight);
    ctx.globalAlpha = 1;
    ctx.strokeRect(margin, volumeTop, volumeWidth, volumeHeight);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "18pt Helvetica";
    ctx.fillText("" + game.volume, margin + (volumeWidth / 2), volumeTop + (volumeHeight / 2));
    if (isNaN(game.player)) {
        game.player = game.width / 2;
    }
    var playerSize = 20, playerY = volumeTop - margin;
    game.player = Math.max(playerSize, Math.min(game.width - playerSize, game.player + (game.velocity * game.elapsed / 2)));
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(game.player - playerSize, playerY);
    ctx.lineTo(game.player, playerY - playerSize);
    ctx.lineTo(game.player + playerSize, playerY);
    ctx.closePath();
    ctx.fill();
    sprites_1.renderSprites(ctx, game.bullets, game);
    var maxAliens = 20, alienDeficit = 1 - (game.aliens.length / maxAliens), creationRate = Math.max(0, Math.min(1, alienDeficit)) * 0.1;
    if (Math.random() < creationRate) {
        game.aliens.push(new alien_1.Alien(game));
    }
    sprites_1.renderSprites(ctx, game.aliens, game);
    sprites_1.hitTest(game, game.aliens, game.bullets, function (alien, bullet) {
        game.volume = Math.max(0, Math.min(100, game.volume + (alien.up ? 5 : -5)));
        audio.volume = game.volume / 100;
        for (var d = 0; d < 5; d++) {
            game.debris.push(new debris_1.Debris(alien));
        }
        return true;
    });
    ctx.strokeStyle = "green";
    sprites_1.renderSprites(ctx, game.debris, game);
    ctx.restore();
});


/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map
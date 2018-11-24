
function spriteVelocity(s)
{
	s.x = s.x + s.dx;
	s.y = s.y + s.dy;
}

function spriteConstrain(s, minX, maxX, minY, maxY)
{
	if (s.x > maxX)
	{
		s.dx = -s.dx;
		s.x = maxX;
	}

	if (s.x < minX)
	{
		s.dx = -s.dx;
		s.x = minX;
	}

	if (s.y > maxY)
	{
		s.dy = -s.dy;
		s.y = maxY;
	}

	if (s.y < minY)
	{
		s.dy = -s.dy;
		s.y = minY;
	}
}

function spriteGravity(s, g)
{
	s.dy += g;
}

function Sprite(e, x, y, sx, sy, f)
{
	this.elem = e;
	this.x = x;
	this.y = y;
	this.sx = sx;
	this.sy = sy;

	this.elem.style.position = "absolute";
	this.elem.style.left = x + "px";
	this.elem.style.top = y + "px";

	this.elem.style.width = sx + "px";
	this.elem.style.height = sy + "px";

	this.func = f;
}

Sprite.prototype.changeImage = function(i)
{
    this.elem.src = i;
}

Sprite.prototype.update = function() 
{
    if (this.func) 
    {
        this.func();
        this.updatePosition();
    }
}

Sprite.prototype.updatePosition = function() 
{
    this.elem.style.left = this.x + "px";
    this.elem.style.top = this.y + "px";
}

Sprite.prototype.show = function()
{
	this.elem.style.left = this.x + "px";
	this.elem.style.top = this.y + "px";
	this.elem.style.visibility = "visible"; 
}

Sprite.prototype.hide = function()
	{ this.elem.style.visibility = "hidden"; }

Sprite.prototype.visible = function()
	{ return (this.elem.style.visibility == "visible"); }

Sprite.prototype.overlaps = function(s)
{
	return (
		((this.x > s.x) && (this.x < (s.x + s.sx))) ||
		(((this.x + this.sx) > s.x) && ((this.x + this.sx) < (s.x + s.sx)))
			) && (
		((this.y > s.y) && (this.y < (s.y + s.sy))) ||
		(((this.y + this.sy) > s.y) && ((this.y + this.sy) < (s.y + s.sy)))
			);
}

function SpritePane(e)
{
	this.elem = e;
	this.all = new Array();
	this.updating = new Array();
}

SpritePane.prototype.create = function(e, x, y, sx, sy, f)
{
	if (typeof e == 'string')
	{
		var i = document.createElement("img");
		i.src = e;
		e = i;
	}

	var t = new Sprite(e, x, y, sx, sy, f);

	this.elem.appendChild(e);
	this.all.push(t);

	return t;
}

SpritePane.prototype.destroy = function(s)
{
    this.elem.removeChild(s.elem);

    for (var i = 0; i < this.all.length; i++)
    {
        if (this.all[i] == s)
        {
            this.all.splice(i, 1);
            return;
        }
    }
}

SpritePane.prototype.go = function(i)
{
    var that = this;
    if (!i)
        i = 20;

    setInterval(function()
    {
        var n;
        for (n = 0; n < that.updating.length; n++)
            that.updating[n]();

        for (n = 0; n < that.all.length; n++)
            that.all[n].update();
    }, i);
}

var spriteKeyStateMap_ = new Object();

var getKeyFromEvent = function(e)
{
    if (e.keyCode)
        return e.keyCode;

    if (event.keyCode)
        return event.keyCode;
    
    return e.charCode;
}

var spriteInputElement = document.getElementById("keys");
spriteInputElement.focus();

function spriteOnKeyDown(e)
{
    spriteKeyStateMap_[getKeyFromEvent(e)] = true;
    spriteInputElement.value = "";
}

function spriteOnKeyUp(e)
{
    spriteKeyStateMap_[getKeyFromEvent(e)] = false; 
}

function spriteKeyDown(k)
{
	if (spriteKeyStateMap_ == null)
		spriteKeyStateMap_ = new Object();

	return (spriteKeyStateMap_[k] ? true : false);
}

function spriteSetKey(k, s)
{
	if (spriteKeyStateMap_ != null)
		spriteKeyStateMap_[k] = s;
}

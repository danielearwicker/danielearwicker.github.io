var sprites = new SpritePane(document.getElementById("tree"));
var lx = 300;
var ly = 300;

var bullets = new Array();
var maxBullets = 2;
var currentAlien = 0;

var direction = 1;
var reverse = false;
var reversing = false;

var alienImages = new Array();
alienImages.push("alien1.gif");
alienImages.push("alien2.gif");

var aliens = new Array();

for (var n = 0; n < maxBullets; n++)
{
    var b = sprites.create("bullet.gif", 0, 0, 8, 16, function()
    {
        if (this.visible())
        {
            this.y -= 20;

            if (this.y < 0)
                this.hide();

            for (var a = 0; a < aliens.length; a++)
            {
                var alien = aliens[a];
                if (this.overlaps(alien))
                {
                    explosion.counter = 10;
                    explosion.x = alien.x;
                    explosion.y = alien.y;
                    explosion.show();

                    this.hide();

                    sprites.destroy(alien);

                    if (currentAlien >= a)
                        currentAlien--;

                    aliens.splice(a, 1);
                }
            }
        }
        else
        {
            if (spriteKeyDown(77))
            {
                spriteSetKey(77, false);

                this.x = ship.x + 8;
                this.y = ship.y - 20;

                this.show();
            }
        }
    }
	);

	b.hide();
	bullets.push(b);
}

var createAliens = function()
{
    currentAlien = 0;

    direction = 1;
    reverse = false;
    reversing = false;

    for (var x = 0; x < 8; x++)
    {
        for (var y = 0; y < 5; y++)
        {
            var alien = sprites.create(alienImages[0], (x + 1) * 24, (y * 28) + 20, 16, 16, null);
            aliens.push(alien);
            alien.imageIndex = 0;
            alien.lastDirectionCounter = 0;
            alien.hide();

            alien.alienNinjaMoves = function()
            {
                if (!this.visible())
                    this.show();
                else if (reversing)
                {
                    this.y += 12;
                    if (this.y > (ly - 40))
                    {
                        clearAliens();
                        return;
                    }
                }
                else
                {
                    this.x += (direction * 6);

                    if ((direction == 1 && this.x >= (lx - 32)) ||
                        (direction == -1 && this.x < 24))
                        reverse = true;
                }

                this.changeImage(alienImages[this.imageIndex++]);
                if (this.imageIndex == alienImages.length)
                    this.imageIndex = 0;
            }
        }
    }
}

var clearAliens = function()
{
    for (var a = 0; a < aliens.length; a++)
        sprites.destroy(aliens[a]);

    aliens.splice(0, aliens.length);
}

sprites.updating.push(function()
{
    if (currentAlien >= aliens.length)
    {
        currentAlien = 0;

        if (reverse)
        {
            reverse = false;
            reversing = true;
            direction = -direction;
        }
        else if (reversing)
            reversing = false;
    }

    if (aliens.length == 0)
        createAliens();
    else
    {
        var alien = aliens[currentAlien++];
        alien.alienNinjaMoves();
        alien.updatePosition();
    }
});

var ship = sprites.create("ship.gif", lx / 2, ly - 30, 24, 16,
	function() 
	{
	    if (spriteKeyDown(90) && this.x > 20)
			this.x -= 10;
		else if (spriteKeyDown(88) && this.x < (lx - 32))
			this.x += 10;
	}
);

var explosion = sprites.create("explosion.gif", 0, 0, 16, 16,
	function() 
	{
		if (this.counter && this.counter > 0)
		{
			this.counter--;

			if (this.counter == 0)
				this.hide();
		}
	}
);

explosion.hide();

sprites.go(30);
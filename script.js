const FPS = 35; // frames per second
const FRICTION = 0.65; // friction coefficient of space (0 = no friction, 1 = lots of friction)
var LASER_MAX = 20; // size of lasers on the screen at once
const LASER_SPD = 500; // max number of lasers on the screen at once
const LASER_DIST = 0.7; // max distance laser can travel as fraction os screen width
// * ROIDS
var ROID_JAG = 0.3; // jaggedness of asteroids (0 = none | 1 = lots)
// const ROIDS_PTS_LGE = 30; // points scored for a large asteroid
// const ROIDS_PTS_MED = 60; // points scored for a medium asteroid
// const ROIDS_PTS_SML = 100; // points scored for a small asteroid
const ROIDS_NUM = 3; // starting number of asteroids
const ROID_SIZE = 150; // starting size of asteroid in pixels
const ROID_SPD = 100; // MAX starting speed of asteroid in pixels per second
const ROID_VERT = 10; // average number of vertices on each asteroid
// * SHIP
const SHIP_BLINK_DUR = 0.1; // duration of the ship's blink during invisibility in seconds
const SHIP_EXPLODE_DUR = 0.3; // duration of the ship's explosion
const SHIP_INV_DUR = 3; // duration of the ship's invisibility in seconds
const SHIP_SIZE = 30; // ship height in pixels
const SHIP_THRUST = 5; // acceleration of the ship in pixels per second per second
const TURN_SPEED = 360; // turn speed in degrees per second
// * AMMO
var spawnAmmo = false;
var randomX; // random x position
var randomY; // random y position
// * Life
var spawnLife = false;
var randomXL // random x position
var randomYL; // random y position
var pickedLife = false;
// * Bonus
var spawnBonus = false;
var randomXB // random x position
var randomYB; // random y position
const BONUS_SPD = 120; // MAX starting speed of bonus in pixels per second
// * GAME PARAMETERS
const TEXT_FADE_TIME = 2.3 // text fade time in seconds
const TEXT_SIZE = 40 // text font height in pixels 
const GAME_LIVES = 3; // starting number of lives
const SAVE_KEY_SCORE = "highscore"; // save key for local storage of high score
var SOUND_ON = true;
var MUSIC_ON = true;
var paused = false;

// * options html element
const options = document.querySelector(".options"); 
options.style.display = "none"; 

var colorBorderValue;

const toggleSoundBtn = document.querySelector(".toggle-sound");
const toggleMusicBtn = document.querySelector(".toggle-music");

// CANVAS:
/** @type {HTMLCanvasElement} */
var canv = document.getElementById("game-canvas");
var ctx = canv.getContext("2d");

// set up sound effects
var fxExplode = new Sound("sounds/explode.m4a");
var fxHit = new Sound("sounds/hit.m4a", 5);
var fxHit_MED = new Sound("sounds/hit_med.m4a", 5);
var fxHit_SML = new Sound("sounds/hit_sml.m4a", 5);
var fxLaser = new Sound("sounds/laser.m4a", 10, 0.5);
var fxThrust = new Sound("sounds/thrust.m4a");
var fxLevelUp = new Sound("sounds/level-up.mp3");
var fxPickAmmo = new Sound("sounds/pick-ammo.wav");
var fxPickLife = new Sound("sounds/pick-life.wav");
var fxPickBonus = new Sound("sounds/pick-bonus.wav");
var fxGameOver = new Sound("sounds/game-over.wav");

// set up the music
var music = new Music("sounds/music-low.m4a", "sounds/music-high.m4a");
var roidsLeft, roidsTotal;

// set up the game parameters
var level, lives, roids, score, scoreHigh, ship, text, textAlpha;
newGame();

// set up spaceship color to white
ctx.strokeStyle = "white";


// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
    roids = [];
    roidsTotal = (ROIDS_NUM + level) * 7;
    roidsLeft = roidsTotal;
    var x, y;
    for (var i = 0; i < ROIDS_NUM + level; i++) {
        do {
            x = Math.floor(Math.random() * canv.width)
            y = Math.floor(Math.random() * canv.height)
        }
        while (distBetweenPoints(ship.x, ship.y, x, y) < ROID_SIZE * 2 + ship.r)
        
        roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 2)));
    }
}

function destroyAsteroid(index) {
    var x = roids[index].x;
    var y = roids[index].y;
    var r = roids[index].r;

    // * slipt asteroid in two if necessary
    if (r == Math.ceil(ROID_SIZE / 2)) { // large asteroid
        fxHit.play();
        roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4)));
        roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4)));
        score += getRndInteger(20, 40);
    }
    else if (r == Math.ceil(ROID_SIZE / 4)) { // medium asteroid
        fxHit_MED.play();
        roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8)));
        roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8)));
        score += getRndInteger(40, 70);
    } else { // small asteroid
        fxHit_SML.play();
        score += getRndInteger(90, 120);
    }

    // check high score
    if (score > scoreHigh) {
        scoreHigh = score;
        localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
    }

    // destroy asteroid
    roids.splice(index, 1);


    // calculate the ratio of remaining asteroids to determine music tempo
    roidsLeft--;
    music.setAsteroidRatio(roidsLeft / roidsTotal);

    // new level when no more asteroids
    if (roids.length == 0) {
        level++;
        newLevel();
    }
}

function distBetweenPoints(x1,y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, colour) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo( // nose of the ship
        x + 4 / 3 * ship.r * Math.cos(a),
        y - 4 / 3 * ship.r * Math.sin(a)
    );
    ctx.lineTo( // rear left
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
    );
    ctx.lineTo( // rear right
        x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
    );
    ctx.closePath();
    ctx.stroke();
}

function newAsteroid(x, y, r) {
    lvlMult = 1 + 0.1 * level;
    var roid = {
        a: Math.random() * Math.PI * 2, // in radians
        offs: [],
        r: r,
        vert: Math.floor(Math.random() * (ROID_VERT + 1) + ROID_VERT / 2),
        x: x,
        y: y,
        xv: Math.random() * ROID_SPD * lvlMult/ FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ROID_SPD * lvlMult/ FPS * (Math.random() < 0.5 ? 1 : -1)
    }

    // create te vertex offsets array
    for (var i = 0; i < roid.vert; i++) {
        roid.offs.push(Math.random() * ROID_JAG * 2 + 1 - ROID_JAG);
    }

    return roid;
}

function newGame() {
    level = 0;
    lives = GAME_LIVES;
    score = 0;
    ship = newShip();

    // get the high socre from local storage
    var scoreStr = localStorage.getItem(SAVE_KEY_SCORE);
    if (scoreStr == null) {
        scoreHigh = 100;
    }
    else {
        scoreHigh = parseInt(scoreStr);
    }
    newLevel();
}

function newLevel() {
    music.setAsteroidRatio(1);
    fxLevelUp.play();
    text = "Nível " + (level + 1)
    textAlpha = 1.0;
    createAsteroidBelt()
    if (level != 0) {
        score += getRndInteger(500, 1000);
    }
}


function newShip() {
    return {
        x: canv.width / 2,
        y: canv.height / 2,
        r: SHIP_SIZE / 2,
        a: 90 / 180 * Math.PI, // convert to radians
        blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
        blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
        canShoot: true,
        dead: false,
        lasers: [],
        explodeTime: 0,
        rot: 0,
        thrusting: false,
        thrust: {
            x: 0,
            y: 0
        }
    }
}

function shootLaser() {

    // create the laser object
    if(ship.canShoot && ship.lasers.length < LASER_MAX) {
        ship.lasers.push({ // from the nose of the ship
            x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv: LASER_SPD * Math.cos(ship.a) / FPS,
            yv: -LASER_SPD * Math.sin(ship.a) / FPS,
            dist: 0
        })
        fxLaser.play();
    }
    

    // prevent further shooting
    ship.canShoot = false;
}
 
function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
    ship.lasers.length = 0;
    LASER_MAX = 20;
    fxExplode.play();
}

function gameOver() {
    fxGameOver.play();
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1.0;
    ship.lasers.length = 0;
    LASER_MAX = 20;
}

// set up event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

             
function keyDown(/** @type {KeyboardEvent} */ ev) {
    if (!paused) {
        if (ship.dead) {
            return;
        }
    
        switch(ev.keyCode) {
            case 32: // space bar (shoot laser)
                shootLaser();
                break;
            case 37: // left arrow (rotate ship left)
                ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
                break;
            case 38: // up arrow (thrust the ship forward)
                ship.thrusting = true;
                break;
            case 39: // right arrow (rotate ship right)
                ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
                break;
        }
    }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
    if (!paused) {
        if (ship.dead) {
            return;
        }
    
        switch(ev.keyCode) {
            case 32: // space bar (allow shooting again)
                ship.canShoot = true;
                break;
            case 37: // left arrow (stop rotating left)
                ship.rot = 0;
                break;
            case 38: // up arrow (stop thrusting)
                ship.thrusting = false;
                break;
            case 39: // right arrow (stop rotating right)
                ship.rot = 0;
                break;
        }
    }
}

function Music(srcLow, srcHigh) {
    this.soundLow = new Audio(srcLow);
    this.soundHigh = new Audio(srcHigh);
    this.low = true;
    this.tempo = 1.0; // seconds per beat
    this.beatTime = 0; // frames left until next beat

    this.play = function() {
        if (MUSIC_ON) {
            if (this.low) {
                this.soundLow.play();
            }
            else {
                this.soundHigh.play()
            }
            this.low = !this.low;
        }
    }

    this.tick = function() {
        if (MUSIC_ON) {
            if (this.beatTime == 0) {
                this.play();
                this.beatTime = Math.ceil(this.tempo * FPS);
            }
            else {
                this.beatTime--;
            }
        }
    }

    this.setAsteroidRatio = function(ratio) {
        this.tempo = 1.0 - 0.75 * (1.0 - ratio);
    }
}

function Sound(src, maxStreams = 1, vol = 1.0) {
    this.streamNum = 0;
    this.streams = [];
    for (var i = 0; i < maxStreams; i++) {
        this.streams.push(new Audio(src));
        this.streams[i].volume = vol;
    }

    this.play = function() {
        if (SOUND_ON) {
            this.streamNum = (this.streamNum + 1) % maxStreams;
            this.streams[this.streamNum].play();
        }
    }
    this.stop = function() {
        if (SOUND_ON) {
            this.streams[this.streamNum].pause();
            this.streams[this.streamNum].currentTime = 0;
        }
    }
}


function update() {
    // get value of the input color element and define it to ship color
    colorBorderValue = document.getElementById("border-color").value;

    // check if check box to show dot is checked
    const SHOW_CENTRE_DOT = document.querySelector(".check-show-dot").checked; // show or hide ship's centre dot
    
    // show or hide collision bounding
    const SHOW_BOUNDING = document.querySelector(".check-show-collision").checked; 
    
    // show or hide asteroids left
    const SHOW_ROIDS = document.querySelector(".check-show-asteroids").checked; 

    var blinkOn = ship.blinkNum % 2 == 0;
    var exploding = ship.explodeTime > 0;

    // thick the music
    if(!paused) {
        music.tick();
    }

    // draw space
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height);

    // thrust the ship
    if(ship.thrusting && !ship.dead && !paused) {
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;
        fxThrust.play();
    
        // draw the thruster
        if (!exploding && blinkOn) {
            ctx.fillStyle = "red";
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = SHIP_SIZE / 10;
            ctx.beginPath();
            ctx.moveTo( // rear left
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.3 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.3 * Math.cos(ship.a))
            );
            ctx.lineTo( // rear center behind the ship
                ship.x - ship.r * 4 / 3 * Math.cos(ship.a),
                ship.y + ship.r * 4 / 3 * Math.sin(ship.a)
            );
            ctx.lineTo( // rear right
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.3 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.3 * Math.cos(ship.a))
            );
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
    else {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
        fxThrust.stop();
    }

    // draw the triangular ship
    if (!exploding) {
        if (blinkOn && !ship.dead) {
            drawShip(ship.x, ship.y, ship.a, colorBorderValue);
        }

        // handle blinking
        if(ship.blinkNum > 0) {

            // reduce blink time
            ship.blinkTime--;

            // reduce the blink num
            if (ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
                ship.blinkNum--;
            }
        }
    }
    else {
        // draw explosion
        ctx.fillStyle = "darkred";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
        ctx.fill();
    }
    

    // Showing bounding
    if (SHOW_BOUNDING) {
        ctx.strokeStyle = "lime";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
        ctx.stroke();
    }

    // draw asteroids
    var a, r, x, y, offs, vert;
    for (var i = 0; i < roids.length; i++) {
        ctx.strokeStyle = "slategrey";
        ctx.lineWidth = SHIP_SIZE / 25;

        // get the asteroid properties
        a = roids[i].a;
        r = roids[i].r;
        x = roids[i].x;
        y = roids[i].y;
        offs = roids[i].offs;
        vert = roids[i].vert;
        
        // draw the path
        ctx.beginPath();
        ctx.moveTo(
            x + r * offs[0] * Math.cos(a),
            y + r * offs[0] * Math.sin(a)
        );

        // draw the polygon
        for (var j = 1; j < vert; j++) {
            ctx.lineTo(
                x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
                y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
            );
        }
        ctx.closePath();
        ctx.stroke();

        // show ship collision circle
        if (SHOW_BOUNDING) {
            ctx.strokeStyle = "lime";
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2, false);
            ctx.stroke();
        }
    }

    // draw the lasers
    for (var i = 0; i < ship.lasers.length; i++) {
        ctx.fillStyle = "red";
        ctx.beginPath()
        ctx.moveTo( // nose of the ship
            ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            ship.y - 4 / 3 * ship.r * Math.sin(ship.a)
        );
        ctx.arc(ship.lasers[i].x ,ship.lasers[i].y, SHIP_SIZE / 5, 0, Math.PI * 2, false);
        ctx.fill();

    }

    // draw the game text
    if (textAlpha >= 0) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        ctx.font = "small-caps " + TEXT_SIZE + "px Josefin sans";
        ctx.fillText(text, canv.width / 2, canv.height * 0.75);
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
    }
    else if (ship.dead && !paused) {
        newGame();
    }

    // draw the lives
    var lifeColour;
    for (var i = 0; i < lives; i++) {
        if (exploding && i == lives - 1) {
            lifeColour = "red";
        } 
        else if (pickedLife) {
            lifeColour = "lime";
        } 
        else {
            lifeColour = "white";
        }
        
        drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColour);
    }
    
    
    // draw the score
    ctx.textAlign = "right";   
    ctx.textBaseline = "middle";
    ctx.fillStyle = "whitesmoke";
    ctx.font = TEXT_SIZE + "px Josefin sans";
    ctx.fillText("Pontos: "+score, canv.width - SHIP_SIZE / 2, SHIP_SIZE);
    
    // draw the high score
    ctx.textAlign = "center";   
    ctx.textBaseline = "middle";
    ctx.fillStyle = "whitesmoke";
    ctx.font = (TEXT_SIZE * 0.75) + "px Josefin sans";
    ctx.fillText("Recorde: "+scoreHigh, canv.width / 2, SHIP_SIZE);

    // draw the ammo text
    const ammoText = `Munição: ${LASER_MAX - ship.lasers.length}`;
    ctx.textAlign = "left";   
    ctx.textBaseline = "middle";
    ctx.fillStyle = "whitesmoke";
    ctx.font = (TEXT_SIZE - 5) + "px Josefin sans";
    ctx.fillText(ammoText, canv.width / 100, canv.height * 0.95);

    // draw the roids left text
    if (SHOW_ROIDS) {
        ctx.textAlign = "right";   
        ctx.textBaseline = "middle";
        ctx.fillStyle = "whitesmoke";
        ctx.font = (TEXT_SIZE - 5) + "px Josefin sans";
        ctx.fillText("Asteroides: " + roids.length, canv.width * 0.99, canv.height * 0.95);
    }

    // detect laser hits on asteroids 
    var ax, ay, ar, lx, ly;
    for (var i = roids.length - 1; i >= 0;i--) {

        // grab the asteroids properties
        ax = roids[i].x;
        ay = roids[i].y;
        ar = roids[i].r;

        // loop over the lasers 
        for (var j = ship.lasers.length - 1; j >= 0;j--) {

            // grap the lasers properties;
            lx = ship.lasers[j].x;
            ly = ship.lasers[j].y;

            // detect hits 
            if (distBetweenPoints(ax, ay, lx, ly) < ar) {
                
                // remove the laser (MOVING OUT OF SPACE)
                ship.lasers[j].x = 80990;

                // remove the asteroids
                destroyAsteroid(i);
                
                break;

            }
        }
    }

    // check for asteroids collisions (when not exploding and not paused)
    if (!exploding && !paused) {
        if (ship.blinkNum == 0 && !ship.dead) {
            for (var i = 0; i < roids.length; i++) {
                if (distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) <  ship.r + roids[i].r) {
                    explodeShip();
                    destroyAsteroid(i);
                    break;

                }
            }
        }

        // rotate the ship
        ship.a += ship.rot;
        
        // move the ship
        ship.x += ship.thrust.x;
        ship.y += ship.thrust.y;
    }
    else {
        ship.explodeTime--;

        if(ship.explodeTime == 0) {
            lives--;
            if (lives == 0) {
                gameOver();
            }
            else {
                ship = newShip();
            }
        }
    }
    


    // handle edge of screen
    // * X
    if (ship.x < 0 - ship.r) {
        ship.x = canv.width + ship.r;
    }
    else if (ship.x > canv.width + ship.r) {
        ship.x = 0 - ship.r;
    }

    // * Y
    if (ship.y < 0 - ship.r) {
        ship.y = canv.height + ship.r;
    }
    else if (ship.y > canv.height + ship.r) {
        ship.y = 0 - ship.r;
    }

    if (SHOW_CENTRE_DOT) {
        ctx.fillStyle = "red";
        ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
    }

    // handle moves of lasers
    for (var i = ship.lasers.length - 1; i >= 0; i--) {
        // move the laser
        ship.lasers[i].x += ship.lasers[i].xv;
        ship.lasers[i].y += ship.lasers[i].yv;
    }

    // move asteroids
    if(!paused) {
        for (var i = 0; i < roids.length; i++) {
            roids[i].x += roids[i].xv;
            roids[i].y += roids[i].yv;
    
            // handle edge of screen
            // * X
            if (roids[i].x < 0 - roids[i].r) {
                roids[i].x = canv.width + roids[i].r;
            }
            else if (roids[i].x > canv.width + roids[i].r) {
                roids[i].x = 0 - roids[i].r
            }
            // * Y
            if (roids[i].y < 0 - roids[i].r) {
                roids[i].y = canv.height + roids[i].r;
            }
            else if (roids[i].y > canv.height + roids[i].r) {
                roids[i].y = 0 - roids[i].r;
            }
        }
    }
    

    // set up ammo
    var ammo = {
        r: SHIP_SIZE / 3.2,
        x: randomX,
        y: randomY
    }
    // set up spawn ammo
    if(spawnAmmo && !paused) {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(ammo.x, ammo.y, ammo.r * 2, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "crimson";
        ctx.beginPath();
        ctx.arc(ammo.x, ammo.y, ammo.r * 1, 0, Math.PI * 2, false);
        ctx.fill();

        // handle edge of screen
        if (ammo.x < 0) {
            ammo.x = canv.width;
        }
        else if (ammo.x > canv.width) {
            ammo.x = 0;
        }
        if (ammo.y < 0) {
            ammo.y = canv.width;
        }
        else if (ammo.y > canv.width) {
            ammo.y = 0;
        }
    }
    else {
        // Unspawn ammo
        ammo = [];
    }
    // detect collision of ammo with ship
    if(distBetweenPoints(ship.x, ship.y, ammo.x, ammo.y) <  ship.r + ammo.r) {
        pickAmmo();
    }

    // detect collision of ammo with ship laser
    var lx, ly;

    // loop over the lasers 
    for (var j = ship.lasers.length - 1; j >= 0;j--) {

        // grap the lasers properties;
        lx = ship.lasers[j].x;
        ly = ship.lasers[j].y;

        // detect hits 
        if (distBetweenPoints(lx, ly, ammo.x, ammo.y) < ammo.r*2) {
            // remove the laser (MOVING OUT OF SPACE)
            ship.lasers[j].x = 80990;

            // pick ammo
            pickAmmo();
            
            break;

        }
    }


    // set up life
    var life = {
        r: SHIP_SIZE / 3,
        x: randomXL,
        y: randomYL
    }
    // set up spawn life
    if(spawnLife && !paused) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(life.x, life.y, life.r * 2, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "lime";
        ctx.beginPath();
        ctx.arc(life.x, life.y, life.r * 1.5, 0, Math.PI * 2, false);
        ctx.fill();

        // handle edge of screen
        if (life.x < 0) {
            life.x = canv.width;
        }
        else if (life.x > canv.width) {
            life.x = 0;
        }
        if (life.y < 0) {
            life.y = canv.width;
        }
        else if (life.y > canv.width) {
            life.y = 0;
        }
    }
    else {
        // Unspawn life
        life = [];
    }
    // detect collision of life with ship
    if(distBetweenPoints(ship.x, ship.y, life.x, life.y) <  ship.r + life.r) {
        pickLife();
    }

    // detect collision of life with ship laser
    var lx, ly;

    // loop over the lasers 
    for (var j = ship.lasers.length - 1; j >= 0;j--) {

        // grap the lasers properties;
        lx = ship.lasers[j].x;
        ly = ship.lasers[j].y;

        // detect hits 
        if (distBetweenPoints(lx, ly, life.x, life.y) < life.r*1.5) {
            // remove the laser (MOVING OUT OF SPACE)
            ship.lasers[j].x = 80990;

            // pick life
            pickLife();
            
            break;

        }
    }

    // set up bonus
    var bonus = {
        r: SHIP_SIZE / 3.5,
        x: randomXB,
        y: randomYB,
    }
    // set up spawn bonus
    if(spawnBonus && !paused) {
        ctx.fillStyle = "aqua";
        ctx.beginPath();
        ctx.arc(bonus.x, bonus.y, bonus.r * 1.5, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "aquamarine";
        ctx.beginPath();
        ctx.arc(bonus.x, bonus.y, bonus.r * 1, 0, Math.PI * 2, false);
        ctx.fill();

        // handle edge of screen
        if (bonus.x < 0) {
            bonus.x = canv.width;
        }
        else if (bonus.x > canv.width) {
            bonus.x = 0;
        }
        if (bonus.y < 0) {
            bonus.y = canv.width;
        }
        else if (bonus.y > canv.width) {
            bonus.y = 0;
        }
    }
    else {
        // Unspawn bonus
        bonus = [];
    }
    // detect collision of bonus with ship
    if(distBetweenPoints(ship.x, ship.y, bonus.x, bonus.y) <  ship.r + bonus.r) {
        pickBonus();
    }

    // detect collision of bonus with ship laser
    var lx, ly;

    // loop over the lasers 
    for (var j = ship.lasers.length - 1; j >= 0;j--) {

        // grap the lasers properties;
        lx = ship.lasers[j].x;
        ly = ship.lasers[j].y;

        // detect hits 
        if (distBetweenPoints(lx, ly, bonus.x, bonus.y) < bonus.r*1.5) {
            // remove the laser (MOVING OUT OF SPACE)
            ship.lasers[j].x = 80990;

            // pick bonus
            pickBonus();
            
            break;

        }
    }
}



// * Aditional things (BY GOLD)

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

// Enable fullscreen game
function fullScreen() {
    var elem = document.getElementById("game-canvas");
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}


// Spawn ammo
setInterval(() =>{
    if (!paused) {
        randomX = Math.floor(Math.random() * canv.width);
        randomY = Math.floor(Math.random() * canv.height);
        spawnAmmo = true;
        setTimeout(() => {spawnAmmo = false;}, 10000);
    }
}, 15000)

function pickAmmo() {
    fxPickAmmo.play();
    LASER_MAX += 20;
    randomX = 9999;
    randomY = 9999;
    score += getRndInteger(20, 50);
    spawnAmmo = false;
}

// Spawn life
setInterval(() =>{
    if(!paused) {
        if(lives < 7) {
            randomXL = Math.floor(Math.random() * canv.width);
            randomYL = Math.floor(Math.random() * canv.height);
            spawnLife = true;
            setTimeout(() => {spawnLife = false;}, 10000);
        }
    }
}, 20000)

function pickLife() {
    pickedLife = true;
    fxPickLife.play();
    randomXL = 9999;
    randomYL = 9999;
    spawnLife = false;
    lives += 1;
    score += getRndInteger(20, 50);
    setTimeout(() => {pickedLife = false;}, 1000);
}

// Spawn bonus points
setInterval(() =>{
    if(!paused) {
        randomXB = Math.floor(Math.random() * canv.width);
        randomYB = Math.floor(Math.random() * canv.height);
        spawnBonus = true;
        setTimeout(() => {spawnBonus = false;}, 10000);
    }
}, getRndInteger(15000, 25000))

function pickBonus() {
    fxPickBonus.play();
    randomXB = 9999;
    randomYB = 9999;
    spawnBonus = false;
    score += getRndInteger(800, 1050);
}




function togglePause() {
    const pauseBtn = document.querySelector(".toggle-pause");
    if (!paused) {
        paused = true;
        pauseBtn.innerHTML = "Retomar";
    }
    else {
        paused = false;
        pauseBtn.innerHTML = "Pausar";
    }
    canv.focus();
    pauseBtn.blur();
}



// Enable secret mode(Active more options)
function enableSecretMode() {options.style.display = "block";}

function toggleSound() {
    if(SOUND_ON) {
        SOUND_ON = false;
        toggleSoundBtn.innerHTML = "Ativar 🔊";
    }
    else if (!SOUND_ON){
        SOUND_ON = true;
        toggleSoundBtn.innerHTML = "Desativar 🔊";
    }
    canv.focus();
    toggleSoundBtn.blur();
}

function toggleMusic() {
    if(MUSIC_ON) {
        MUSIC_ON = false;
        toggleMusicBtn.innerHTML = "Ativar 🎵";
    }
    else if (!MUSIC_ON){
        MUSIC_ON = true;
        toggleMusicBtn.innerHTML = "Desativar 🎵";
    }
    canv.focus();
    toggleMusicBtn.blur();
}


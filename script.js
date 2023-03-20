/**
 * load event waits for all assets such as stylesheets and images to be
 * fully loaded before it executes code in its callback function
 * */
window.addEventListener('load', function()
{
    const canvas = document.getElementById("canvas1");
    const ctx = canvas.getContext("2d");
    canvas.width = 1200;
    canvas.height = 720;
    let enemies = [];
    let score = 0;
    let gameOver = false;
    const fullScreenButton = document.getElementById('fullScreenButton');
    /**
     * apply event listener to keyboard events it will hold an array
     * all currently active keys
     * keep track all keys
     * */
    class InputHandler
    {
        constructor()
        {
            // adding and removing keys from it as they are being
            // pressed and released
            this.keys = [];
            /** touchY(vertical) is where initial point is being touch on*/
            this.touchY = '';
            this.touchX = '';
            /** the starting touch point to end touch point at least 30 pixel apart to trigger*/
            this.touchThreshold = 30;
            /*
             use ES6 syntax, the function(e){...} will have an error
             using arrow function, don't bind their own 'this', but they
             inherit the one from their parent scope, this is called lexical scoping
             */
            // keydown is when key is being pressed down
            window.addEventListener('keydown', e =>
            {
                // if key === key and keys[] does not have that key, then add in
                if ((e.key === 'ArrowDown' ||
                    e.key === 'ArrowUp' ||
                    e.key === 'ArrowLeft' ||
                    e.key === 'ArrowRight')
                    && this.keys.indexOf(e.key) === -1)
                {
                    this.keys.push(e.key);
                }
                else if (e.key === 'Enter' && gameOver)
                {
                    restartGame()
                }
            });
            // keyup is when key is lifted
            window.addEventListener('keyup', e =>
            {
                if (e.key === 'ArrowDown' ||
                    e.key === 'ArrowUp' ||
                    e.key === 'ArrowLeft' ||
                    e.key === 'ArrowRight')
                {
                    // we are removing any key that is being lifted/up
                    // by finding that key's index and remove it
                    this.keys.splice(this.keys.indexOf(e.key), 1);
                }
            });
            // touchstart on touchscreen is like keydown
            window.addEventListener('touchstart', e =>
            {
                /*
                * pageY returns the Y(vertical) coordinate in pixels of the event
                * relative to the whole document.
                * touchY is the beginning point of the touch
                * */
                this.touchY = e.changedTouches[0].pageY;
                this.touchX = e.changedTouches[0].pageX;
            });
            // touchmove is finger pressing on screen and move on touchscreen
            window.addEventListener('touchmove', e =>
            {
                /* touchmove fires over and over as long as user is touching and swiping*/
                const swipeDistanceY = e.changedTouches[0].pageY - this.touchY;
                const swipeDistanceX = e.changedTouches[0].pageX - this.touchX;
                /* less than -30, because it is going up.*/
                if (swipeDistanceY < -this.touchThreshold
                    && this.keys.indexOf('swipe up') === -1)
                {
                    this.keys.push('swipe up');
                }
                else if (swipeDistanceY > this.touchThreshold
                    && this.keys.indexOf('swipe down') === -1)
                {
                    this.keys.push('swipe down');
                    if (gameOver) restartGame();
                }
                if (swipeDistanceX > this.touchThreshold
                    && this.keys.indexOf('swipe right') === -1)
                {
                    this.keys.push('swipe right');
                }
                else if (swipeDistanceX < -this.touchThreshold
                    && this.keys.indexOf('swipe left') === -1)
                {
                    this.keys.push('swipe left');
                }
            });
            // touchend on touchscreen is like keydown
            window.addEventListener('touchend', e =>
            {
                this.keys.splice(this.keys.indexOf('swipe up'), 1);
                this.keys.splice(this.keys.indexOf('swipe down'), 1);
                this.keys.splice(this.keys.indexOf('swipe left'), 1);
                this.keys.splice(this.keys.indexOf('swipe right'), 1);
            });
        }
    }
    /**
     * player class will react to these keys
     * drawing and updating the player
     * draw, animate, and update its position based on user input
     * */
    class Player
    {
        constructor(gameWidth, gameHeight)
        {
            // gameWidth and gameHeight game boundaries we don't wanna
            // run offscreen
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.spriteWidth = 1800 / 9;
            this.spriteHeight = 200;
            this.width = this.spriteWidth * 0.7;
            this.height = this.spriteHeight * 0.7;
            this.x = 100;
            this.y = this.gameHeight - this.height;
            this.image = document.getElementById('playerImage');
            this.frameX = 0;
            this.maxFrame = 8;
            this.frameY = 0;
            this.fps = 20; // slow down for player
            this.frameTimer = 0;
            this.frameInterval = 1000 / this.fps;
            this.speed = 0;  // 0 is static, negative going backward, positive going forward
            this.vy = 0;
            this.weight = 1; // gravity to fall down after jump/up
        }
        restart()
        {
            // original location
            this.x = 100;
            this.y = this.gameHeight - this.height;
            // back in running animation
            this.maxFrame = 8;
            this.frameY = 0;
        }
        draw(ctx)
        {
            /*
            // hit circle visual
            ctx.lineWidth = 5;
            ctx.strokeStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height/2 + 15,
                this.width/3, 0, Math.PI * 2);
            ctx.stroke();
            */
            ctx.drawImage(this.image,
                this.frameX * this.spriteWidth, this.frameY * this.spriteHeight,
                this.spriteWidth, this.spriteHeight,
                this.x, this.y, this.width, this.height);
        }
        /**
         * input here to connect keyboard inputs to player movement
         * */
        update(input, deltaTime, enemies)
        {
            /** collision detection*/
            enemies.forEach(enemy =>
            {
                const dx = (enemy.x + enemy.width / 2 - 20) - (this.x + this.width / 2);
                const dy = (enemy.y + enemy.height / 2 + 15) - (this.y + this.height / 2 + 15);
                const distance = Math.sqrt(dx * dx + dy * dy);
                // imaginary circle is drawn with radius of object's width.
                if (distance < enemy.width / 3 + this.width / 3)
                {
                    gameOver = true;
                }
            });
            /** sprite animation*/
            if (this.frameTimer > this.frameInterval)
            {
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            }
            else
            {
                this.frameTimer += deltaTime;
            }
            /** controls */
            // if the key is found, change speed, else set back to 0
            if (input.keys.indexOf('ArrowRight') > -1
                || input.keys.indexOf('swipe right') > -1)
            {
                this.speed = 5;
            }
            else if (input.keys.indexOf('ArrowLeft') > -1
                || input.keys.indexOf('swipe left') > -1)
            {
                this.speed = -5;
            }
            // only allow jumping when player is on the ground
            else if ((input.keys.indexOf('ArrowUp') > -1
                    || input.keys.indexOf('swipe up') > -1)
                    && this.onGround())
            {
                this.vy -= 25;
            }
            else
            {
                this.speed = 0;
            }
            /** horizontal movement */
            this.x += this.speed;
            /** horizontal boundary*/
            if (this.x < 0) this.x = 0;
            else if (this.x > this.gameWidth - this.width)
                this.x = this.gameWidth - this.width;

            /** vertical movement */
            this.y += this.vy;
            if (!this.onGround())
            {
                // resetting the negative vy slowly back to positive
                // in beginning, it immediately sets to -20, and then vy += weight be like
                // -20, -19, -18, ... 0(highest point), 1, 2, 20 and then set to 0
                this.vy += this.weight;
                this.maxFrame = 6;
                this.frameY = 1; // change the spritesheet to second row
            }
            else
            {
                this.vy = 0; // if on ground, set back vertical y to 0
                this.maxFrame = 8;
                this.frameY = 0; // back to first row spritesheet
            }
            /** vertical boundary*/
            if (this.y > this.gameHeight - this.height)
                this.y = this.gameHeight - this.height;
        }

        onGround()
        {
            return this.y >= this.gameHeight - this.height;
        }
    }
    /**
     * handle endless scrolling backgrounds
     * */
    class Background
    {
        constructor(gameWidth, gameHeight)
        {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById("backgroundImage");
            this.x = 0;
            this.y = 0;
            this.width = 2400;
            this.height = 720;
            this.speed = 7;
        }
        draw(ctx)
        {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            /**
             * drawing the second image right after the first image to create endless scrolling
             * */
            ctx.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
        }
        update()
        {
            this.x -= this.speed;
            if (this.x < 0 - this.width) this.x = 0
        }
        restart()
        {
            this.x = 0;
        }
    }
    /**
     * generate enemies
     * */
    class Enemy
    {
        constructor(gameWidth, gameHeight)
        {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 960 / 6;
            this.height = 119;
            this.image = document.getElementById("enemyImage");
            this.x = this.gameWidth;
            this.y = this.gameHeight - this.height;
            this.frameX = 0;  // horizontal
            this.maxFrame = 5;
            this.fps = 20; // slow down only for enemy
            this.frameTimer = 0;
            this.frameInterval = 1000 / this.fps;
            this.speed = 8;
            this.markedForDeletion = false;
        }
        draw(ctx)
        {
            ctx.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height,
                this.x, this.y, this.width, this.height);
            /* // hit circle visual
            ctx.lineWidth = 5;
            ctx.strokeStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 -20, this.y + this.height/2+15,
                this.width/3, 0, Math.PI * 2);
            ctx.stroke();
            */
        }
        update(deltaTime)
        {
            if (this.frameTimer > this.frameInterval)
            {
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            }
            else
            {
                this.frameTimer += deltaTime;
            }
            this.x -= this.speed;
            // when enemy out of left of screen
            if (this.x < 0 - this.width)
            {
                this.markedForDeletion = true;
                score++;
            }
        }
    }

    /**
     * responsible for adding animating and removing enemies from the game
     * */
    function handleEnemies(deltaTime)
    {
        // adding a random time interval to enemy array
        if (enemyTimer > enemyInterval + randomEnemyInterval)
        {
            enemies.push(new Enemy(canvas.width, canvas.height));
            randomEnemyInterval = Math.random() * 1000 + 400;
            enemyTimer = 0;
        }
        else
        {
            enemyTimer += deltaTime;
        }
        enemies.forEach(enemy =>
        {
            enemy.draw(ctx);
            enemy.update(deltaTime);
        });
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    /**
     * utility function
     * displaying score; gameover message
     * */
    function displayStatusText(ctx)
    {
        ctx.textAlign = 'left';
        ctx.font = '40px Helvetica';
        ctx.fillStyle = 'black';
        ctx.fillText("Score: " + score, 20, 50);
        ctx.font = '40px Helvetica';
        ctx.fillStyle = 'white';
        ctx.fillText("Score: " + score, 22, 52);
        if (gameOver)
        {
            ctx.textAlign = 'center';
            ctx.fillStyle = 'black';
            ctx.fillText('Game Over, press Enter to restart or swipe down: ',
                canvas.width / 2, 200);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.fillText('Game Over, press Enter to restart or swipe down: ',
                canvas.width / 2 + 2, 202);
        }
    }

    function restartGame()
    {
        player.restart();
        background.restart();
        enemies = [];
        score = 0;
        gameOver = false;
        /**
         * when game over is true, it stopped animating, animate must be called here to restart
         * */
        animate(0);
    }
    /**
     * document.fullscreenElement is a built in read only property on document object
     * that returns the element that is currently being presented in full screen mode
     * null is means full screen is not active.
     * */
    function toggleFullScreen()
    {
        console.log(document.fullscreenElement);
        if (!document.fullscreenElement)
        {
            canvas.requestFullscreen().catch(err =>
            {
                alert(`Error, can't enable full-screen mode: ${err.message}`);
            });
        }
        else
        {
            document.exitFullscreen();
        }
    }
    fullScreenButton.addEventListener('click', toggleFullScreen);
    const input = new InputHandler()
    const player = new Player(canvas.width, canvas.height);
    const background = new Background(canvas.width, canvas.height);

    let lastTime = 0;
    let enemyTimer = 0;
    let enemyInterval = 500;
    let randomEnemyInterval = Math.random() * 1000 + 500;

    /**
     * animation loop, run 60 times per second updating and drawing our game
     * */
    function animate(timeStamp)
    {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // draw background first
        background.draw(ctx);
        background.update();
        //draw play on top of background
        player.draw(ctx);
        player.update(input, deltaTime, enemies); // passing input from keyboard
        handleEnemies(deltaTime);
        displayStatusText(ctx);
        if (!gameOver)
        {
            requestAnimationFrame(animate);
        }


    }
    animate(0);
});
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var background, distance, gameIsPaused, lives, score, player, speed;

//  The Google WebFont Loader will look for this object, so create it before loading the script.
WebFontConfig = {

    //  'active' means all requested fonts have finished loading
    //  We set a 1 second delay before calling 'createText'.
    //  For some reason if we don't the browser cannot render the text the first time it's created.
    active: function() { game.time.events.add(Phaser.Timer.SECOND, createBanner, this); },

    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
      families: ['Revalia']
    }

};

function preload(){

    game.load.image('forest', 'assets/forest.png');
    game.load.image('diamond', 'assets/diamond.png');
    game.load.image('ground', 'assets/platform_alpha.png');
    game.load.image('star', 'assets/diamond.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    game.load.spritesheet('poop', 'assets/poop.png');
    game.load.spritesheet('fire', 'assets/fire.png');
    game.load.image('game-over', 'assets/game-over.jpg');
    game.load.image('loading', 'assets/loading.gif');
    game.load.spritesheet('restart-button', 'assets/restart-button.png');
    game.load.audio('music', 'assets/audios/radioactive.wav');
    game.load.audio('explosion', 'assets/audios/explosion.mp3');
    game.load.audio('blaster', 'assets/audios/blaster.mp3');
    game.load.audio('ping', 'assets/audios/p-ping.mp3');
    game.load.audio('level-up', 'assets/audios/level_up.wav');

    //  Load the Google WebFont Loader script
    game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

}

function create(){

    loading = game.add.tileSprite(0, 0, 800, 600, 'loading');
    gameIsPaused = true;

    // Music
    music = game.add.audio('music');
    music.loop = true;
    music.volume = 0.3;
    music.play();

    explosion = game.add.audio('explosion');
    explosion.volume = 0.6;
    blaster = game.add.audio('blaster');
    blaster.volume = 0.6;
    ping = game.add.audio('ping');
    ping.volume = 0.6;
    levelUp = game.add.audio('level-up');
    levelUp.volume = 0.6;


    // Vars
    lives = 3;
    score = 0;
    speed = 6;
    speedUpdate = false;

    // Add physics
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Add background
    // game.add.sprite(0, 0, 'sky');
    background = game.add.tileSprite(0, 0, 800, 600, 'forest');

    // Add Objects

    // Platforms
    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = game.add.group();
    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;
    // Here we create the ground.
    ground = platforms.create(0, game.world.height - 64, 'ground');
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    ground.scale.setTo(2, 2);
    //  This stops it from falling away when you jump on it
    ground.body.immovable = true;

    enemies = game.add.group();
    enemies.enableBody = true;

    items = game.add.group();
    items.enableBody = true;

    //  Now let's create two ledges
    // var ledge = platforms.create(400, 400, 'ground');
    // ledge.body.immovable = true;
    // ledge = platforms.create(-150, 250, 'ground');
    // ledge.body.immovable = true;

    // Player
    // The player and its settings
    player = game.add.sprite(game.world.width/2 - 16, game.world.height - 500, 'dude');
    //  We need to enable physics on the player
    game.physics.arcade.enable(player);
    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.1;
    player.body.gravity.y = 600;
    player.body.collideWorldBounds = true;
    //  Our two animations, walking left and right.
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);

    // Cursors
    cursors = game.input.keyboard.createCursorKeys();

    // Text
    scoreText = game.add.text(16, 16, 'Score: ' + score, { fontSize: '32px', fill: '#000' });
    livesText = game.add.text(game.world.width - 128, 16, 'Lives: ' + lives, { fontSize: '32px', fill: '#000' });

    loading.bringToTop();
    game.sound.setDecodedCallback([music, explosion, blaster, ping, ], removeLoadingScreen, this);
    gameIsPaused = false;
}

function update(){

    if(!gameIsPaused){
        // Collide the player and the stars with the platforms
        var hitPlatform = game.physics.arcade.collide(player, platforms);

        game.physics.arcade.overlap(player, enemies, gameOver, null, this);
        game.physics.arcade.overlap(player, items, getItem, null, this);

        // Players Movement
        player.body.velocity.x = 0;
        if(cursors.left.isDown){
            // Move to the left
            player.animations.play('left');
            distance -= 1;
        }
        else if(cursors.right.isDown){
            // Move to the right
            player.animations.play('right');
            if(player.position.x < game.world.centerX){
                player.position.x += 1;
            }
            distance += 1;
        }
        else{
            // Stand still
            player.animations.stop();
            player.frame = 4;
            player.position.x -= speed;
        }
        // Allow the player to jump if they are touching the ground.
        if (cursors.up.isDown && player.body.touching.down && hitPlatform){
            player.body.velocity.y = -350;
        }

        if ((Math.floor(Math.random() * 100)) == 99){
            spawnEnemy();
        }
        if ((Math.floor(Math.random() * 100)) == 99){
            spawnItem();
        }
        // Scrolling background
        background.tilePosition.x -= speed;
        if(enemies.children.length){
            for(i=0; i<enemies.children.length; i++){
                enemies.children[i].position.x -= speed;
            }
        }
        if(items.children.length){
            for(i=0; i<items.children.length; i++){
                items.children[i].position.x -= speed;
            }
        }

        if((score%5000 === 0 && speedUpdate)){
            levelUp.play();
            speed ++;
            lives ++;
            speedUpdate = false;
            livesText.text = 'Lives: ' + lives;
        }
    }
}

function spawnEnemy(){
    enemy_list = ['poop', 'fire'];
    selected_enemy = enemy_list[(Math.floor(Math.random() * enemy_list.length))];

    enemy = enemies.create(game.world.width, game.world.height - 96, selected_enemy);
}

function spawnItem(){
    items_list = ['diamond'];
    selected_item = items_list[(Math.floor(Math.random() * items_list.length))];

    if(cursors.right.isDown){
        item = items.create(game.world.width - 64, game.world.height - 200, selected_item);
    }
}

function getItem(){
    ping.play();
    items.children[0].destroy();
    score += 500;
    scoreText.text = 'Score: ' + score;
    speedUpdate = true;
}

function createBanner(){
    text = game.add.text(game.world.centerX, 32, 'Run Run');
    text.anchor.setTo(0.5);

    text.font = 'Revalia';
    text.fontSize = 60;

    //  x0, y0 - x1, y1
    grd = text.context.createLinearGradient(0, 0, 0, text.canvas.height);
    grd.addColorStop(0, '#FFD6FF');
    grd.addColorStop(1, '#FF4CB3');
    text.fill = grd;

    text.align = 'top';
    text.stroke = '#FFF';
    text.strokeThickness = 2;
    text.setShadow(5, 5, 'rgba(0,0,0,0.5)', 5);

    text.inputEnabled = true;
}

function createFinalScoreText() {
    text = game.add.text(game.world.centerX, 32, 'Score: ' + score);
    text.anchor.setTo(0.5);

    text.font = 'Revalia';
    text.fontSize = 60;

    //  x0, y0 - x1, y1
    grd = text.context.createLinearGradient(0, 0, 0, text.canvas.height);
    grd.addColorStop(0, '#FF6000');
    grd.addColorStop(1, '#FF6900');
    text.fill = grd;

    text.align = 'center';
    text.stroke = '#000000';
    text.strokeThickness = 2;
    text.setShadow(5, 5, 'rgba(0,0,0,0.5)', 5);

    text.inputEnabled = true;
}

function gameOver(){
    blaster.play();
    if(lives==1){
        gameIsPaused = true;
        music.destroy();
        explosion.play();
        background = game.add.tileSprite(0, 0, 800, 600, 'game-over');
        restartButton = game.add.button(0, 510, 'restart-button', restartButtonOnClick, this, 0, 0, 0);
        createFinalScoreText();
    }
    else{
        gameIsPaused = true;
        lives--;
        livesText.text = 'Lives: ' + lives;
        music.pause();
        player.destroy();
        enemies.destroy();

        // The player and its settings
        player = game.add.sprite(game.world.width/2 - 16, game.world.height - 500, 'dude');
        //  We need to enable physics on the player
        game.physics.arcade.enable(player);
        //  Player physics properties. Give the little guy a slight bounce.
        player.body.bounce.y = 0.1;
        player.body.gravity.y = 600;
        player.body.collideWorldBounds = true;
        //  Our two animations, walking left and right.
        player.animations.add('left', [0, 1, 2, 3], 10, true);
        player.animations.add('right', [5, 6, 7, 8], 10, true);

        enemies = game.add.group();
        enemies.enableBody = true;

        music.resume();

        gameIsPaused = false;
    }
}

function restartButtonOnClick(){
    game.state.restart();
    gameIsPaused = false;
}

function removeLoadingScreen(){
    loading.destroy();
}

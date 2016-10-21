var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var background, distance, gameIsPaused, lives, score;

function preload() {
    game.load.image('forest', 'assets/forest.png');
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

}

function create() {

    loading = game.add.tileSprite(0, 0, 800, 600, 'loading');

    // Music
    music = game.add.audio('music');
    music.loop = true;
    music.volume = 0.01;
    music.play();

    explosion = game.add.audio('explosion');
    explosion.volume = 0.01;
    blaster = game.add.audio('blaster');
    blaster.volume = 0.01;


    game.sound.setDecodedCallback([music, explosion], removeLoadingScreen, this);

    // Vars
    lives = 3;
    score = 0;

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
}

function update() {

    if(!gameIsPaused){
        //  Collide the player and the stars with the platforms
        var hitPlatform = game.physics.arcade.collide(player, platforms);

        game.physics.arcade.overlap(player, enemies, gameOver, null, this);

        // Players Movement
        //  Reset the players velocity (movement)
        player.body.velocity.x = 0;
        if(cursors.left.isDown){
            //  Move to the left
            // player.body.velocity.x = -150;
            player.animations.play('left');
            // Scrolling background
            background.tilePosition.x += 6;
            distance -= 1;
            if(enemies.children.length){
                for(i=0; i<enemies.children.length; i++){
                    enemies.children[i].position.x += 6;
                }
            }
        }
        else if(cursors.right.isDown){
            //  Move to the right
            // player.body.velocity.x = 150;
            player.animations.play('right');
            // Scrolling background
            background.tilePosition.x -= 6;
            distance += 1;
            if(enemies.children.length){
                for(i=0; i<enemies.children.length; i++){
                    enemies.children[i].position.x -= 6;
                }
            }
            score ++;
            scoreText.text = 'Score: ' + score;
        }
        else{
            //  Stand still
            player.animations.stop();
            player.frame = 4;
        }
        //  Allow the player to jump if they are touching the ground.
        if (cursors.up.isDown && player.body.touching.down && hitPlatform){
            player.body.velocity.y = -350;
        }

        if ((Math.floor(Math.random() * 100)) == 99){
            spawnEnemy();
        }

    }
}

function spawnEnemy(){
    enemy_list = ['poop', 'fire'];
    selected_enemy = enemy_list[(Math.floor(Math.random() * 2))];

    if(cursors.left.isDown){
        enemy = enemies.create(64, game.world.height - 96, selected_enemy);
    }
    else if(cursors.right.isDown){
        enemy = enemies.create(game.world.width - 64, game.world.height - 96, selected_enemy);
    }
}

function gameOver(){
    blaster.play();
    if(lives==1){
        gameIsPaused = true;
        music.destroy();
        explosion.play();
        background = game.add.tileSprite(0, 0, 800, 600, 'game-over');
        restartButton = game.add.button(game.world.centerX - 32, 510, 'restart-button', restartButtonOnClick, this, 0, 0, 0);
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

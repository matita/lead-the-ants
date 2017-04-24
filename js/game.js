var Lead = window.Lead || {};
 
Lead.Game = function () {};

Lead.Game.prototype = {
  init: function () {
    //this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    this.game.renderer.renderSession.roundPixels = false;
    //Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
  },

  preload: function () {

    this.game.load.image('level1', 'levels/level1.png?v=' + Lead.version);
    this.game.load.image('player', 'assets/player.png?v=' + Lead.version);
    this.game.load.spritesheet('ant', 'assets/ant.png?v=' + Lead.version, 8, 4);
    this.game.load.image('nest', 'assets/nest.png?v=' + Lead.version);
    this.game.load.image('food', 'assets/food.png?v=' + Lead.version);

    this.game.load.audio('crunch', 'assets/crunch.wav');
    this.game.load.audio('coin', 'assets/coin.wav');
    this.game.load.audio('win', 'assets/win.wav');
    this.game.load.audio('lose', 'assets/lose.wav');
    this.game.load.audio('blip', 'assets/blip.wav');

    this.game.time.advancedTiming = true;

  },

  create: function () {

    this.alreadyWon = false;
    this.alreadyLose = false;
    this.isLate = false;
    this.isVeryLate = false;
    this.crunchingCount = 0;
    this.stopCrunch();

    this.levelNum = this.levelNum || 1;

    // level vars
    var antsCount = 20;
    var neededFood = 6 + (2 * this.levelNum);
    var timeLimit = Phaser.Timer.MINUTE * 3;
    var foodCX;
    var foodCY;
    if (this.levelNum == 1) {
      this.nestX = 400;
      this.nestY = 400;
      foodCX = 800;
      foodCY = 400;
    } else {
      this.nestX = this.game.world.randomX;
      this.nestY = this.game.world.randomY;
      foodCX = this.game.world.randomX;
      foodCY = this.game.world.randomY;
    }
    // end level vars

    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.stage.backgroundColor = '#999999';
    //  this.game.world.setBounds(0, 0, 6000, 6000);

    this.levelImg = this.game.make.image(0, 0, 'level1');
    this.levelImg.smoothed = false;
    this.levelImg.scale.set(8, 8);

    this.game.world.setBounds(0, 0, this.levelImg.width, this.levelImg.height);

    this.levelBmp = this.game.make.bitmapData(this.game.world.width, this.game.world.height);
    this.levelBmp.smoothed = false;
    this.levelBmp.draw(this.levelImg, 0, 0);
    this.levelBmp.update();
    //this.levelBmp.addToWorld();

    this.levelBmpDest = this.game.make.bitmapData(this.game.world.width, this.game.world.height);
    this.levelBmpDest.smoothed = false;
    this.levelBmpDest.copy(this.levelBmp, 0, 0);
    this.levelBmpDest.addToWorld();

    this.dirtyRect = new Phaser.Rectangle(0, 0, 0, 0);
    this.copyRect = new Phaser.Rectangle(0, 0, this.game.camera.width, this.game.camera.height);

    this.steps = this.game.add.graphics(0, 0);
    this.graphics = this.game.add.graphics(0, 0);

    if (this.levelNum == 1) {
      this.drawFirstLevel();
    }

    this.nest = new Lead.Nest(this, this.nestX, this.nestY);
    this.nest.antsCount = antsCount;
    this.nest.neededFood = neededFood;
    this.game.add.existing(this.nest);
    
    this.foods = this.game.add.group();
    for (var i = 0; i < 10; i++) {
      var food = new Lead.Food(this);
      var angle = this.game.rnd.angle() * Math.PI / 180;
      var dist = this.game.rnd.between(0, 30);
      var foodX = foodCX + Math.cos(angle) * dist;
      var foodY = foodCY + Math.sin(angle) * dist;
      food.reset(foodX, foodY);
      this.foods.add(food);
    }

    this.ants = this.game.add.group();

    this.drops = [];

    this.player = new Lead.Player(this);
    this.game.add.existing(this.player);

    this.crunch = this.game.add.audio('crunch');
    this.coin = this.game.add.audio('coin');
    this.loseAudio = this.game.add.audio('lose');
    this.winAudio = this.game.add.audio('win');

    this.scoreText = this.game.add.text(20, 20, '', { font: '16px arial', fill: '#fff', fontWeight: 'bold' });
    this.scoreText.setShadow(3, 3, 'rgba(0,0,0,.4)', 2);
    this.scoreText.fixedToCamera = true;
    this.scoreText.setTextBounds(0, 0, this.game.width, this.game.height);


    this.spawnTimer = this.game.time.create(false);
    this.spawnTimer.add(Phaser.Timer.MINUTE, this.startSpawn, this);
    this.spawnTimer.start();

    this.gameTimer = this.game.time.create(false);
    this.gameTimer.add(timeLimit, this.endTimer, this);
    this.gameTimer.start();

    this.game.camera.zoom = 4;
  },


  update: function () {

    if (this.dirtyRect.isDirty) {
      this.dirtyRect.intersection(this.game.camera.view, this.copyRect);
      this.levelBmpDest.copyRect(this.levelBmp, this.copyRect, this.copyRect.x, this.copyRect.y);
      this.dirtyRect.isDirty = false;
    }

    this.game.physics.arcade.collide(this.ants, this.foods, function (a, f) { a.startEat(f); }, null, function (a, f) { return a.isSearching; });

    var graphics = this.graphics;
    graphics.clear();

    /*this.graphics.beginFill(0x251103, 1);
    this.graphics.drawCircle(this.nestX, this.nestY, 10);*/
    
    this.drops.forEach(function (p) {
      graphics.beginFill(0xFFCC00, p.alpha);
      graphics.drawCircle(p.x, p.y, p.radius);
    });

    if (this.player.hasOwnProperty('targetX')) {
      graphics.endFill();
      graphics.lineStyle(2, 0x0000ff, .8);
      graphics.drawCircle(this.player.targetX, this.player.targetY, this.player.targetRadius);
    }

    if (this.gameTimer.duration < Phaser.Timer.SECOND * 30)
      this.isVeryLate = true;

    //graphics.lineStyle(2, 0x0000FF, 1);
    //graphics.drawRect(this.copyRect.x, this.copyRect.y, this.copyRect.width, this.copyRect.height);

    this.setStatusText();

  },


  drawFirstLevel: function () {

    var postIt1 = this.drawPostIt(230, 360, 'Find the food.\n(to your right this time)', -3);
    this.drawPostIt(postIt1.x + 20, postIt1.y + postIt1.height + 30, 'You have 1 minute\nbefore ants leave the nest.', 4);

    this.drawPostIt(750, 300, 'This is food,\ncome closer.', 3);
    this.drawPostIt(730, 500, 'Press spacebar to leave traces\nall way back to the nest\nso ants can follow them.', -3);

  },


  drawPostIt: function (x, y, text, rotation) {
    var text = this.game.make.text(10, 10, text, { font: '12px arial', fill: '#555' })
    var paperBGBmp = this.game.make.bitmapData(text.width + 20, text.height + 20);
    paperBGBmp.rect(0, 0, paperBGBmp.width, paperBGBmp.height, '#ffffff');
    paperBGBmp.update();
    var paperBG = this.game.make.sprite(0, 0, paperBGBmp);
    
    var paper1 = this.game.add.group();
    paper1.add(paperBG);
    paper1.add(text);

    paper1.x = x;
    paper1.y = y;
    paper1.rotation = rotation * Math.PI / 180;

    return paper1;
  },


  playCrunch: function () {

    this.crunchingCount = this.crunchingCount || 0;
    this.crunchingCount++;

    if (!this.crunchingTimeout)
      this.loopCrunch();

  },


  loopCrunch: function () {

    this.crunch.play();
    this.crunchingTimeout = this.game.time.events.add(Phaser.Timer.SECOND * 0.5, this.loopCrunch, this);

  },


  stopCrunch: function () {

    this.crunchingCount--;
    if (this.crunchingCount <= 0) {
      this.crunchingCount = 0;
      this.game.time.events.remove(this.crunchingTimeout);
      this.crunchingTimeout = null;
    }

  },


  playCoin: function () {
    this.coin.play();
  },


  setStatusText: function () {
    
    var pixel = this.player.pixel;
    var playerColor = pixel.r && '#' + pixel.r.toString(16) + pixel.g.toString(16) + pixel.b.toString(16);

    var remainingTime = this.toTime(this.gameTimer.duration);
    
    var level = 'Level ' + this.levelNum;
    var ants = 'Ants: ' + this.nest.antsCount + ' / ' + this.ants.countLiving();
    var food = 'Food: ' + this.nest.food + ' / ' + this.nest.neededFood;
    var time = 'Remaining: ' + remainingTime;
    
    var txt = [
      level,
      ants,
      food,
      time
    ].join('\n');

    this.scoreText.setText(txt);

    if (this.isVeryLate)
      this.scoreText.addColor('#ff0000', level.length + ants.length + food.length + 10);
    else if (this.isLate)
      this.scoreText.addColor('#ffcc00', level.length + ants.length + food.length + 10);

  },


  getClosestDrop: function (obj, withinDistance, excluding) {

    var minDistance = Number.MAX_SAFE_INTEGER;
    var d;

    this.drops.forEach(function (p) {
      var distanceToDrop = this.game.physics.arcade.distanceToXY(obj, p.x, p.y);

      if (distanceToDrop < minDistance && distanceToDrop < withinDistance && (!excluding || excluding.indexOf(p) == -1)) {
        minDistance = distanceToDrop;
        d = p;
      }
    }, this);

    return d;

  },


  toTime: function (ms) {
    var m = Math.floor(ms / Phaser.Timer.MINUTE);
    var s = Math.floor(ms / 1000) % 60;
    return (m ? m + 'm ' : '') + 
      s + 's';
  },


  startSpawn: function () {

    this.isLate = true;
    this.nest.startSpawn();

  },


  endTimer: function () {

    if (this.alreadyWon || this.alreadyLose)
      return;

    this.alreadyLose = true;

    var txt = 'You failed!' +
      '\nClick to restart';

    var style = { font: '20px arial', fill: '#fff', boundsAlignH: "center", boundsAlignV: "middle", align: 'center' }
    this.loseText = this.game.add.text(0, 0, txt, style);
    this.loseText.setTextBounds(0, 0, this.game.width, this.game.height);
    this.loseText.setShadow(3, 3, 'rgba(0,0,0,.5)', 2);
    this.loseText.fixedToCamera = true;

    this.loseAudio.play();

    this.game.input.onDown.add(function () {
      this.levelNum = 1;
      this.state.start('Game');
    }, this);

  },


  win: function () {

    if (this.alreadyWon || this.alreadyLose)
      return;

    this.alreadyWon = true;

    var txt = 'Level ' + this.levelNum + ' passed!' +
      '\nYou gathered ' + this.nest.food + ' food in ' + this.toTime(this.gameTimer.ms) +
      '\nClick to go to next level';
    var style = { font: '20px arial', fill: '#fff', boundsAlignH: "center", boundsAlignV: "middle", align: 'center' }
    this.winText = this.game.add.text(0, 0, txt, style);
    this.winText.setTextBounds(0, 0, this.game.width, this.game.height);
    this.winText.setShadow(3, 3, 'rgba(0,0,0,.5)', 2);
    this.winText.fixedToCamera = true;

    this.winAudio.play();

    this.game.input.onDown.add(function () {
      this.levelNum++;
      this.state.start('Game');
    }, this);

  }

}



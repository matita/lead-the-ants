var Lead = Lead || {};
Lead.Ant = function (Game) {

  this.Game = Game;
  this.speed = 30;
  this.maxDistanceToDrop = 100;
  this.maxDistanceToFood = 100;
  this.passedDrops = [];
  this.footStepWeight = 0.1;

  this.isSearching = true;
  this.isEating = false;
  this.isGoingToNest = false;

  Phaser.Sprite.call(this, Game.game, Game.nest.x, Game.nest.y, 'ant');

  this.animations.add('eat', [1, 0], 6, true);

  Game.game.physics.arcade.enable(this, Phaser.Physics.ARCADE);

  //this.smoothed = false;
  this.anchor.setTo(0.5, 0.5);

  this.pixel = {};

  this.crunch = this.game.add.audio('crunch');
  this.crunch.loop = true;
}

Lead.Ant.prototype = Object.create(Phaser.Sprite.prototype);
Lead.Ant.constructor = Lead.Ant;

Lead.Ant.prototype.moveTo = function (x, y) {

  this.targetX = x;
  this.targetY = y;
  this.rotation = this.Game.game.physics.arcade.moveToXY(this, x, y, this.speed);

}


Lead.Ant.prototype.randomTarget = function () {

  var distance = 10;
  var angle = this.Game.game.rnd.angle() / 3;
  var rad = this.rotation + angle * Math.PI / 180;

  var dx = Math.cos(rad) * distance;
  var dy = Math.sin(rad) * distance;

  this.moveTo(this.x + dx, this.y + dy);

}


Lead.Ant.prototype.changeTarget = function () {

  this.isAI = true;
  if (this.isSearching)
    this.followFood() || this.followDrop() || this.randomTarget();
  else
    this.followNest() || this.followDrop() || this.randomTarget();

}


Lead.Ant.prototype.followNest = function () {

  var distanceToNest = this.Game.game.physics.arcade.distanceToXY(this, this.Game.nestX, this.Game.nestY);

  if (distanceToNest > this.maxDistanceToDrop)
    return false;

  this.moveTo(this.Game.nestX, this.Game.nestY);
  this.isGoingToNest = true;
  return true;

}


Lead.Ant.prototype.followFood = function () {

  var minDistance = Number.MAX_SAFE_INTEGER;
  var f;

  this.Game.foods.forEachAlive(function (p) {
    var distanceToFood = this.Game.game.physics.arcade.distanceToXY(this, p.x, p.y);
    if (distanceToFood < this.maxDistanceToFood && distanceToFood < minDistance && p.slots) {
      minDistance = distanceToFood;
      f = p;
    }
  }, this);

  if (f) {
    this.moveTo(f.x, f.y);
  }

  return f;

}


Lead.Ant.prototype.followDrop = function () {

  var d = this.Game.getClosestDrop(this, this.maxDistanceToDrop, this.passedDrops);

  if (d) {
    var minDistance = this.Game.game.physics.arcade.distanceToXY(this, d.x, d.y);
    this.moveTo(d.x, d.y);

    var frameSpeed = this.body.velocity.getMagnitude() / 60;
    if (minDistance <= frameSpeed * 2)
      this.passedDrops.push(d);
    while (this.passedDrops.length > 3)
      this.passedDrops.shift();
  }

  return d;

}


Lead.Ant.prototype.startEat = function (food) {

  delete this.targetX;
  delete this.targetY;
  
  this.isEating = food;
  this.body.velocity.setTo(0, 0);
  this.Game.game.time.events.add(Phaser.Timer.SECOND * 3.2, this.endEat, this);

  food.startEat();

  this.animations.play('eat');
  this.Game.playCrunch();

}


Lead.Ant.prototype.endEat = function () {

  if (this.isEating)
    this.isEating.eat();
  this.isSearching = false;
  this.isEating = false;

  while (this.passedDrops.length)
    this.passedDrops.pop();

  this.changeTarget();

  this.animations.stop();
  this.frame = 2;
  this.Game.stopCrunch();

}


Lead.Ant.prototype.returnToNest = function () {

  this.Game.playCoin();
  this.Game.nest.storeFood();
  this.kill();
  this.Game.game.time.events.add(Phaser.Timer.SECOND * 3, this.availableAgain, this)

}


Lead.Ant.prototype.availableAgain = function () {

  this.Game.nest.antsCount++;

}


Lead.Ant.prototype.revive = function () {

  this.isSearching = true;
  this.isEating = false;
  this.isGoingToNest = false;

  this.frame = 0;
  
  while (this.passedDrops.length)
    this.passedDrops.pop();

  Phaser.Sprite.prototype.revive.apply(this, arguments);

}


Lead.Ant.prototype.update = function () {

  if (this.x < 0 || this.y < 0 || this.x > this.Game.game.world.width || this.y > this.Game.game.world.height)
    return this.kill();

  if (this.isEating)
    return;

  if (this.hasOwnProperty('targetX')) {

    this.footStep();

    var distanceToTarget = this.Game.game.physics.arcade.distanceToXY(this, this.targetX, this.targetY);
    var frameSpeed = this.body.velocity.getMagnitude() / 60;

    if (distanceToTarget <= frameSpeed * 2) {
      this.body.velocity.setTo(0, 0);
      delete this.targetX;
      delete this.targetY;

      if (this.isAI) {
        
        if (this.isGoingToNest)
          this.returnToNest();
        else
          this.changeTarget();

      }
    } else {
      this.computeSpeed();
    }

    
  }

}


Lead.Ant.prototype.footStep = function () {
  
  var dx = this.x - this.lastStepX;
  var dy = this.y - this.lastStepY;
  var distanceToLast = Math.sqrt(dx*dx + dy*dy);

  if (isNaN(distanceToLast) || distanceToLast >= 3) {
    this.Game.levelBmp.circle(this.x, this.y, 1, 'rgba(73,60,43,' + this.footStepWeight + ')');
    this.lastStepX = this.x;
    this.lastStepY = this.y;

    this.setDirtyRect();
  }

}


Lead.Ant.prototype.setDirtyRect = function () {

  if (!this.Game.game.camera.view.contains(this.x, this.y))
    return;

  var dirtyRect = this.Game.dirtyRect;

  var x = Math.floor(this.x);
  var y = Math.floor(this.y);

  if (!dirtyRect.isDirty) {

    dirtyRect.x = x - 1;
    dirtyRect.y = y - 1;
    dirtyRect.width = 3;
    dirtyRect.height = 3;
    dirtyRect.isDirty = true; 

  } else {

    if (x < dirtyRect.x) {
      dirtyRect.width = dirtyRect.x + dirtyRect.width - (x - 1) + 1;
      dirtyRect.x = x - 1;
    } 

    if (this.x > dirtyRect.x + dirtyRect.width) {
      dirtyRect.width = x + 1 - dirtyRect.x;
    }
      
    if (this.y < dirtyRect.y) {
      dirtyRect.height = dirtyRect.y + dirtyRect.height - (y - 1) + 1;
      dirtyRect.y = y - 1;
    }

    if (this.y > dirtyRect.y + dirtyRect.height) {
      dirtyRect.height = y + 1 - dirtyRect.y;
    }

  }

}


Lead.Ant.prototype.currentGround = function () {

  this.Game.levelBmp.getPixel(Math.floor(this.x), Math.floor(this.y), this.pixel);
  if (!this.pixel.r)
    return;
  return '#' + this.pixel.r.toString(16) + this.pixel.g.toString(16) + this.pixel.b.toString(16);

}


Lead.Ant.prototype.computeSpeed = function () {

  var color = this.currentGround();
  if (!color)
    return;
  
  var modifier = 1;
  if (color == '#44891a')
    modifier = 0.5;
  var angle = this.body.rotation * Math.PI / 180;
  this.body.velocity.x = Math.cos(angle) * (this.speed * modifier);
  this.body.velocity.y = Math.sin(angle) * (this.speed * modifier);

}
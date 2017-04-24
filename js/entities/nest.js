var Lead = Lead || {};
Lead.Nest = function (Game, x, y) {

  this.Game = Game;
  this.antsCount = 20;
  this.food = 0;
  this.neededFood = 10;

  Phaser.Sprite.call(this, Game.game, x, y, 'nest');
  this.smoothed = false;
  this.scale.setTo(4, 4);
  this.anchor.set(0.5, 0.5);

  this.antTimer = this.game.time.create(false);
  this.antTimer.loop(2000, this.spawnAnt, this);

}

Lead.Nest.prototype = Object.create(Phaser.Sprite.prototype);
Lead.Nest.constructor = Lead.Nest;


Lead.Nest.prototype.spawnAnt = function () {
  
  if (this.antsCount <= 0)
    return;

  this.antsCount--;

  var ant = this.Game.ants.getFirstDead();
  if (!ant) {
    ant = new Lead.Ant(this.Game);
    this.Game.ants.add(ant);
  } else {
    ant.revive();
    ant.reset(this.x, this.y);
  }

  ant.rotation = this.game.rnd.angle();
  ant.changeTarget();

}


Lead.Nest.prototype.update = function () {

  var d = this.Game.getClosestDrop(this, 100);
  if (d)
    this.startSpawn();

}


Lead.Nest.prototype.startSpawn = function () {

  if (!this.antTimer.running)
    this.antTimer.start();

}


Lead.Nest.prototype.moreAnts = function () {
  this.antTimer.events[0].delay = Math.max(this.antTimer.events[0].delay / 2, 500);
}


Lead.Nest.prototype.lessAnts = function () {
  this.antTimer.events[0].delay = Math.min(this.antTimer.events[0].delay * 2, 10000);
}


Lead.Nest.prototype.storeFood = function () {

  this.food++;
  if (this.food >= this.neededFood)
    this.Game.win();

}
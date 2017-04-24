var Lead = Lead || {};
Lead.Drop = function (Game, x, y) {

  this.Game = Game;

  Phaser.Point.call(this, x, y);
  this.alpha = 1;
  this.radius = 0;

  this.startTween();

}


Lead.Drop.prototype = Object.create(Phaser.Point.prototype);
Lead.Drop.constructor = Lead.Drop;

Lead.Drop.prototype.startTween = function () {

  this.alpha = 1;
  this.radius = 0;
  this.tween = this.Game.game.add.tween(this);
  this.tween.to({ alpha: 0, radius: 200 }, 2000, Phaser.Easing.Quadratic.Out);
  this.tween.onComplete.add(this.startTween, this);
  this.tween.start();

}
var Lead = Lead || {};
Lead.Food = function (Game) {

  this.portions = 5;
  this.slots = this.portions;

  Phaser.Sprite.call(this, Game.game, 100, 100, 'food');
  this.anchor.set(0.5, 0.5);

  Game.game.physics.arcade.enable(this, Phaser.Physics.ARCADE);
  this.body.immovable = true;

}


Lead.Food.prototype = Object.create(Phaser.Sprite.prototype);
Lead.Food.constructor = Lead.Food;


Lead.Food.prototype.startEat = function () {

  this.slots--;

}


Lead.Food.prototype.eat = function () {

  this.portions--;
  if (this.portions <= 0)
    this.kill();

}
var Lead = Lead || {};
Lead.Player = function (Game) {

  Lead.Ant.call(this, Game);
  //this.loadTexture('player');
  this.frame = 3;
  this.speed = 60;
  this.footStepWeight = 0.3;
  this.targetRadius = 0;

  Game.game.camera.follow(this/*, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1*/);

  Game.game.input.onDown.add(this.onMouseDown, this);
  Game.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(this.drop, this);
  Game.game.input.keyboard.addKey(Phaser.Keyboard.UP).onDown.add(Game.nest.moreAnts, Game.nest);
  Game.game.input.keyboard.addKey(Phaser.Keyboard.DOWN).onDown.add(Game.nest.lessAnts, Game.nest);

  this.blip = Game.game.add.audio('blip');
  this.targetTween = Game.game.add.tween(this);
  this.targetTween.to({ targetRadius: 20 }, 200, 'Linear', false, 0, 0, true);
  
}


Lead.Player.prototype = Object.create(Lead.Ant.prototype);
Lead.Player.constructor = Lead.Player;


Lead.Player.prototype.onMouseDown = function () {

  var targetX = this.Game.game.input.x + this.Game.game.camera.x;
  var targetY = this.Game.game.input.y + this.Game.game.camera.y;
  this.moveTo(targetX, targetY);

  this.blip.play();
  this.targetRadius = 0;
  this.targetTween.start();

};



Lead.Player.prototype.drop = function () {
  
  var p = new Lead.Drop(this.Game, this.x, this.y);
  this.Game.drops.push(p);

}
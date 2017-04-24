var Lead = Lead || {};
Lead.version = '0.1.1';

Lead.game = new Phaser.Game(640, 400, Phaser.AUTO, '');
Lead.game.state.add('Game', Lead.Game);

Lead.game.state.start('Game');
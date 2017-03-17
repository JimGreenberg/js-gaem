import 'yuki-createjs';
import Enemy from './enemy.js';
import Player from './player.js';
import * as _ from './util.js';
window.WIDTH = 2000;
window.HEIGHT = 1200;


window.init = () => {
  window.canvas = document.getElementById('ctx');
  const context = canvas.getContext('2d');
  window.button = document.getElementById('button');
  window.modal = document.getElementById('modal');
  button.addEventListener('click', e => {
    window.game = new Game(canvas);
    window.scrollTo(0,200);
    window.modal.classList.toggle('hidden');
    setTimeout(game.initGame.bind(game), 200);
  });
  context.imageSmoothingQuality = "high";
};

class Game {
  constructor(canvas, starting = true) {
    //initialize primal game constants
    this.players = {};
    this.stage = new createjs.Stage(canvas);
    this.arena = new createjs.Container();
    this.background = new createjs.Shape();
    const bgmap = new createjs.Bitmap('./img/background.jpg');
    bgmap.image.onload = () => {
      this.background.graphics
      .beginBitmapFill(bgmap.image)
      .drawRect(0, 0, WIDTH, HEIGHT);
    };

    //populate the drawing context with the game arena
    this.stage.addChild(this.arena);
    this.arena.addChild(this.background);
    this.arena.setBounds(0, 0, WIDTH, HEIGHT);
    this.createPlayer();
    this.stage.update();

    //initialize the game ticker
    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener(this.stage);

    //add player input event listeners
    document.onclick = e => {this.player.dash(this.stage);};
    document.onkeydown = e => {
      if (e.keyCode === 32) {this.player.die();}
    };

  }

  initGame() {
    this.addEnemies();
    Object.keys(this.players).forEach(
      id => this.players[id].addDots(this.arena)
    );

    //start the game after half a second so the player has time to react
    setTimeout(this.startGame.bind(this), 500);
  }

  startGame() {
    createjs.Ticker.on('tick', this.update.bind(this));
  }

  stopGame() {
    createjs.Ticker.reset();
  }

  swordCollide(p1, p2) {
    return _.distance(p1.swordPoint(), p2.swordPoint()) < 34;
  }

  bodyCollide(p1, p2) {
    return(_.distance(p1.swordPoint(), p2.pos()) < 37 ||
           _.distance(p1.swordPoint(), p2.backRightPoint()) < 37 ||
           _.distance(p1.swordPoint(), p2.backLeftPoint()) < 37
    );
  }

  dotCollide(p1, p2) {
    return _.distance(p1.swordPoint(), p2.lastDot()) < 25;
  }

  checkCollisions() {
    for (var i = 0; i < Object.keys(this.players).length; i++) {
      let aId = Object.keys(this.players)[i];
      let a = this.players[aId];
      for (var j = 0; j < Object.keys(this.players).length; j++) {
        let bId = Object.keys(this.players)[j];
        let b = this.players[bId];
        if (bId !== aId) {
          //check if player a collided with player b
          if (this.swordCollide(a, b)) {
            if (a.dashing) {
              b.handleKnockback(a, 15);
              a.stealDot(b.loseDot());
            } else {
              b.handleKnockback(a, 2);
            }
          } else if (this.bodyCollide(a, b)) {
            if (a.dashing) {
              b.handleKnockback(a, 20);
            } else {
              b.handleKnockback(a, 2);
              a.handleKnockback(b, 2);
            }
          } else if (a.dashing && this.dotCollide(a, b)) {
            let dot = b.loseDot();
            if (dot) {a.stealDot(dot.makeHalo(this.arena));}

          }
        }
      }
    }
  }

  addEnemies() {
    while (Object.keys(this.players).length < 4) {
      /*
      Enemy gets passed a player object instead of a pointer callback,
      which will be converted to a pointer callback in the Enemy constructor
      */
      let enemy = new Enemy(_.sample(this.players));
      this.players[enemy.id] = enemy;
      this.arena.addChild(enemy.sprite);
    }
  }

  createPlayer() {
    this.player = new Player(() => ({x: this.stage.mouseX, y: this.stage.mouseY}), this.arena);
    this.players[this.player.id] = this.player;
    this.arena.x = -this.player.x + 500;
    this.arena.y = -this.player.y + 300;
    this.stage.addChild(this.player.sprite);
  }

  removeDead(player) {
    this.arena.removeChild(player.sprite);
    this.arena.removeChild(player.ring);
    delete this.players[player.id];
  }

  enemies() {
    let enemies = Object.assign({}, this.players);
    delete enemies[this.player.id];
    return enemies;
  }

  updateEnemiesPositions() {
    let enemies = this.enemies();
    Object.keys(enemies).forEach(id => {
      let enemy = enemies[id];
      enemy.updatePosition();
      if (enemy.dead) {this.removeDead(enemy);}
    });
  }

  update(e) {
    if (this.player.dead) {
      this.lose();
    } else if (this.player.dots.length === 12) {
      this.win();
    } else {
      this.player.updatePosition();
      this.updateEnemiesPositions();
      this.checkCollisions();
      this.stage.update(e);
    }
  }

  win() {
    this.stopGame();
    document.getElementById('text').innerHTML = 'YOU WON';
    window.button.innerHTML = "Play Again";
    this.resetGame();
  }
  lose() {
    this.stopGame();
    document.getElementById('text').innerHTML = 'YOU DIED<br/>How did you let that happen?';
    window.button.innerHTML = "Retry";
    this.resetGame();
  }

  resetGame() {
    window.scrollTo(0,0);
    window.modal.classList.toggle('hidden');
    document.getElementById('ctx').remove();
    window.canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.id = 'ctx';
    canvas.width = 1000;
    canvas.height = 600;
    document.body.appendChild(canvas);
  }
}

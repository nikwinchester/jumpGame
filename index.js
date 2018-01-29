var game = new Game();
game.initScene();
setTimeout(() => {
    document.querySelector('.scene').click();
    game.jumpCharge();
    game.jumpStart();
    game.initController();
}, 500);

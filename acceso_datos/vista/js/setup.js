import { City } from './city.js';
import { GameController } from './gameController.js';

export const SetupController = {
  init(){
    const btn = document.getElementById('turno-btn');
    btn.addEventListener('click',()=> GameController._doTurn());
    // start game immediately for now
    const city = new City({width:15,height:15});
    GameController.start(city);
  }
};

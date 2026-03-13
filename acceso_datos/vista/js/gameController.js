import { City } from './city.js';
import { CitizenSystem } from './citizens.js';
import { UI } from './ui.js';
import { Grid } from './grid.js';
import { Storage } from './storage.js';

export const GameController = {
  city: null,
  paused: false,
  mode: 'build',
  selectedBuilding: 'road',

  start(city) {
    this.city = city;
    this.paused = false;
    this.mode = 'build';
    this.selectedBuilding = 'road';

    document.getElementById('estado-general').classList.add('active');

    Grid.init(city);
    UI.updateHUD(city);
    UI.notify('Juego iniciado', 'success');

    this._startTurnLoop();
    this._bindGridClicks();
  },

  _startTurnLoop() {
    clearInterval(this._turnTimer);
    const ms = (this.city.turnSpeedS || 10) * 1000;
    this._turnTimer = setInterval(() => this._doTurn(), ms);
  },

  _doTurn() {
    if (this.paused) return;
    const { alerts } = this.city.processTurn();
    CitizenSystem.processTurn(this.city);
    CitizenSystem.updateHappiness(this.city);
    Grid.render();
    UI.updateHUD(this.city);
    if (alerts && alerts.length) alerts.forEach(a=>UI.notify(a,'error'));
  },

  togglePause() {
    this.paused = !this.paused;
    UI.notify(this.paused ? '⏸ Pausado' : '▶ Reanudado');
  },

  _bindGridClicks() {
    document.getElementById('mapa').addEventListener('click', e => {
      const cell = e.target.closest('.celda');
      if (!cell) return;
      const x = parseInt(cell.dataset.x,10);
      const y = parseInt(cell.dataset.y,10);
      if (this.mode==='build') this._tryBuild(x,y);
      if (this.mode==='demolish') this._tryDemolish(x,y);
    });
  },

  _tryBuild(x,y) {
    const check = this.city.canBuild(x,y,this.selectedBuilding);
    if (!check.ok) { UI.notify(check.reason,'error'); return; }
    this.city.build(x,y,this.selectedBuilding);
    Grid.refreshCell(x,y);
    UI.updateHUD(this.city);
  },

  _tryDemolish(x,y) {
    const res = this.city.demolish(x,y);
    if (!res.ok) { UI.notify('No hay nada para demoler','error'); return; }
    Grid.refreshCell(x,y);
    UI.updateHUD(this.city);
  }
};

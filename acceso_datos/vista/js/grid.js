export const Grid = {
  _city: null,
  init(city) {
    this._city = city;
    this.render();
  },
  render() {
    const city = this._city;
    const container = document.getElementById('mapa');
    container.style.gridTemplateColumns = `repeat(${city.ancho}, 24px)`;
    container.style.gridTemplateRows = `repeat(${city.alto}, 24px)`;
    container.innerHTML = '';
    for (let y = 0; y < city.alto; y++) {
      for (let x = 0; x < city.ancho; x++) {
        const el = document.createElement('div');
        el.className = 'celda tipo-' + (city.mapa.obtenerCelda ? city.mapa.obtenerCelda(x,y) : 'g');
        el.dataset.x = x;
        el.dataset.y = y;
        const tipo = city.mapa.obtenerCelda(x,y);
        el.textContent = tipo==='g'?'':tipo;
        container.appendChild(el);
      }
    }
  },
  refreshCell(x,y) { this.render(); }
};
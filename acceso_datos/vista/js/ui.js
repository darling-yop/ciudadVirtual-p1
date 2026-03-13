export const UI = {
  notify(msg, type='info', duration=2000){
    const cont = document.getElementById('notifications');
    if(!cont) return;
    const el=document.createElement('div');
    el.className=`notification notification--${type}`;
    el.textContent=msg;
    cont.appendChild(el);
    setTimeout(()=>el.remove(), duration);
  },
  updateHUD(city){
    const info=document.getElementById('info-ciudad');
    if(info) info.textContent=JSON.stringify(city.obtenerEstadoGeneral(),null,2);
  }
};
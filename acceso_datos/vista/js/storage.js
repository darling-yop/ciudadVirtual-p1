import { Ciudad } from '../../../modelos/Ciudad.js';
export const Storage = {
  save(city){
    try {localStorage.setItem('ciudad_save', JSON.stringify(city.toJSON()));return true;}catch(e){return false;}
  },
  load(){
    try{const raw=localStorage.getItem('ciudad_save'); if(!raw) return null; return Ciudad.fromJSON(JSON.parse(raw));}catch{return null;}
  },
  has(){return !!localStorage.getItem('ciudad_save');}
};
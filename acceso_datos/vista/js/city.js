import {CONFIG, BUILDINGS} from './config.js';

export class City {
    constructor(opts = {}) {
        this.name = opts.name || 'Mi Ciudad';
        this.mayor = opts.mayor || 'Alcalde';
        this.ancho = opts.width || 15;
        this.alto = opts.height || 15;
        this.turno = 0;
        this.puntuacion = 0;

        this.recursos = {
            dinero: opts.dineroStart || CONFIG.INITIAL_MONEY,
            electricidad: opts.electricityStart || 0,
            agua: opts.waterStart || 0,
            comida: opts.foodStart || 0
        };

        this.citizenGrowth = opts.citizenGrowth || CONFIG.DEFAULT_CITIZEN_GROWTH;
        this.citizens = [];
        this.buildings = {};
        this.roads = {};
        this.cells = opts.cells || this._createEmptyGrid();
    }

    _createEmptyGrid() {
        return Array(this.ancho * this.alto).fill(null);
    }
    cellKey(x, y) { return `${x},${y}`; }
    cellIndex(x,y){return y*this.ancho+x;}
    inBounds(x,y){return x>=0&&x<this.ancho&&y>=0&&y<this.alto;}
    getCell(x,y){return this.cells[this.cellIndex(x,y)];}
    setCell(x,y,v){this.cells[this.cellIndex(x,y)]=v;}
    isEmpty(x,y){return this.inBounds(x,y)&&this.getCell(x,y)===null;}
    isRoad(x,y){return this.getCell(x,y)==='road';}
    hasAdjacentRoad(x,y){
        const dirs=[[0,-1],[0,1],[-1,0],[1,0]];
        return dirs.some(([dx,dy])=>this.isRoad(x+dx,y+dy));
    }
    canBuild(x,y,buildingId){
        if(!this.inBounds(x,y)) return {ok:false,reason:'fuera de rango'};
        if(!this.isEmpty(x,y)) return {ok:false,reason:'ocupado'};
        const def=BUILDINGS[buildingId];
        if(!def) return {ok:false,reason:'sin definicion'};
        if(this.recursos.dinero<def.cost) return {ok:false,reason:'dinero insuficiente'};
        if(buildingId!=='road' && !this.hasAdjacentRoad(x,y)) return {ok:false,reason:'requiere via adyacente'};
        return {ok:true};
    }
    build(x,y,buildingId){
        const check=this.canBuild(x,y,buildingId);
        if(!check.ok) return check;
        this.setCell(x,y,buildingId);
        this.buildings[this.cellKey(x,y)]={
            def:BUILDINGS[buildingId],
            occupants:0,employees:0
        };
        this.recursos.dinero-=BUILDINGS[buildingId].cost;
        return {ok:true};
    }
    demolish(x,y){
        const key=this.cellKey(x,y);
        if(!this.hasBuilding(x,y)&&!this.isRoad(x,y)) return {ok:false};
        if(this.isRoad(x,y)){
            this.setCell(x,y,null);
            delete this.roads[key];
            return {ok:true};
        }
        const val=this.getCell(x,y);
        this.setCell(x,y,null);
        delete this.buildings[key];
        return {ok:true,removed:val};
    }
    hasBuilding(x,y){
        const c=this.getCell(x,y);
        return c && c!=='road';
    }
    getResourceTotals(){
        let elecP=0,elecC=0,aguaP=0,aguaC=0;
        Object.values(this.buildings).forEach(inst=>{
            if(inst.def.category==='utility'){
                if(inst.def.jobs&&inst.def.jobs>0){}//no
            }
        });
        return {elecProd:elecP,elecCons:elecC,aguaProd:aguaP,aguaCons:aguaC};
    }
    getGlobalHappinessBonus(){
        let cnt=0;
        Object.values(this.buildings).forEach(inst=>{
            if(['park','service'].includes(inst.def.category))cnt++;
        });
        return cnt*2;
    }
    getTotalHousingCapacity(){
        return Object.values(this.buildings).reduce((a,inst)=>{
            return a + (inst.def.category==='residential'?inst.def.capacity:0);
        },0);
    }
    getTotalJobs(){
        return Object.values(this.buildings).reduce((a,inst)=>{
            return a + (inst.def.jobs||0);
        },0);
    }
    getAvailableHousing(){
        const used=this.citizens.length;
        return Math.max(0,this.getTotalHousingCapacity()-used);
    }
    getAvailableJobs(){
        const employed=this.citizens.filter(c=>c.jobKey).length;
        return Math.max(0,this.getTotalJobs()-employed);
    }
}

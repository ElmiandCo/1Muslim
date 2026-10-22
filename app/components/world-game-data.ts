export type Era = "hub" | "dinosaurs" | "moses" | "jesus" | "muhammad" | "today" | "future";
export const eras: Era[] = ["dinosaurs","moses","jesus","muhammad","today","future"];
export type Player={x:number;y:number;z:number;vx:number;vz:number;vy:number;yaw:number;pitch:number;fly:boolean};
export type Object3D={x:number;z:number;kind:"tree"|"building"|"rock"|"animal"|"landmark";size:number;name?:string};
export const names:Record<Era,string>={hub:"The White Between",dinosaurs:"Time of Dinosaurs",moses:"Time of Moses",jesus:"Time of Jesus",muhammad:"Time of Muhammad",today:"Today",future:"The Future"};
export const palettes:Record<Era,[string,string,string,string]>={
hub:["#f8ffff","#d8ebe8","#e4f0ec","#f6fcf8"],
dinosaurs:["#88d1e1","#c6dca8","#53805c","#618c62"],
moses:["#a6d2e5","#ead6ac","#b99b6d","#ceb283"],
jesus:["#9ac9e7","#e7dbb9","#94ab7e","#adbb8f"],
muhammad:["#a9d5ed","#f0dbb4","#d3b27d","#e2c48e"],
today:["#80b8e8","#c6d9dc","#8cae94","#9dbba0"],
future:["#303c75","#8593bc","#444f79","#576388"]};

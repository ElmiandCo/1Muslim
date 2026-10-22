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

export function heightAt(x: number, z: number, era: Era): number { if (era === "hub") return 0; return Math.sin(x * 0.09) * Math.cos(z * 0.075); }

export function waterAt(x:number,z:number,era:Era):boolean { return x>16 && z>8 && (era==="dinosaurs" || era==="moses" || era==="muhammad"); }

/** Landmark anchors shared by the world-object generator; environmental placeholders only. */
export const landmarks: Record<Era, Array<{x:number;z:number;name:string}>> = {
 hub: [],
 dinosaurs: [{x:-14,z:42,name:"Ancient Grove"},{x:20,z:88,name:"Fossil Ridge"}],
 moses: [{x:-12,z:36,name:"Riverbank"},{x:18,z:84,name:"Ancient Courtyard"}],
 jesus: [{x:-16,z:44,name:"Hillside Village"},{x:15,z:89,name:"Stone Market"}],
 muhammad: [{x:-18,z:40,name:"Desert Oasis"},{x:20,z:87,name:"Caravan Waypoint"}],
 today: [{x:-16,z:45,name:"City Park"},{x:18,z:90,name:"Town Square"}],
 future: [{x:-17,z:43,name:"Skybridge"},{x:20,z:86,name:"Transit Hub"}]
};

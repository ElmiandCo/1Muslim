"use client";
import {useState} from "react";
export default function GameMarketplace(){const [open,setOpen]=useState(false);return <div><button onClick={()=>setOpen(!open)}>Marketplace</button>{open&&<p>Moon Pioneer · Jungle Guardian · River Keeper · City Pathfinder</p>}</div>}

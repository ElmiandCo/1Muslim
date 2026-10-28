/** Shared ordinary-avatar flight controls. Dedicated ship, EVA and aircraft physics stay separate. */
export type GameFlightVerticalInput=Readonly<{
 velocity:number;
 altitude:number;
 deltaSeconds:number;
 ascend:boolean;
 descend:boolean;
 boosted:boolean;
}>;

/** Hold descend to dive; boosted descent is faster, but bounded so swept collision can catch rooftops. */
export function nextGameFlightVerticalSpeed(input:GameFlightVerticalInput):number{
 const dt=Math.max(0,Math.min(.05,input.deltaSeconds));
 // The descend button wins when the canvas is also held for upward flight.
 const acceleration=input.descend?-(input.boosted?90:65):input.ascend?(input.altitude>85?19.5:13):-5;
 const minSpeed=-(input.boosted?80:55);
 const maxSpeed=input.altitude>85?10.5:7;
 return Math.max(minSpeed,Math.min(maxSpeed,input.velocity+acceleration*dt));
}

/** Camera-relative stars stay visible above the atmosphere with a mobile-friendly draw budget. */
export function gameFlightStarBudget(atmosphere:number):number{
 if(!Number.isFinite(atmosphere)||atmosphere<=.05)return 0;
 const visibility=Math.max(0,Math.min(1,(atmosphere-.05)/.95));
 return Math.round(48+112*visibility);
}

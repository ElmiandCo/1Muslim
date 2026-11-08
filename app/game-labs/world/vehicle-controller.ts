/** Preview-only deterministic arcade vehicle dynamics. Metres, seconds, radians; no rendering or production wiring. */
export interface VehicleState { readonly x:number; readonly z:number; readonly heading:number; readonly speed:number }
export interface VehicleInput { readonly throttle:number; readonly brake:number; readonly steer:number }
export interface VehicleConfig { readonly maxForward:number; readonly maxReverse:number; readonly acceleration:number; readonly braking:number; readonly drag:number; readonly steeringRadiansPerSecond:number }
export const DEFAULT_VEHICLE_CONFIG:VehicleConfig={maxForward:20,maxReverse:5,acceleration:7,braking:12,drag:1.8,steeringRadiansPerSecond:1.3};
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
export function stepVehicle(state:VehicleState,input:VehicleInput,dt:number,config:VehicleConfig=DEFAULT_VEHICLE_CONFIG):VehicleState {
  if(!Number.isFinite(dt)||dt<=0||dt>0.1)throw new Error("Vehicle step must be fixed and within (0, 0.1] seconds");
  if(![state.x,state.z,state.heading,state.speed,input.throttle,input.brake,input.steer].every(Number.isFinite))throw new Error("Non-finite vehicle state or input");
  if(config.maxForward<=0||config.maxReverse<=0||config.acceleration<=0||config.braking<=0||config.drag<0||config.steeringRadiansPerSecond<=0)throw new Error("Invalid vehicle configuration");
  const throttle=clamp(input.throttle,-1,1),brake=clamp(input.brake,0,1),steer=clamp(input.steer,-1,1);
  let speed=state.speed+throttle*config.acceleration*dt;
  const resistance=(config.drag+brake*config.braking)*dt;
  speed=Math.sign(speed)*Math.max(0,Math.abs(speed)-resistance);
  speed=clamp(speed,-config.maxReverse,config.maxForward);
  const turnFactor=clamp(Math.abs(speed)/5,0,1)*Math.sign(speed);
  const heading=state.heading+steer*config.steeringRadiansPerSecond*turnFactor*dt;
  return {x:state.x+Math.sin(heading)*speed*dt,z:state.z+Math.cos(heading)*speed*dt,heading,speed};
}

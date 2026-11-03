/** Pure, world-agnostic avatar pose cues; does not modify flight physics. */
export type GameFlightPhase="grounded"|"takeoff"|"cruise"|"ascending"|"descending"|"falling"|"landing";
export type GameFlightPoseInput=Readonly<{
  flying:boolean;
  verticalSpeed:number;
  groundClearance:number;
  takeoffAgeMs:number;
  landingAgeMs:number;
  forwardInput:boolean;
}>;
export type GameFlightPose=Readonly<{
  phase:GameFlightPhase;
  torsoLean:number;
  headForward:number;
  armLift:number;
  legLift:number;
  trailSlope:number;
}>;
const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
/**
 * Distinguishes climbing, diving, coasting, free fall, takeoff and touchdown.
 * The remote-player fallback (speed 0, aged takeoff) stays a neutral cruise;
 * no new network packets or per-frame React state are needed.
 */
export function calculateGameFlightPose(input:GameFlightPoseInput):GameFlightPose{
  const {flying,verticalSpeed,groundClearance,takeoffAgeMs,landingAgeMs,forwardInput}=input;
  const launch=clamp01(takeoffAgeMs/800);
  const up=flying?clamp01(verticalSpeed/10):0;
  const down=flying?clamp01(-verticalSpeed/16):0;
  const falling=!flying&&groundClearance>.65&&verticalSpeed< -2;
  const landing=!flying&&!falling&&landingAgeMs>=0&&landingAgeMs<600;
  const phase:GameFlightPhase=flying
    ?takeoffAgeMs>=0&&takeoffAgeMs<500?"takeoff":up>.2?"ascending":down>.2?"descending":"cruise"
    :falling?"falling":landing?"landing":"grounded";
  return {
    phase,
    torsoLean:flying?.15+.65*launch+(forwardInput?.12:0)-.22*up+.18*down:falling?.25:0,
    headForward:flying?.08+.16*down-.1*up:falling?.12:0,
    armLift:flying?clamp01(.45+launch*.35+up*.2-down*.25):falling?.7:0,
    legLift:flying?up*.12+down*.27:falling?.4:landing?.22:0,
    trailSlope:up*.32-down*.42
  };
}

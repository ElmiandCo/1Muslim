import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLiveHub, isGameStreamCategory } from '../lib/live-hub.ts';

const now = Date.parse('2026-10-31T12:00:00Z');
const stream = (overrides = {}) => ({
  id:'stream-1', host_id:'host-1', title:'Gaming together', category:'Games',
  room_name:'1muslim-live-stream-1', status:'live', visibility:'public',
  viewer_count:8, started_at:'2026-10-31T11:00:00Z', scheduled_end_at:null,
  thumbnail_path:null, aspect_ratio:'9:16',
  live_presence:{session_id:'session-1',state:'READY_VIDEO',media_type:'video',version:3},
  ...overrides,
});
const recording = (overrides = {}) => ({
  id:'record-1', title:'Earlier broadcast', category:'Community',
  video_path:'host-1/record-1.webm', mime_type:'video/webm', duration_seconds:65,
  created_at:'2026-10-30T11:00:00Z', thumbnail_path:null, visibility:'public',
  ...overrides,
});
const schedule = (overrides = {}) => ({
  id:'slot-1', host_id:'host-1', title:'Next broadcast', category:'Games',
  starts_at:'2026-11-01T12:00:00Z', ends_at:'2026-11-01T13:00:00Z',
  status:'scheduled', thumbnail_path:null, host_checked_in_at:null,
  camera_ready:false, mic_ready:false, ...overrides,
});

test('only server-verified READY and public streams appear; games are a subset', () => {
  const result = buildLiveHub([
    stream(),
    stream({id:'private',visibility:'ashab'}),
    stream({id:'stale',live_presence:{session_id:'s',state:'RECONNECTING',media_type:'none',version:4}}),
    stream({id:'starting',live_presence:null}),
    stream({id:'ended',status:'ended'}),
  ],[],[],now);
  assert.equal(result.currentLives.length,1);
  assert.equal(result.gameStreams.length,1);
  assert.equal(result.audioRooms.length,0);
  assert.equal(result.currentLives[0].href,'/streaming/live/stream-1');
});

test('audio-only Live is ready and discoverable as Audio Room', () => {
  const result = buildLiveHub([stream({category:'Community',live_presence:[{session_id:'s',state:'READY_AUDIO',media_type:'audio',version:2}]})],[],[],now);
  assert.equal(result.audioRooms.length,1);
  assert.equal(result.currentLives[0].mediaType,'audio');
});

test('reject mismatched media state, stale scheduled end and invalid versions', () => {
  const result = buildLiveHub([
    stream({id:'mismatch',live_presence:{session_id:'s',state:'READY_VIDEO',media_type:'audio',version:2}}),
    stream({id:'expired',scheduled_end_at:'2026-10-31T11:59:00Z'}),
    stream({id:'badversion',live_presence:{session_id:'s',state:'READY_VIDEO',media_type:'video',version:0}}),
  ],[],[],now);
  assert.equal(result.currentLives.length,0);
});

test('archive contains only real public uploaded recordings and uses replay route', () => {
  const result = buildLiveHub([], [recording(), recording({id:'private',visibility:'private'}),recording({id:'missing',video_path:''}),recording({id:'zero',duration_seconds:0})], [], now);
  assert.equal(result.pastLives.length,1);
  assert.equal(result.pastLives[0].href,'/streaming/replay/record-1');
});

test('scheduled includes future or waiting slots but excludes expired and live slots', () => {
  const result = buildLiveHub([],[],[
    schedule(),schedule({id:'waiting',status:'waiting',starts_at:'2026-10-31T11:00:00Z',ends_at:'2026-10-31T13:00:00Z',mic_ready:true,host_checked_in_at:'2026-10-31T10:00:00Z'}),
    schedule({id:'live',status:'live'}),schedule({id:'expired',ends_at:'2026-10-31T11:00:00Z'}),
  ],now);
  assert.equal(result.scheduledLives.length,2);
  assert.equal(result.scheduledLives[1].hostReady,true);
});

test('Games detection recognizes actual game topics without matching unrelated words', () => {
  for(const name of ['Games','Gaming','Gameplay','E-sports','1Muslim / Games']) assert.equal(isGameStreamCategory(name),true,name);
  for(const name of ['Endgame analysis','New Muslim','Gamechanger','']) assert.equal(isGameStreamCategory(name),false,name);
});

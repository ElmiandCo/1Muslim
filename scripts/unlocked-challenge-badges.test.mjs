import assert from 'node:assert/strict';
import test from 'node:test';
import { getUnlockedChallengeBadges } from '../lib/unlocked-challenge-badges.ts';

const badge = { badge_key: 'previously_earned', badge_name: 'Previously earned' };
function dependencies(status = 'active') {
  const queried = [];
  return {
    queried,
    getUser: async () => ({ id: 'signed-in-user' }),
    getBadges: async (id) => { queried.push(['badges', id]); return [badge]; },
    getSubscriptionStatus: async (id) => { queried.push(['subscription', id]); return status; },
  };
}

test('requires authentication before reading member data', async () => {
  const deps = dependencies();
  deps.getUser = async () => null;
  assert.equal((await getUnlockedChallengeBadges(deps)).status, 401);
  assert.deepEqual(deps.queried, []);
});

test('active and trialing subscriptions cannot turn unverified events into awards', async () => {
  for (const status of ['active', 'trialing']) {
    const deps = dependencies(status);
    const result = await getUnlockedChallengeBadges(deps);
    assert.equal(result.status, 200);
    assert.deepEqual(deps.queried, [['badges', 'signed-in-user'], ['subscription', 'signed-in-user']]);
    for (const challenge of Object.values(result.body.challenges)) {
      assert.deepEqual(challenge, { eligible: false, reason: 'verified_completion_required' });
    }
  }
});

test('earned badges survive lapse and unknown or missing subscription states fail closed', async () => {
  for (const status of ['canceled', 'past_due', 'unpaid', 'incomplete', 'paused', null, 'unknown']) {
    const result = await getUnlockedChallengeBadges(dependencies(status));
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.earnedBadges, [badge]);
    for (const challenge of Object.values(result.body.challenges)) {
      assert.deepEqual(challenge, { eligible: false, reason: 'active_subscription_required' });
    }
  }
});

test('database errors do not report eligibility or an empty badge list', async () => {
  for (const failing of ['getBadges', 'getSubscriptionStatus']) {
    const deps = dependencies();
    deps[failing] = async () => { throw new Error('database unavailable'); };
    assert.deepEqual(await getUnlockedChallengeBadges(deps), {
      status: 503, body: { error: 'Badge status unavailable' },
    });
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { startGoogleOAuth, finishGoogleOAuth, oauthOrigin } from '../lib/auth/oauth-flow.mjs';

test('loopback callbacks keep the visited host while rejecting untrusted host overrides', () => {
  assert.equal(oauthOrigin(new Request('http://localhost:3001/auth/google', {headers: {host: '127.0.0.1:3001'}})), 'http://127.0.0.1:3001');
  assert.equal(oauthOrigin(new Request('http://localhost:3001/auth/google', {headers: {host: 'evil.test'}})), 'http://localhost:3001');
  assert.equal(oauthOrigin(new Request('https://vidya.example/auth/google', {headers: {host: 'evil.test'}})), 'https://vidya.example');
});

test('unconfigured Google login returns a controlled error without creating a session', async () => {
  assert.equal(await startGoogleOAuth(null, 'http://127.0.0.1:3001'), '/login?error=auth_not_configured');
});

test('Google login uses the active origin and server-side PKCE redirect', async () => {
  let options;
  const client = {auth: {signInWithOAuth: async value => {
    options = value;
    return {data: {url: 'https://example.supabase.co/auth/v1/authorize?provider=google'}, error: null};
  }}};
  assert.match(await startGoogleOAuth(client, 'http://127.0.0.1:3001'), /^https:\/\/example.supabase.co/);
  assert.equal(options.provider, 'google');
  assert.equal(options.options.redirectTo, 'http://127.0.0.1:3001/auth/callback');
  assert.equal(options.options.skipBrowserRedirect, true);
  assert.equal(options.options.queryParams.access_type, undefined);
});

test('provider errors do not leak internal error details', async () => {
  const client = {auth: {signInWithOAuth: async () => ({error: new Error('private project details')})}};
  assert.equal(await startGoogleOAuth(client, 'http://localhost:3001'), '/login?error=google_unavailable');
});

test('callback verifies the exchanged session before routing an existing user', async () => {
  const calls = [];
  const client = {auth: {
    exchangeCodeForSession: async code => {calls.push(code); return {error: null};},
    getUser: async () => {calls.push('verified'); return {data: {user: {user_metadata: {username: 'student'}}}, error: null};},
  }};
  assert.equal(await finishGoogleOAuth(client, 'http://localhost:3001/auth/callback?code=one-use&next=https://evil.test'), '/login/success?next=%2Fdashboard');
  assert.deepEqual(calls, ['one-use', 'verified']);
});

test('new Google users go to profile setup, not an assigned privileged role', async () => {
  const client = {auth: {
    exchangeCodeForSession: async () => ({error: null}),
    getUser: async () => ({data: {user: {user_metadata: {}}}, error: null}),
  }};
  assert.equal(await finishGoogleOAuth(client, 'http://localhost/auth/callback?code=new-user'), '/setup-profile');
});

test('missing, cancelled, failed and unverified callbacks cannot open a workspace', async () => {
  assert.equal(await finishGoogleOAuth(null, 'http://localhost/auth/callback'), '/login?error=missing_auth_code');
  assert.equal(await finishGoogleOAuth(null, 'http://localhost/auth/callback?error=access_denied&error_description=private'), '/login?error=google_cancelled');
  assert.equal(await finishGoogleOAuth(null, 'http://localhost/auth/callback?code=value'), '/login?error=auth_not_configured');
  const failed = {auth: {exchangeCodeForSession: async () => ({error: new Error('expired')})}};
  assert.equal(await finishGoogleOAuth(failed, 'http://localhost/auth/callback?code=expired'), '/login?error=auth_exchange_failed');
  const unverified = {auth: {
    exchangeCodeForSession: async () => ({error: null}),
    getUser: async () => ({data: {user: null}, error: new Error('invalid')}),
  }};
  assert.equal(await finishGoogleOAuth(unverified, 'http://localhost/auth/callback?code=value'), '/login?error=auth_exchange_failed');
});

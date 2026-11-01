const assert = require('node:assert/strict');
const test = require('node:test');

function flightWindow(flight, routes) {
  const route = routes.find(item => item.id === flight.route);
  const start = new Date(flight.departure).getTime();
  if (!route || !Number.isFinite(start)) return null;
  const duration = Math.max(3600000, (Number(route.distance) || 1000) / 850 * 3600000);
  return { start, end: start + duration };
}

function hasOverlap(first, second) {
  return first.start < second.end && first.end > second.start;
}

function loadFactor(bookings, capacity) {
  return capacity ? Math.min(100, Math.round((bookings / capacity) * 100)) : 0;
}

test('calculates a route flight window from departure and distance', () => {
  const routes = [{ id: 'r1', distance: 850 }];
  const window = flightWindow({ route: 'r1', departure: '2026-11-02T10:00:00Z' }, routes);
  assert.equal(window.end - window.start, 3600000);
});

test('detects overlapping aircraft or crew windows', () => {
  assert.equal(hasOverlap({ start: 0, end: 100 }, { start: 99, end: 200 }), true);
  assert.equal(hasOverlap({ start: 0, end: 100 }, { start: 100, end: 200 }), false);
});

test('caps route load factor at 100 percent', () => {
  assert.equal(loadFactor(80, 60), 100);
  assert.equal(loadFactor(3, 10), 30);
  assert.equal(loadFactor(3, 0), 0);
});

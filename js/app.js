const STORAGE_KEY = 'airline-ops-data-v2';
const THEME_KEY = 'airline-ops-theme';

const defaultData = {
  flights: [],
  aircraft: [],
  crew: [],
  routes: [],
  bookings: [],
  activity: []
};

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData; }
  catch { return { ...defaultData }; }
}
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-theme', isDark);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    toggle.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';
  }
}

function seedData() {
  if (state.routes.length || state.aircraft.length || state.flights.length) return;
  const r1 = { id: uid(), code: 'SK101', origin: 'New York', dest: 'London', distance: 5570 };
  const r2 = { id: uid(), code: 'SK202', origin: 'London', dest: 'Dubai', distance: 5470 };
  const r3 = { id: uid(), code: 'SK303', origin: 'Dubai', dest: 'Singapore', distance: 6750 };
  state.routes.push(r1, r2, r3);
  const a1 = { id: uid(), tail: 'N123SK', model: 'Boeing 777', capacity: 300, status: 'Active', hours: 12400 };
  const a2 = { id: uid(), tail: 'N456SK', model: 'Airbus A350', capacity: 280, status: 'Active', hours: 8900 };
  const a3 = { id: uid(), tail: 'N789SK', model: 'Boeing 737', capacity: 180, status: 'Maintenance', hours: 21000 };
  state.aircraft.push(a1, a2, a3);
  const c1 = { id: uid(), name: 'John Carter', role: 'Pilot', status: 'On Duty', hours: 8500 };
  const c2 = { id: uid(), name: 'Sarah Lee', role: 'Co-Pilot', status: 'Available', hours: 4200 };
  const c3 = { id: uid(), name: 'Mike Brown', role: 'Flight Attendant', status: 'On Duty', hours: 3100 };
  const c4 = { id: uid(), name: 'Anna White', role: 'Engineer', status: 'Available', hours: 6700 };
  state.crew.push(c1, c2, c3, c4);
  const now = Date.now();
  const f1 = { id: uid(), number: 'SK101', route: r1.id, aircraft: a1.id, departure: new Date(now + 3600000).toISOString(), status: 'Scheduled' };
  const f2 = { id: uid(), number: 'SK202', route: r2.id, aircraft: a2.id, departure: new Date(now + 7200000).toISOString(), status: 'Boarding' };
  const f3 = { id: uid(), number: 'SK303', route: r3.id, aircraft: a3.id, departure: new Date(now - 1800000).toISOString(), status: 'Delayed' };
  state.flights.push(f1, f2, f3);
  state.bookings.push(
    { id: uid(), passenger: 'Alice Johnson', flight: f1.id, seat: '12A', cls: 'Economy', price: 450 },
    { id: uid(), passenger: 'Bob Smith', flight: f1.id, seat: '1A', cls: 'Business', price: 1200 },
    { id: uid(), passenger: 'Carol Davis', flight: f2.id, seat: '8C', cls: 'Economy', price: 600 },
    { id: uid(), passenger: 'Dan Evans', flight: f2.id, seat: '2F', cls: 'First', price: 2500 }
  );
  logActivity('Seeded demo data');
  saveData();
}

let state = loadData();
Object.keys(defaultData).forEach(k => { if (!state[k]) state[k] = []; });
seedData();

function uid() { return Math.random().toString(36).slice(2, 10); }
function money(n) { return '$' + Number(n).toLocaleString(); }
function logActivity(text) { state.activity.unshift({ text, time: new Date().toLocaleTimeString() }); state.activity = state.activity.slice(0, 20); saveData(); }

let trafficUpdateTimer = 0;

function renderView(name) {
  clearInterval(trafficUpdateTimer);
  trafficUpdateTimer = 0;
  const tpl = document.getElementById('tpl-' + name);
  document.getElementById('app').innerHTML = '';
  document.getElementById('app').appendChild(tpl.content.cloneNode(true));
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  renderNotifications();
  if (name === 'dashboard') renderDashboard();
  if (name === 'flights') renderFlights();
  if (name === 'aircraft') renderAircraft();
  if (name === 'crew') renderCrew();
  if (name === 'routes') renderRoutes();
  if (name === 'bookings') renderBookings();
}

function getNotifications() {
  const notifications = [];
  state.flights.filter(flight => ['Delayed', 'Cancelled'].includes(flight.status)).forEach(flight => {
    const route = state.routes.find(item => item.id === flight.route);
    notifications.push({ severity: 'high', title: `Flight ${flight.number} is ${flight.status.toLowerCase()}`, detail: route ? `${route.origin} to ${route.dest}` : 'Route unavailable', flightId: flight.id });
  });
  state.aircraft.filter(aircraft => ['Maintenance', 'Grounded'].includes(aircraft.status)).forEach(aircraft => {
    notifications.push({ severity: aircraft.status === 'Grounded' ? 'high' : 'watch', title: `${aircraft.tail} requires attention`, detail: `${aircraft.model} is ${aircraft.status.toLowerCase()}` });
  });
  if (!state.crew.some(member => member.status === 'On Duty')) {
    notifications.push({ severity: 'high', title: 'No crew currently on duty', detail: 'Review the crew roster before dispatching flights' });
  }
  return notifications;
}

function renderNotifications() {
  const count = document.getElementById('notification-count');
  const list = document.getElementById('notification-list');
  if (!count || !list) return;
  const notifications = getNotifications();
  count.textContent = notifications.length;
  count.hidden = notifications.length === 0;
  list.innerHTML = notifications.length ? notifications.map(notification => `<article class="notification-item ${notification.severity}"><div><strong>${notification.title}</strong><span>${notification.detail}</span></div>${notification.flightId ? `<button class="notification-link" data-notification-flight="${notification.flightId}">View flight</button>` : ''}</article>`).join('') : '<div class="notification-empty">All operations are clear.</div>';
  list.querySelectorAll('[data-notification-flight]').forEach(button => button.onclick = () => {
    document.getElementById('notification-dialog').close();
    showFlightDetails(button.dataset.notificationFlight);
  });
}

function renderDashboard() {
  document.getElementById('kpi-flights').textContent = state.flights.length;
  document.getElementById('kpi-aircraft').textContent = state.aircraft.length;
  document.getElementById('kpi-crew').textContent = state.crew.filter(c => c.status === 'On Duty').length;
  document.getElementById('kpi-bookings').textContent = state.bookings.length;
  const rev = state.bookings.reduce((s, b) => s + Number(b.price || 0), 0);
  document.getElementById('kpi-revenue').textContent = money(rev);
  const delayed = state.flights.filter(f => f.status === 'Delayed' || f.status === 'Cancelled').length;
  const ontime = state.flights.length ? Math.round((1 - delayed / state.flights.length) * 100) : 100;
  document.getElementById('kpi-ontime').textContent = ontime + '%';
  const ul = document.getElementById('activity');
  ul.innerHTML = state.activity.map(a => `<li>${a.time} — ${a.text}</li>`).join('') || '<li>No activity yet</li>';
  renderRevenueAnalytics();
  renderTrafficMap();
  renderWeather();
}

function renderRevenueAnalytics() {
  const analytics = document.getElementById('revenue-analytics');
  if (!analytics) return;
  const totalRevenue = state.bookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0);
  const averageFare = state.bookings.length ? totalRevenue / state.bookings.length : 0;
  const premiumBookings = state.bookings.filter(booking => ['Business', 'First'].includes(booking.cls));
  const premiumShare = state.bookings.length ? Math.round((premiumBookings.length / state.bookings.length) * 100) : 0;
  const classes = ['Economy', 'Business', 'First'].map(name => {
    const bookings = state.bookings.filter(booking => booking.cls === name);
    return { name, revenue: bookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0), count: bookings.length };
  });
  const highestClassRevenue = Math.max(...classes.map(item => item.revenue), 1);
  analytics.innerHTML = `
    <div class="revenue-metrics">
      <div><span>Total revenue</span><strong>${money(totalRevenue)}</strong></div>
      <div><span>Average fare</span><strong>${money(Math.round(averageFare))}</strong></div>
      <div><span>Premium share</span><strong>${premiumShare}%</strong></div>
    </div>
    <div class="class-revenue">
      <div class="subsection-heading"><strong>Revenue by cabin</strong><span>${state.bookings.length} bookings</span></div>
      ${classes.map(item => `<div class="revenue-row"><div class="revenue-row-label"><span>${item.name}</span><small>${item.count} booking${item.count === 1 ? '' : 's'} · ${money(item.revenue)}</small></div><i class="revenue-track"><b style="width: ${Math.round((item.revenue / highestClassRevenue) * 100)}%"></b></i></div>`).join('')}
    </div>`;
}

const cityCoordinates = {
  'new york': [40.7128, -74.006],
  london: [51.5072, -0.1276],
  dubai: [25.2048, 55.2708],
  singapore: [1.3521, 103.8198],
  tokyo: [35.6762, 139.6503],
  sydney: [-33.8688, 151.2093],
  'los angeles': [34.0522, -118.2437],
  paris: [48.8566, 2.3522],
  frankfurt: [50.1109, 8.6821],
  'hong kong': [22.3193, 114.1694]
};

function flightProgress(flight, route) {
  if (!route || flight.status === 'Cancelled') return 0;
  const departure = new Date(flight.departure).getTime();
  if (!Number.isFinite(departure) || Date.now() <= departure) return 0;
  const duration = Math.max(3600000, (Number(route.distance) || 1000) / 850 * 3600000);
  return Math.min((Date.now() - departure) / duration, 0.99);
}

function flightProgressLabel(flight, route) {
  const progress = flightProgress(flight, route);
  if (flight.status === 'Cancelled') return 'Cancelled';
  if (progress === 0) return 'On ground';
  if (progress >= 0.99) return 'Arriving';
  return `${Math.round(progress * 100)}% en route`;
}

function flightEta(flight, route) {
  if (!route || flight.status === 'Cancelled') return 'Not available';
  const departure = new Date(flight.departure).getTime();
  if (!Number.isFinite(departure)) return 'Not available';
  if (Date.now() <= departure) return `Departs ${new Date(departure).toLocaleTimeString()}`;
  const duration = Math.max(3600000, (Number(route.distance) || 1000) / 850 * 3600000);
  return new Date(departure + duration).toLocaleTimeString();
}

function renderTrafficMap() {
  const mapElement = document.getElementById('traffic-map');
  const summary = document.getElementById('traffic-summary');
  if (!mapElement || !summary) return;
  const mappedFlights = state.flights.filter(f => {
    const route = state.routes.find(r => r.id === f.route);
    return route && cityCoordinates[route.origin.toLowerCase()] && cityCoordinates[route.dest.toLowerCase()];
  });
  summary.textContent = `${mappedFlights.length} route${mappedFlights.length === 1 ? '' : 's'} tracked`;
  if (!window.L) {
    mapElement.textContent = 'Map service unavailable. Check your internet connection.';
    return;
  }
  const map = L.map(mapElement, { zoomControl: false, worldCopyJump: true }).setView([25, 30], 2);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 6
  }).addTo(map);
  const bounds = [];
  const airports = new Map();
  const colors = { Scheduled: '#94a3b8', Boarding: '#f59e0b', Departed: '#22c55e', Delayed: '#ef4444', Cancelled: '#64748b' };

  const movingPlanes = [];
  mappedFlights.forEach(flight => {
    const route = state.routes.find(r => r.id === flight.route);
    const origin = cityCoordinates[route.origin.toLowerCase()];
    const destination = cityCoordinates[route.dest.toLowerCase()];
    const color = colors[flight.status] || '#38bdf8';
    const routeLine = L.polyline([origin, destination], { color, weight: 3, opacity: 0.75, dashArray: flight.status === 'Scheduled' ? '6 8' : null }).addTo(map);
    routeLine.bindTooltip(`${flight.number}: ${route.origin} to ${route.dest}<br>${flight.status}`);
    routeLine.on('click', () => showFlightDetails(flight.id));
    bounds.push(origin, destination);
    [[route.origin, origin], [route.dest, destination]].forEach(([city, coordinates]) => {
      if (airports.has(city)) return;
      airports.set(city, true);
      L.circleMarker(coordinates, { radius: 6, color: '#e2e8f0', weight: 2, fillColor: '#0ea5e9', fillOpacity: 1 }).addTo(map).bindTooltip(city);
    });
    const progress = flightProgress(flight, route);
    const planePosition = [origin[0] + (destination[0] - origin[0]) * progress, origin[1] + (destination[1] - origin[1]) * progress];
    const plane = L.marker(planePosition, { icon: L.divIcon({ className: `plane-marker ${flight.status.toLowerCase()}`, html: '<span>✈</span>', iconSize: [28, 28], iconAnchor: [14, 14] }) }).addTo(map).bindTooltip(`${flight.number} · ${flight.status}`);
    plane.on('click', () => showFlightDetails(flight.id));
    movingPlanes.push({ plane, flight, route, origin, destination });
  });
  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });
  if (movingPlanes.length) {
    const updatePlanes = () => {
      movingPlanes.forEach(item => {
        const progress = flightProgress(item.flight, item.route);
        item.plane.setLatLng([
          item.origin[0] + (item.destination[0] - item.origin[0]) * progress,
          item.origin[1] + (item.destination[1] - item.origin[1]) * progress
        ]);
      });
    };
    updatePlanes();
    trafficUpdateTimer = setInterval(updatePlanes, 15000);
  }
}

function weatherLabel(code) {
  if (code === 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Mixed conditions';
}

async function renderWeather() {
  const weatherGrid = document.getElementById('weather-grid');
  const weatherAlerts = document.getElementById('weather-alerts');
  if (!weatherGrid || !weatherAlerts) return;
  const cities = [...new Set(state.flights.flatMap(flight => {
    const route = state.routes.find(r => r.id === flight.route);
    return route ? [route.origin, route.dest] : [];
  }))].filter(city => cityCoordinates[city.toLowerCase()]);
  if (!cities.length) {
    weatherAlerts.innerHTML = '';
    weatherGrid.innerHTML = '<div class="weather-loading">No mapped airports in the current flight network.</div>';
    return;
  }
  const results = await Promise.all(cities.map(async city => {
    const [latitude, longitude] = cityCoordinates[city.toLowerCase()];
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`);
      if (!response.ok) throw new Error('Weather request failed');
      const data = await response.json();
      return { city, current: data.current };
    } catch {
      return { city, error: true };
    }
  }));
  if (!weatherGrid.isConnected) return;
  const riskResults = results.filter(result => result.current && (result.current.wind_speed_10m >= 25 || result.current.weather_code >= 45));
  weatherAlerts.innerHTML = riskResults.map(result => `<div class="weather-alert"><strong>Weather alert</strong><span>${result.city}: ${weatherLabel(result.current.weather_code)} with ${Math.round(result.current.wind_speed_10m)} mph winds may affect operations.</span></div>`).join('');
  weatherGrid.innerHTML = results.map(result => result.error
    ? `<article class="weather-card"><strong>${result.city}</strong><span>Weather unavailable</span></article>`
    : `<article class="weather-card ${result.current.wind_speed_10m >= 25 || result.current.weather_code >= 45 ? 'weather-risk' : ''}"><div class="weather-card-top"><strong>${result.city}</strong><span>${weatherLabel(result.current.weather_code)}</span></div><b>${Math.round(result.current.temperature_2m)}°F</b><span>Wind ${Math.round(result.current.wind_speed_10m)} mph</span></article>`
  ).join('');
}

function showFlightDetails(flightId) {
  const flight = state.flights.find(item => item.id === flightId);
  if (!flight) return;
  const route = state.routes.find(item => item.id === flight.route);
  const aircraft = state.aircraft.find(item => item.id === flight.aircraft);
  const bookingCount = state.bookings.filter(item => item.flight === flight.id).length;
  document.getElementById('detail-flight-number').textContent = flight.number;
  document.getElementById('flight-detail-content').innerHTML = `
    <div class="detail-status"><span class="status ${flight.status}">${flight.status}</span><span>${bookingCount} booking${bookingCount === 1 ? '' : 's'}</span></div>
    <div class="detail-route"><strong>${route ? route.origin : 'Unknown'}</strong><span>→</span><strong>${route ? route.dest : 'Unknown'}</strong></div>
    <dl class="detail-grid">
      <div><dt>Departure</dt><dd>${new Date(flight.departure).toLocaleString()}</dd></div>
      <div><dt>Progress</dt><dd>${flightProgressLabel(flight, route)}</dd></div>
      <div><dt>Aircraft</dt><dd>${aircraft ? `${aircraft.tail} · ${aircraft.model}` : 'Unassigned'}</dd></div>
      <div><dt>Capacity</dt><dd>${aircraft ? `${aircraft.capacity} seats` : 'Not available'}</dd></div>
      <div><dt>Distance</dt><dd>${route ? `${Number(route.distance).toLocaleString()} km` : 'Not available'}</dd></div>
      <div><dt>Estimated arrival</dt><dd>${flightEta(flight, route)}</dd></div>
    </dl>`;
  document.getElementById('flight-detail-dialog').showModal();
}

function csvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function downloadExport(format) {
  let filename;
  let content;
  let type;
  if (format === 'json') {
    filename = 'skyline-ops-backup.json';
    content = JSON.stringify({ exportedAt: new Date().toISOString(), data: state }, null, 2);
    type = 'application/json';
  } else if (format === 'flights') {
    filename = 'skyline-ops-flights.csv';
    content = [['Flight', 'Route', 'Aircraft', 'Departure', 'Status'], ...state.flights.map(flight => {
      const route = state.routes.find(item => item.id === flight.route);
      const aircraft = state.aircraft.find(item => item.id === flight.aircraft);
      return [flight.number, route ? `${route.origin} to ${route.dest}` : '', aircraft ? aircraft.tail : '', flight.departure, flight.status];
    })].map(row => row.map(csvValue).join(',')).join('\r\n');
    type = 'text/csv';
  } else {
    filename = 'skyline-ops-bookings.csv';
    content = [['Passenger', 'Flight', 'Seat', 'Class', 'Price'], ...state.bookings.map(booking => {
      const flight = state.flights.find(item => item.id === booking.flight);
      return [booking.passenger, flight ? flight.number : '', booking.seat, booking.cls, booking.price];
    })].map(row => row.map(csvValue).join(',')).join('\r\n');
    type = 'text/csv';
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  document.getElementById('export-dialog').close();
}

function renderFlights() {
  const body = document.getElementById('flights-body');
  const search = document.getElementById('flight-search');
  const statusFilter = document.getElementById('flight-status-filter');
  const renderRows = () => {
    const query = search.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const visibleFlights = state.flights.filter(f => {
      const route = state.routes.find(r => r.id === f.route);
      const aircraft = state.aircraft.find(a => a.id === f.aircraft);
      const searchable = [f.number, route?.origin, route?.dest, aircraft?.tail, aircraft?.model].filter(Boolean).join(' ').toLowerCase();
      return (!query || searchable.includes(query)) && (selectedStatus === 'all' || f.status === selectedStatus);
    });
    body.innerHTML = visibleFlights.map(f => {
    const route = state.routes.find(r => r.id === f.route);
    const ac = state.aircraft.find(a => a.id === f.aircraft);
    return `<tr>
      <td><button class="flight-link" data-flight-detail="${f.id}">${f.number}</button></td>
      <td>${route ? route.origin + ' → ' + route.dest : '-'}</td>
      <td>${ac ? ac.tail : '-'}</td>
      <td>${new Date(f.departure).toLocaleString()}</td>
      <td><span class="status ${f.status}">${f.status}</span></td>
      <td class="actions"><button data-del-flight="${f.id}">Delete</button></td>
    </tr>`;
    }).join('') || '<tr><td class="empty-table" colspan="6">No flights match these filters.</td></tr>';
    body.querySelectorAll('[data-flight-detail]').forEach(button => button.onclick = () => showFlightDetails(button.dataset.flightDetail));
    body.querySelectorAll('[data-del-flight]').forEach(b => b.onclick = () => { state.flights = state.flights.filter(x => x.id !== b.dataset.delFlight); saveData(); renderRows(); });
  };
  search.oninput = renderRows;
  statusFilter.onchange = renderRows;
  renderRows();
  const routeSel = document.getElementById('flight-route');
  routeSel.innerHTML = state.routes.map(r => `<option value="${r.id}">${r.code} ${r.origin}→${r.dest}</option>`).join('');
  const acSel = document.getElementById('flight-aircraft');
  acSel.innerHTML = state.aircraft.map(a => `<option value="${a.id}">${a.tail} ${a.model}</option>`).join('');

  document.getElementById('add-flight').onclick = () => document.getElementById('flight-dialog').showModal();
  const form = document.getElementById('flight-form');
  form.onsubmit = (e) => {
    const v = Object.fromEntries(new FormData(form));
    if (form.returnValue === 'cancel') return;
    state.flights.push({ id: uid(), number: v.number, route: v.route, aircraft: v.aircraft, departure: v.departure, status: v.status });
    logActivity('Flight ' + v.number + ' scheduled');
    saveData();
    renderFlights();
  };
}

function aircraftMetrics(aircraft) {
  const scheduledFlights = state.flights.filter(flight => flight.status !== 'Cancelled');
  const assignedFlights = scheduledFlights.filter(flight => flight.aircraft === aircraft.id).length;
  const utilization = scheduledFlights.length ? Math.round((assignedFlights / scheduledFlights.length) * 100) : 0;
  const serviceDue = aircraft.status !== 'Active' || Number(aircraft.hours) >= 20000;
  return { assignedFlights, utilization, serviceDue };
}

function renderAircraft() {
  const body = document.getElementById('aircraft-body');
  body.innerHTML = state.aircraft.map(a => {
    const metrics = aircraftMetrics(a);
    return `<tr>
    <td>${a.tail}</td><td>${a.model}</td><td>${a.capacity}</td>
    <td><span class="status ${a.status}">${a.status}</span></td><td>${Number(a.hours).toLocaleString()}</td>
    <td><div class="utilization"><div class="utilization-label"><span>${metrics.utilization}%</span><small>${metrics.assignedFlights} flight${metrics.assignedFlights === 1 ? '' : 's'}</small></div><i class="utilization-track"><b style="width: ${metrics.utilization}%"></b></i>${metrics.serviceDue ? '<em class="maintenance-note">Service attention</em>' : ''}</div></td>
    <td class="actions"><button data-del="${a.id}">Delete</button></td>
  </tr>`;
  }).join('');
  body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { state.aircraft = state.aircraft.filter(x => x.id !== b.dataset.del); saveData(); renderAircraft(); });
  document.getElementById('add-aircraft').onclick = () => document.getElementById('aircraft-dialog').showModal();
  const form = document.getElementById('aircraft-form');
  form.onsubmit = (e) => {
    const v = Object.fromEntries(new FormData(form));
    if (form.returnValue === 'cancel') return;
    state.aircraft.push({ id: uid(), tail: v.tail, model: v.model, capacity: Number(v.capacity), status: v.status, hours: Number(v.hours) });
    logActivity('Aircraft ' + v.tail + ' added');
    saveData();
    renderAircraft();
  };
}

function renderCrew() {
  const body = document.getElementById('crew-body');
  body.innerHTML = state.crew.map(c => `<tr>
    <td>${c.name}</td><td>${c.role}</td>
    <td><span class="status ${c.status.replace(' ', '')}">${c.status}</span></td>
    <td>${Number(c.hours).toLocaleString()}</td>
    <td>${c.flight ? (state.flights.find(flight => flight.id === c.flight)?.number || 'Unknown flight') : '<span class="unassigned">Unassigned</span>'}</td>
    <td class="actions"><button data-assign="${c.id}">Assign</button><button data-del="${c.id}">Delete</button></td>
  </tr>`).join('');
  body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { state.crew = state.crew.filter(x => x.id !== b.dataset.del); saveData(); renderCrew(); });
  body.querySelectorAll('[data-assign]').forEach(button => button.onclick = () => openCrewAssignment(button.dataset.assign));
  document.getElementById('add-crew').onclick = () => document.getElementById('crew-dialog').showModal();
  const form = document.getElementById('crew-form');
  form.onsubmit = (e) => {
    const v = Object.fromEntries(new FormData(form));
    if (form.returnValue === 'cancel') return;
    state.crew.push({ id: uid(), name: v.name, role: v.role, status: v.status, hours: Number(v.hours) });
    logActivity('Crew member ' + v.name + ' added');
    saveData();
    renderCrew();
  };
  const assignmentForm = document.getElementById('crew-assignment-form');
  const assignmentNote = document.getElementById('assignment-note');
  const updateAssignmentNote = () => {
    const values = Object.fromEntries(new FormData(assignmentForm));
    const conflict = findCrewConflict(values.crew, values.flight);
    assignmentNote.textContent = conflict ? `Conflict: ${conflict.number} overlaps this flight.` : 'No schedule conflicts detected.';
    assignmentNote.classList.toggle('assignment-conflict', Boolean(conflict));
  };
  assignmentForm.onsubmit = event => {
    if (assignmentForm.returnValue === 'cancel') return;
    const values = Object.fromEntries(new FormData(assignmentForm));
    const crew = state.crew.find(member => member.id === values.crew);
    if (!crew) return;
    const conflict = findCrewConflict(values.crew, values.flight);
    if (conflict) {
      event.preventDefault();
      assignmentNote.textContent = `Cannot assign: ${conflict.number} overlaps this flight.`;
      assignmentNote.classList.add('assignment-conflict');
      return;
    }
    crew.flight = values.flight || null;
    logActivity(`${crew.name} assigned to ${values.flight ? state.flights.find(flight => flight.id === values.flight)?.number : 'roster'}`);
    saveData();
    renderCrew();
  };
  assignmentForm.querySelector('#assignment-crew').onchange = updateAssignmentNote;
  assignmentForm.querySelector('#assignment-flight').onchange = updateAssignmentNote;
}

function flightWindow(flight) {
  const route = state.routes.find(item => item.id === flight.route);
  const start = new Date(flight.departure).getTime();
  if (!route || !Number.isFinite(start)) return null;
  const duration = Math.max(3600000, (Number(route.distance) || 1000) / 850 * 3600000);
  return { start, end: start + duration };
}

function findCrewConflict(crewId, flightId) {
  if (!flightId) return null;
  const target = state.flights.find(flight => flight.id === flightId);
  const targetWindow = target && flightWindow(target);
  if (!targetWindow) return null;
  const crew = state.crew.find(member => member.id === crewId);
  const assignedFlight = crew && state.flights.find(flight => flight.id === crew.flight && flight.id !== flightId);
  const assignedWindow = assignedFlight && flightWindow(assignedFlight);
  if (!assignedFlight || !assignedWindow) return null;
  return targetWindow.start < assignedWindow.end && targetWindow.end > assignedWindow.start ? assignedFlight : null;
}

function openCrewAssignment(crewId) {
  const crewSelect = document.getElementById('assignment-crew');
  const flightSelect = document.getElementById('assignment-flight');
  crewSelect.innerHTML = state.crew.map(crew => `<option value="${crew.id}" ${crew.id === crewId ? 'selected' : ''}>${crew.name} · ${crew.role}</option>`).join('');
  flightSelect.innerHTML = '<option value="">Unassigned</option>' + state.flights.filter(flight => flight.status !== 'Cancelled').map(flight => `<option value="${flight.id}">${flight.number} · ${flight.status}</option>`).join('');
  const crew = state.crew.find(item => item.id === crewId);
  flightSelect.value = crew?.flight || '';
  const assignmentNote = document.getElementById('assignment-note');
  const conflict = findCrewConflict(crewId, flightSelect.value);
  assignmentNote.textContent = conflict ? `Conflict: ${conflict.number} overlaps this flight.` : 'No schedule conflicts detected.';
  assignmentNote.classList.toggle('assignment-conflict', Boolean(conflict));
  document.getElementById('crew-assignment-dialog').showModal();
}

function renderRoutes() {
  const body = document.getElementById('routes-body');
  body.innerHTML = state.routes.map(r => {
    const routeFlights = state.flights.filter(flight => flight.route === r.id);
    const flightIds = new Set(routeFlights.map(flight => flight.id));
    const routeBookings = state.bookings.filter(booking => flightIds.has(booking.flight));
    const routeRevenue = routeBookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0);
    return `<tr>
    <td><strong class="route-code">${r.code}</strong></td><td>${r.origin}</td><td>${r.dest}</td><td>${Number(r.distance).toLocaleString()}</td>
    <td><span class="route-metric">${routeFlights.length}</span></td><td><span class="route-metric">${routeBookings.length}</span></td><td><span class="route-revenue">${money(routeRevenue)}</span></td>
    <td class="actions"><button data-del="${r.id}">Delete</button></td>
  </tr>`;
  }).join('');
  body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { state.routes = state.routes.filter(x => x.id !== b.dataset.del); saveData(); renderRoutes(); });
  document.getElementById('add-route').onclick = () => document.getElementById('route-dialog').showModal();
  const form = document.getElementById('route-form');
  form.onsubmit = (e) => {
    const v = Object.fromEntries(new FormData(form));
    if (form.returnValue === 'cancel') return;
    state.routes.push({ id: uid(), code: v.code, origin: v.origin, dest: v.dest, distance: Number(v.distance) });
    logActivity('Route ' + v.code + ' added');
    saveData();
    renderRoutes();
  };
}

function renderBookings() {
  const body = document.getElementById('bookings-body');
  const capacitySummary = document.getElementById('booking-capacity-summary');
  body.innerHTML = state.bookings.map(b => {
    const f = state.flights.find(x => x.id === b.flight);
    return `<tr>
      <td>${b.passenger}</td><td>${f ? f.number : '-'}</td><td>${b.seat}</td><td>${b.cls}</td><td>${money(b.price)}</td>
      <td class="actions"><button data-del="${b.id}">Delete</button></td>
    </tr>`;
  }).join('');
  capacitySummary.innerHTML = state.flights.filter(flight => flight.status !== 'Cancelled').map(flight => {
    const aircraft = state.aircraft.find(item => item.id === flight.aircraft);
    const booked = state.bookings.filter(booking => booking.flight === flight.id).length;
    const capacity = aircraft?.capacity || 0;
    const loadFactor = capacity ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;
    return `<div class="booking-capacity-card"><div><strong>${flight.number}</strong><span>${booked} / ${capacity || '—'} seats</span></div><i><b style="width: ${loadFactor}%"></b></i><small>${loadFactor}% load</small></div>`;
  }).join('') || '<div class="booking-capacity-empty">No active flights available.</div>';
  body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { state.bookings = state.bookings.filter(x => x.id !== b.dataset.del); saveData(); renderBookings(); });
  const flightSel = document.getElementById('booking-flight');
  flightSel.innerHTML = state.flights.filter(f => f.status !== 'Cancelled').map(f => `<option value="${f.id}">${f.number}</option>`).join('') || '<option value="">No available flights</option>';
  const capacityNote = document.getElementById('booking-capacity-note');
  const updateCapacityNote = () => {
    const flight = state.flights.find(item => item.id === flightSel.value);
    const aircraft = flight && state.aircraft.find(item => item.id === flight.aircraft);
    const booked = state.bookings.filter(booking => booking.flight === flight?.id).length;
    const remaining = aircraft ? Math.max(0, aircraft.capacity - booked) : 0;
    capacityNote.textContent = aircraft ? `${remaining} seat${remaining === 1 ? '' : 's'} remaining · ${booked} of ${aircraft.capacity} booked` : 'Aircraft capacity unavailable';
    capacityNote.classList.toggle('capacity-full', Boolean(aircraft && remaining === 0));
  };
  flightSel.onchange = updateCapacityNote;
  updateCapacityNote();
  document.getElementById('add-booking').onclick = () => document.getElementById('booking-dialog').showModal();
  const form = document.getElementById('booking-form');
  form.onsubmit = (e) => {
    const v = Object.fromEntries(new FormData(form));
    if (form.returnValue === 'cancel') return;
    const flight = state.flights.find(item => item.id === v.flight);
    const aircraft = flight && state.aircraft.find(item => item.id === flight.aircraft);
    const booked = state.bookings.filter(booking => booking.flight === v.flight).length;
    if (aircraft && booked >= aircraft.capacity) {
      e.preventDefault();
      capacityNote.textContent = 'This flight is full. Choose another flight.';
      capacityNote.classList.add('capacity-full');
      return;
    }
    state.bookings.push({ id: uid(), passenger: v.passenger, flight: v.flight, seat: v.seat, cls: v.cls, price: Number(v.price) });
    logActivity('Booking for ' + v.passenger);
    saveData();
    renderBookings();
  };
}

document.querySelectorAll('.nav button').forEach(b => b.addEventListener('click', () => renderView(b.dataset.view)));
applyTheme(localStorage.getItem(THEME_KEY) || 'light');
document.getElementById('theme-toggle').addEventListener('click', () => {
  const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
});
document.getElementById('notification-toggle').addEventListener('click', () => {
  renderNotifications();
  document.getElementById('notification-dialog').showModal();
});
document.getElementById('export-toggle').addEventListener('click', () => document.getElementById('export-dialog').showModal());
document.querySelectorAll('[data-export]').forEach(button => button.addEventListener('click', () => downloadExport(button.dataset.export)));
setInterval(() => { document.getElementById('clock').textContent = new Date().toLocaleString(); }, 1000);
renderView('dashboard');

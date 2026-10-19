// Domaine Prestige - VIP Winery Members Club
// Frontend - Node.js/Express/EJS
// Author: Michelle Gilmore

const express = require('express');
const axios = require('axios');
const app = express();

// Flask API base URL - set API_BASE if the API runs somewhere else
const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── PAGES ───────────────────────────────────────────────────

// Home / Members page
app.get('/', async (req, res) => {
    try {
        const membersRes = await axios.get(`${API_BASE}/members`);
        res.render('index', { members: membersRes.data, activePage: 'members' });
    } catch (err) {
        res.render('index', { members: [], activePage: 'members', error: 'Could not load members.' });
    }
});

// Events page
app.get('/events', async (req, res) => {
    try {
        const eventsRes = await axios.get(`${API_BASE}/events`);
        res.render('events', { events: eventsRes.data, activePage: 'events' });
    } catch (err) {
        res.render('events', { events: [], activePage: 'events', error: 'Could not load events.' });
    }
});

// Registrations page
app.get('/registrations', async (req, res) => {
    try {
        const [regRes, membersRes, eventsRes] = await Promise.all([
            axios.get(`${API_BASE}/registrations`),
            axios.get(`${API_BASE}/members`),
            axios.get(`${API_BASE}/events`)
        ]);
        res.render('registrations', {
            registrations: regRes.data,
            members: membersRes.data,
            events: eventsRes.data,
            activePage: 'registrations'
        });
    } catch (err) {
        res.render('registrations', {
            registrations: [], members: [], events: [],
            activePage: 'registrations', error: 'Could not load data.'
        });
    }
});

// Event roster - see who is registered for a specific event
app.get('/events/:id/roster', async (req, res) => {
    try {
        const [rosterRes, eventRes] = await Promise.all([
            axios.get(`${API_BASE}/registrations/event/${req.params.id}`),
            axios.get(`${API_BASE}/events/${req.params.id}`)
        ]);
        res.render('roster', {
            roster: rosterRes.data,
            event: eventRes.data,
            activePage: 'events'
        });
    } catch (err) {
        res.redirect('/events');
    }
});

// ─── API PROXY ROUTES (called by frontend JS via fetch) ──────

// Members
app.post('/api/members', async (req, res) => {
    try {
        const r = await axios.post(`${API_BASE}/members`, req.body);
        res.send(r.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: 'Server error' });
    }
});

app.put('/api/members/:id', async (req, res) => {
    try {
        const r = await axios.put(`${API_BASE}/members/${req.params.id}`, req.body);
        res.send(r.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: 'Server error' });
    }
});

app.delete('/api/members/:id', async (req, res) => {
    try {
        const r = await axios.delete(`${API_BASE}/members/${req.params.id}`);
        res.send(r.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: 'Server error' });
    }
});

// Events
app.post('/api/events', async (req, res) => {
    try {
        const r = await axios.post(`${API_BASE}/events`, req.body);
        res.send(r.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: 'Server error' });
    }
});

app.put('/api/events/:id', async (req, res) => {
    try {
        const r = await axios.put(`${API_BASE}/events/${req.params.id}`, req.body);
        res.send(r.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: 'Server error' });
    }
});

app.delete('/api/events/:id', async (req, res) => {
    try {
        const r = await axios.delete(`${API_BASE}/events/${req.params.id}`);
        res.send(r.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: 'Server error' });
    }
});

// Registrations
app.post('/api/registrations', async (req, res) => {
    try {
        const r = await axios.post(`${API_BASE}/registrations`, req.body);
        res.send(r.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: 'Server error' });
    }
});

app.delete('/api/registrations/:id', async (req, res) => {
    try {
        const r = await axios.delete(`${API_BASE}/registrations/${req.params.id}`);
        res.send(r.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: 'Server error' });
    }
});

app.listen(PORT, () => console.log(`Domaine Prestige running on http://localhost:${PORT}`));

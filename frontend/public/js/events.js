// Events page JS - Domaine Prestige

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); })
);

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ── ADD EVENT ──────────────────────────────────
async function submitAddEvent(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name:     form.name.value.trim(),
        capacity: parseInt(form.capacity.value),
        level:    form.level.value,
        date:     form.date.value,
        location: form.location.value.trim()
    };

    try {
        const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            showToast(err.error || 'Failed to add event', 'error');
            return;
        }
        showToast('Event added successfully');
        closeModal('addEventModal');
        setTimeout(() => location.reload(), 1000);
    } catch (err) {
        showToast('Server error', 'error');
    }
}

// ── EDIT EVENT ─────────────────────────────────
// Values are read from the button's data-* attributes (safe from code injection)
function openEditEvent(btn) {
    const { id, name, capacity, level, date, location } = btn.dataset;
    document.getElementById('editEventId').value = id;
    document.getElementById('editEventName').value = name;
    document.getElementById('editEventCapacity').value = capacity;
    document.getElementById('editEventLevel').value = level;
    document.getElementById('editEventDate').value = date;
    document.getElementById('editEventLocation').value = location;
    openModal('editEventModal');
}

async function submitEditEvent(e) {
    e.preventDefault();
    const id = document.getElementById('editEventId').value;
    const form = e.target;
    const data = {
        name:     form.name.value.trim(),
        capacity: parseInt(form.capacity.value),
        level:    form.level.value,
        date:     form.date.value,
        location: form.location.value.trim()
    };

    try {
        const res = await fetch(`/api/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            showToast(err.error || 'Failed to update event', 'error');
            return;
        }
        showToast('Event updated');
        closeModal('editEventModal');
        setTimeout(() => location.reload(), 1000);
    } catch (err) {
        showToast('Server error', 'error');
    }
}

// ── DELETE EVENT ───────────────────────────────
async function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    try {
        const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            showToast('Failed to delete event', 'error');
            return;
        }
        showToast('Event deleted');
        document.querySelector(`tr[data-id="${id}"]`)?.remove();
    } catch (err) {
        showToast('Server error', 'error');
    }
}

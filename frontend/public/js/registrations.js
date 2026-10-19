// Registrations page JS - Domaine Prestige

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

// ── ADD REGISTRATION ───────────────────────────
async function submitAddReg(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        member_id: parseInt(form.member_id.value),
        event_id:  parseInt(form.event_id.value)
    };

    try {
        const res = await fetch('/api/registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            showToast(err.error || 'Registration failed', 'error');
            return;
        }
        showToast('Member registered successfully');
        closeModal('addRegModal');
        setTimeout(() => location.reload(), 1000);
    } catch (err) {
        showToast('Server error', 'error');
    }
}

// ── DELETE REGISTRATION ────────────────────────
async function deleteReg(id) {
    if (!confirm('Remove this registration?')) return;
    try {
        const res = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            showToast('Failed to remove registration', 'error');
            return;
        }
        showToast('Registration removed');
        document.querySelector(`tr[data-id="${id}"]`)?.remove();
    } catch (err) {
        showToast('Server error', 'error');
    }
}

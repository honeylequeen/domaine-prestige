// Members page JS - Domaine Prestige

// Shared utilities inline (loaded per page)
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

// ── ADD MEMBER ─────────────────────────────────
async function submitAddMember(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name:    form.name.value.trim(),
        title:   form.title.value,
        details: form.details.value.trim(),
        level:   form.level.value,
        region:  form.region.value.trim(),
        email:   form.email.value.trim()
    };

    try {
        const res = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            showToast(err.error || 'Failed to add member', 'error');
            return;
        }
        showToast('Member added successfully');
        closeModal('addMemberModal');
        setTimeout(() => location.reload(), 1000);
    } catch (err) {
        showToast('Server error', 'error');
    }
}

// ── EDIT MEMBER ────────────────────────────────
// Values are read from the button's data-* attributes instead of being
// pasted into inline JavaScript, so a member's name or region can't inject code.
function openEditMember(btn) {
    const { id, name, title, level, region, email, details } = btn.dataset;
    document.getElementById('editMemberId').value = id;
    document.getElementById('editMemberName').value = name;
    document.getElementById('editMemberTitle').value = title;
    document.getElementById('editMemberLevel').value = level;
    document.getElementById('editMemberRegion').value = region;
    document.getElementById('editMemberEmail').value = email;
    document.getElementById('editMemberDetails').value = details;
    openModal('editMemberModal');
}

async function submitEditMember(e) {
    e.preventDefault();
    const id = document.getElementById('editMemberId').value;
    const form = e.target;
    const data = {
        name:    form.name.value.trim(),
        title:   form.title.value,
        details: form.details.value.trim(),
        level:   form.level.value,
        region:  form.region.value.trim(),
        email:   form.email.value.trim()
    };

    try {
        const res = await fetch(`/api/members/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            showToast(err.error || 'Failed to update member', 'error');
            return;
        }
        showToast('Member updated');
        closeModal('editMemberModal');
        setTimeout(() => location.reload(), 1000);
    } catch (err) {
        showToast('Server error', 'error');
    }
}

// ── DELETE MEMBER ──────────────────────────────
async function deleteMember(id) {
    if (!confirm('Remove this member from Domaine Prestige?')) return;
    try {
        const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            showToast('Failed to delete member', 'error');
            return;
        }
        showToast('Member removed');
        document.querySelector(`tr[data-id="${id}"]`)?.remove();
    } catch (err) {
        showToast('Server error', 'error');
    }
}

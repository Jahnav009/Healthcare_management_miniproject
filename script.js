const appointments = [
  ['09:30 AM', 'Arjun Mehta', 'Dr. Kavya Rao', 'Confirmed'],
  ['10:15 AM', 'Nisha Verma', 'Dr. R. Iyer', 'Waiting'],
  ['11:00 AM', 'Rahul Sinha', 'Dr. Kavya Rao', 'Confirmed'],
  ['12:30 PM', 'Priya Nair', 'Dr. S. Thomas', 'Pending']
];

// Role permissions are kept in one place for clear access management.
// A production system must enforce these rules on the server as well.
const roles = {
  administrator: { label: 'Administrator', initials: 'AD', description: 'Full system access', views: ['dashboard', 'patients', 'appointments', 'records', 'security'], patients: true, appointments: true, clinical: true },
  doctor: { label: 'Doctor', initials: 'DR', description: 'Clinical records access', views: ['dashboard', 'patients', 'appointments', 'records'], patients: false, appointments: false, clinical: true },
  receptionist: { label: 'Receptionist', initials: 'RC', description: 'Patient & booking access', views: ['dashboard', 'patients', 'appointments'], patients: true, appointments: true, clinical: false }
};
const accounts = {
  'admin001': { password: 'Admin@123', role: 'administrator' },
  'doctor001': { password: 'Doctor@123', role: 'doctor' },
  'desk001': { password: 'Desk@123', role: 'receptionist' }
};
let currentRole = localStorage.getItem('medishield-role') || 'administrator';
const activeRole = () => roles[currentRole];
const can = permission => activeRole()[permission];

function audit(result, message) {
  const log = document.getElementById('auditLog');
  if (!log) return;
  const now = new Date().toLocaleTimeString('en-GB');
  log.insertAdjacentHTML('afterbegin', `<p><time>${now}</time><span class="${result === 'ALLOW' ? 'ok' : 'denied'}">${result}</span> ${message}</p>`);
}

const toast = (message) => {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'toast show';
  window.clearTimeout(window.toastTimer);
  window.toastTimer = window.setTimeout(() => el.className = 'toast', 3100);
};

function displaySchedule() {
  document.getElementById('scheduleList').innerHTML = appointments.map(([time, patient, doctor, status]) => `
    <div class="slot"><time>${time}</time><div class="slot-person"><b>${patient}</b><small>${doctor}</small></div><span class="badge ${status.toLowerCase()}">${status}</span></div>`).join('');
}

function changeView(view) {
  if (!activeRole().views.includes(view)) {
    audit('DENY', `${activeRole().label} attempted to open ${view}`);
    toast(`Access denied: ${activeRole().label} cannot open this area.`);
    return;
  }
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === view));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  const labels = { dashboard: ['HEALTHCARE OVERVIEW', `Welcome, ${activeRole().label}`], patients: ['PATIENT MANAGEMENT', 'Patient directory'], appointments: ['SCHEDULE MANAGEMENT', 'Appointments'], records: ['CLINICAL WORKSPACE', 'Medical records'], security: ['CYBERSECURITY OVERVIEW', 'Security centre'] };
  document.getElementById('pageEyebrow').textContent = labels[view][0];
  document.getElementById('pageTitle').textContent = labels[view][1];
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-link').forEach(button => button.addEventListener('click', () => changeView(button.dataset.view)));
document.querySelectorAll('[data-view-target]').forEach(button => button.addEventListener('click', () => changeView(button.dataset.viewTarget)));
document.querySelectorAll('[data-open-modal]').forEach(button => button.addEventListener('click', () => {
  const permission = button.dataset.permission;
  if (permission && !can(permission === 'managePatients' ? 'patients' : 'appointments')) {
    audit('DENY', `${activeRole().label} attempted a restricted action`);
    return toast(`Access denied: ${activeRole().label} cannot perform this action.`);
  }
  document.getElementById(button.dataset.openModal).classList.add('open');
}));
document.querySelectorAll('.close-modal').forEach(button => button.addEventListener('click', () => button.closest('.modal').classList.remove('open')));
document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); }));

document.getElementById('patientForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!can('patients')) return toast(`Access denied: ${activeRole().label} cannot register patients.`);
  const info = Object.fromEntries(new FormData(e.target));
  const name = info.name.trim().replace(/[^a-zA-Z .'-]/g, ''); // allow-list validation
  if (name.length < 2) return toast('Please enter a valid patient name.');
  const id = `OP-${1046 + document.querySelectorAll('#patientTable tr').length}`;
  document.getElementById('patientTable').insertAdjacentHTML('afterbegin', `<tr><td><b>${name}</b><small>${info.email}</small></td><td>${id}</td><td>${info.age} / ${info.gender}</td><td>27 Oct 2026</td><td><span class="badge confirmed">Active</span></td><td><button class="row-btn">View</button></td></tr>`);
  document.getElementById('patientCount').textContent = (1284 + document.querySelectorAll('#patientTable tr').length - 4).toLocaleString();
  audit('ALLOW', `${activeRole().label} registered patient ${id}`);
  e.target.closest('.modal').classList.remove('open'); e.target.reset(); toast(`Patient ${name} registered successfully.`);
});

document.getElementById('appointmentForm').addEventListener('submit', (e) => {
  e.preventDefault(); if (!can('appointments')) return toast(`Access denied: ${activeRole().label} cannot book appointments.`); const info = Object.fromEntries(new FormData(e.target));
  appointments.push([info.time, info.patient.trim(), info.doctor, 'Confirmed']); displaySchedule();
  document.getElementById('appointmentCount').textContent = 18 + appointments.length - 4;
  document.getElementById('appointmentTable').insertAdjacentHTML('beforeend', `<tr><td>${info.time}</td><td><b>${info.patient}</b><small>New booking</small></td><td>${info.doctor}</td><td><span class="badge confirmed">Confirmed</span></td></tr>`);
  audit('ALLOW', `${activeRole().label} booked an appointment for ${info.patient.trim()}`);
  e.target.closest('.modal').classList.remove('open'); e.target.reset(); toast('Appointment confirmed.');
});

document.getElementById('patientSearch').addEventListener('input', (e) => {
  const needle = e.target.value.toLowerCase();
  document.querySelectorAll('#patientTable tr').forEach(row => row.style.display = row.textContent.toLowerCase().includes(needle) ? '' : 'none');
});
document.getElementById('recordAccessButton').addEventListener('click', () => {
  if (!can('clinical')) { audit('DENY', 'Receptionist attempted to verify clinical record access'); return toast('Access denied: only Doctors and Administrators can view clinical records.'); }
  audit('ALLOW', `${activeRole().label} verified clinical record access`);
  toast('Role verified: clinical record access granted.');
});
document.getElementById('notifyButton').addEventListener('click', () => toast('2 notifications: 7 reports need review.'));
document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('medishield-signed-in');
  document.getElementById('signinForm').reset();
  document.getElementById('signinError').textContent = '';
  document.getElementById('signinScreen').classList.remove('hidden');
});
document.getElementById('refreshAudit').addEventListener('click', () => { audit('ALLOW', 'Administrator refreshed security audit trail'); toast('Audit log refreshed.'); });

document.getElementById('addNoteButton').addEventListener('click', () => {
  if (!can('clinical')) return toast(`Access denied: ${activeRole().label} cannot add clinical notes.`);
  document.getElementById('noteModal').classList.add('open');
});
document.getElementById('noteForm').addEventListener('submit', (e) => {
  e.preventDefault(); if (!can('clinical')) return toast('Access denied: clinical role required.');
  const info = Object.fromEntries(new FormData(e.target)); const note = info.note.trim().replace(/[<>]/g, '');
  document.getElementById('recordList').insertAdjacentHTML('afterbegin', `<div class="activity"><span class="activity-icon blue">▤</span><div><b>Clinical note added</b><p>${info.patient} • ${note}</p></div><span class="badge confirmed">Verified</span></div>`);
  audit('ALLOW', `${activeRole().label} added a clinical note for ${info.patient}`);
  e.target.closest('.modal').classList.remove('open'); e.target.reset(); toast('Clinical note saved.');
});

function renderRole() {
  const data = activeRole();
  document.getElementById('profileInitials').textContent = data.initials;
  document.getElementById('topInitials').textContent = data.initials;
  document.getElementById('profileName').textContent = data.label;
  document.getElementById('profileDescription').textContent = data.description;
  document.getElementById('rolePill').textContent = data.label;
  document.getElementById('heroCopy').textContent = data.clinical ? 'Review patients, appointments and secure clinical records.' : 'Register patients and keep appointments moving smoothly.';
  document.querySelectorAll('[data-role-access]').forEach(item => item.classList.toggle('role-hidden', !data.views.includes(item.dataset.roleAccess)));
  document.querySelectorAll('[data-permission]').forEach(button => {
    const allowed = can(button.dataset.permission === 'managePatients' ? 'patients' : 'appointments');
    button.hidden = !allowed;
  });
  document.getElementById('addNoteButton').hidden = !data.clinical;
  document.getElementById('recordNoticeText').textContent = data.clinical ? 'Access granted: your selected role can view and update clinical records.' : 'This area is protected. Receptionists cannot view clinical records.';
  const active = document.querySelector('.view.active').id;
  if (!data.views.includes(active)) changeView('dashboard');
}
displaySchedule();
renderRole();

document.getElementById('signinForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const staffId = document.getElementById('staffId').value.trim().toLowerCase();
  const password = document.getElementById('staffPassword').value;
  const account = accounts[staffId];
  if (!account || account.password !== password) {
    document.getElementById('signinError').textContent = 'Invalid staff ID or password.';
    return;
  }
  currentRole = account.role;
  localStorage.setItem('medishield-role', currentRole);
  localStorage.setItem('medishield-signed-in', 'true');
  renderRole();
  audit('ALLOW', `${activeRole().label} signed in as ${staffId}`);
  document.getElementById('signinError').textContent = '';
  document.getElementById('signinScreen').classList.add('hidden');
  toast(`Signed in as ${activeRole().label}.`);
});
if (localStorage.getItem('medishield-signed-in') === 'true') document.getElementById('signinScreen').classList.add('hidden');

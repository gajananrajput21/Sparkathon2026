/* PROOF (2/2) — human control. Owns window.lyraDispatch(action) [C3]:
 * low blast_radius runs immediately; high blast_radius freezes behind an approval
 * overlay (Approve / Edit / Reject). Journals inverses for UNDO LAST. Depends on
 * telemetry.js (window.lyraEmit + window.LYRA.state). */
(function () {
  var journal = [];           // {action, appliedAt}
  var POLICY = 'demo-v1';

  function emit(name, action, valueExtra) {
    if (typeof window.lyraEmit !== 'function') return;
    window.lyraEmit({
      event: name,
      component_id: (action && action.action_id) || 'action',
      archetype: (window.LYRA && window.LYRA.currentArchetype) || '',
      user_id: (window.LYRA && window.LYRA.currentUser) || 'maya',
      value: Object.assign({ label: action && action.label }, valueExtra || {}),
      ts: 0,
      policy_version: POLICY
    });
  }

  function execute(action) {
    if (action && action.inverse) journal.push({ action: action, appliedAt: Date.now });
    console.log('[PROOF] executed', action && action.action_id, action && action.payload);
    updateUndoBtn();
  }

  // ---- approval overlay ------------------------------------------------------
  function summarize(payload) {
    if (!payload) return '';
    return Object.keys(payload).map(function (k) { return k + ': ' + payload[k]; }).join(' · ');
  }

  function openOverlay(action) {
    var back = document.createElement('div');
    back.className = 'lyra-overlay';
    back.innerHTML =
      '<div class="lyra-approve" role="dialog" aria-modal="true">' +
      '  <div class="la-tag">HIGH BLAST RADIUS · APPROVAL REQUIRED</div>' +
      '  <div class="la-title"></div>' +
      '  <div class="la-summary"></div>' +
      '  <textarea class="la-edit" hidden></textarea>' +
      '  <div class="la-btns">' +
      '    <button class="la-reject">Reject</button>' +
      '    <button class="la-edit-btn">Edit</button>' +
      '    <button class="la-approve">Approve</button>' +
      '  </div>' +
      '</div>';
    back.querySelector('.la-title').textContent = action.label || 'Confirm action';
    back.querySelector('.la-summary').textContent = summarize(action.payload);
    document.body.appendChild(back);
    var reveal = function () { back.classList.add('in'); };
    requestAnimationFrame(reveal); setTimeout(reveal, 60); // rAF pauses in background tabs; timeout is the safety net

    function close() { back.classList.remove('in'); setTimeout(function () { back.remove(); }, 250); }
    var editArea = back.querySelector('.la-edit');

    back.querySelector('.la-approve').addEventListener('click', function () {
      emit('action.approved', action); execute(action); toast('Approved · ' + (action.label || '')); close();
    });
    back.querySelector('.la-reject').addEventListener('click', function () {
      emit('action.rejected', action); toast('Rejected'); close();
    });
    back.querySelector('.la-edit-btn').addEventListener('click', function () {
      if (editArea.hidden) {
        editArea.hidden = false;
        editArea.value = JSON.stringify(action.payload || {}, null, 2);
        editArea.focus();
        this.textContent = 'Save & approve';
      } else {
        try { action.payload = JSON.parse(editArea.value); } catch (e) { /* keep original on bad json */ }
        emit('action.edited', action); execute(action); toast('Edited & approved'); close();
      }
    });
  }

  // ---- the global everyone calls (C3) ---------------------------------------
  window.lyraDispatch = function (action) {
    if (!action || !action.action_id) { console.error('[PROOF] invalid C3 action', action); return; }
    if (action.blast_radius === 'high') { openOverlay(action); return; }
    emit('action.executed', action); execute(action); // low: immediate
  };

  // ---- UNDO LAST + toast -----------------------------------------------------
  var undoBtn;
  function updateUndoBtn() {
    if (!undoBtn) return;
    undoBtn.disabled = journal.length === 0;
  }
  function undoLast() {
    var last = journal.pop();
    if (!last) return;
    var inv = last.action.inverse;
    console.log('[PROOF] undo -> applying inverse', inv);
    emit('action.undone', last.action, { inverse: inv && inv.action_id });
    toast('Reversed · ' + ((inv && inv.label) || 'last action'));
    updateUndoBtn();
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'lyra-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    var showT = function () { t.classList.add('in'); };
    requestAnimationFrame(showT); setTimeout(showT, 40);
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  function mountUndo() {
    var panel = document.getElementById('lyra-telemetry');
    if (!panel || document.getElementById('lyra-undo')) return;
    undoBtn = document.createElement('button');
    undoBtn.id = 'lyra-undo';
    undoBtn.className = 'tel-undo';
    undoBtn.textContent = '↩ UNDO LAST';
    undoBtn.disabled = true;
    undoBtn.addEventListener('click', undoLast);
    var head = panel.querySelector('.tel-head');
    if (head) head.appendChild(undoBtn); else panel.insertBefore(undoBtn, panel.firstChild);
  }
  document.addEventListener('DOMContentLoaded', mountUndo);
  setTimeout(mountUndo, 0);

  window.lyraToast = toast; // reused by other lanes for reversible feedback
})();

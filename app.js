
// Keep previous functionality, but add small UI polish: counters and small animations
(function(){
  // Theme toggle
  const themeBtn = document.getElementById('themeToggle');
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeBtn.textContent = document.body.classList.contains('dark') ? 'Light' : 'Dark';
    // slight button bounce
    themeBtn.animate([{transform:'scale(1)'},{transform:'scale(1.04)'},{transform:'scale(1)'}],{duration:260});
  });
})();

function showSection(id){
  const panels = document.querySelectorAll('.panel');
  panels.forEach(p=>p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.location.hash = id;
  // Scroll into view smoothly
  document.getElementById(id).scrollIntoView({behavior:'smooth', block:'start'});
}

/* --- Attendance & GPA --- */
function calcAttendanceUI(){
  const attended = Number(document.getElementById('attended').value || 0);
  const total = Number(document.getElementById('total').value || 0);
  const pct = calcAttendance(attended, total);
  const r = document.getElementById('attendanceResult');
  if(total===0){
    r.innerHTML = '<div class="muted">Please enter total classes (>0).</div>';
    return;
  }
  r.innerHTML = `<div style="display:flex;gap:12px;align-items:center;justify-content:space-between">
    <div><strong>Attendance:</strong> ${pct}%</div>
    <div style="flex:1;margin-left:12px;background:rgba(2,6,23,0.04);border-radius:10px;overflow:hidden">
      <div style="width:${pct}%;height:18px;background:linear-gradient(90deg,#06b6d4,#8b5cf6);"></div>
    </div>
  </div>`;
}

function calcAttendance(attended, total){
  if(total === 0) return 0;
  return Math.round((attended/total)*100);
}

let COURSES = JSON.parse(localStorage.getItem('acc_courses')||'[]');
function renderCourses(){
  const el = document.getElementById('coursesList');
  if(!el) return;
  if(COURSES.length===0){ el.innerHTML = '<div class="muted">No courses added yet.</div>'; updateStats(); return; }
  el.innerHTML = COURSES.map((c,i)=>`<div class="item-row"><div><strong>${c.name||('Course '+(i+1))}</strong> — Marks: ${c.marks}, Credits: ${c.credits}</div>
    <div><button class="btn small" onclick="removeCourse(${i})">Remove</button></div></div>`).join('');
  updateStats();
}
function addCourse(){
  const name = document.getElementById('courseName').value.trim();
  const marks = Number(document.getElementById('courseMarks').value || 0);
  const credits = Number(document.getElementById('courseCredits').value || 0);
  if(credits<=0){ alert('Enter credits'); return; }
  COURSES.push({name, marks, credits});
  localStorage.setItem('acc_courses', JSON.stringify(COURSES));
  document.getElementById('courseName').value=''; document.getElementById('courseMarks').value=''; document.getElementById('courseCredits').value='';
  renderCourses();
}
function removeCourse(i){
  COURSES.splice(i,1);
  localStorage.setItem('acc_courses', JSON.stringify(COURSES));
  renderCourses();
}
function clearCourses(){
  if(!confirm('Clear all courses?')) return;
  COURSES = [];
  localStorage.removeItem('acc_courses');
  renderCourses();
  document.getElementById('gpaResult').innerHTML='';
}
function computeGPA(){
  if(COURSES.length===0){ alert('Add at least one course'); return; }
  let totalPoints = 0, totalCredits = 0;
  COURSES.forEach(c => {
    const gp = (c.marks/100)*10;
    totalPoints += gp * c.credits;
    totalCredits += c.credits;
  });
  const gpa = (totalPoints/totalCredits).toFixed(2);
  document.getElementById('gpaResult').innerHTML = `<div><strong>GPA:</strong> ${gpa}</div><div class="muted">Calculated using marks → 10-point scale conversion (simple demo)</div>`;
}

/* --- Timetable --- */
let SUBJECTS = JSON.parse(localStorage.getItem('acc_subjects')||'[]');
function renderSubjects(){
  const el = document.getElementById('subjectsList');
  if(SUBJECTS.length===0){ el.innerHTML = '<div class="muted">No subjects yet.</div>'; updateStats(); return; }
  el.innerHTML = SUBJECTS.map((s,i)=>`<div class="item-row"><div><strong>${s.name}</strong> — ${s.hours} hr/week</div>
    <div><button class="btn small" onclick="removeSubject(${i})">Remove</button></div></div>`).join('');
  updateStats();
}
function addSubject(){
  const name = document.getElementById('subName').value.trim();
  const hours = Number(document.getElementById('subHours').value || 0);
  if(!name || hours<=0){ alert('Enter subject name and hours'); return; }
  SUBJECTS.push({name, hours});
  localStorage.setItem('acc_subjects', JSON.stringify(SUBJECTS));
  document.getElementById('subName').value=''; document.getElementById('subHours').value='2';
  renderSubjects();
}
function removeSubject(i){
  SUBJECTS.splice(i,1);
  localStorage.setItem('acc_subjects', JSON.stringify(SUBJECTS));
  renderSubjects();
}
function clearSubjects(){
  if(!confirm('Clear subjects?')) return;
  SUBJECTS=[]; localStorage.removeItem('acc_subjects'); renderSubjects(); document.getElementById('timetableGrid').innerHTML='';
}
function generateTimetable(){
  if(SUBJECTS.length===0){ alert('Add subjects first'); return; }
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat'];
  const slotsPerDay = 6;
  let pool = [];
  SUBJECTS.forEach(s=>{
    const reps = Math.max(1, Math.round((s.hours/ (days.length*1)) * (days.length*slotsPerDay)));
    for(let i=0;i<reps;i++) pool.push(s.name);
  });
  while(pool.length < days.length*slotsPerDay){
    for(let s of SUBJECTS){
      pool.push(s.name);
      if(pool.length >= days.length*slotsPerDay) break;
    }
  }
  let idx=0;
  let html = '<table><thead><tr><th>Day/Slot</th>';
  for(let c=1;c<=slotsPerDay;c++) html += `<th>Slot ${c}</th>`;
  html += '</tr></thead><tbody>';
  for(let d=0; d<days.length; d++){
    html += `<tr><th>${days[d]}</th>`;
    for(let s=0; s<slotsPerDay; s++){
      html += `<td>${pool[idx++]}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  document.getElementById('timetableGrid').innerHTML = html;
}

/* --- Notes --- */
let NOTES = JSON.parse(localStorage.getItem('acc_notes')||'[]');
function renderNotes(){
  const el = document.getElementById('notesList');
  if(NOTES.length===0){ el.innerHTML = '<div class="muted">No notes saved yet.</div>'; updateStats(); return; }
  el.innerHTML = NOTES.map((n,i)=>`<div class="item-row"><div><strong>${n.title||('Note '+(i+1))}</strong><div class="muted">${n.content}</div></div>
    <div><button class="btn small" onclick="removeNote(${i})">Delete</button></div></div>`).join('');
  updateStats();
}
function saveNote(){
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  if(!title && !content){ alert('Enter title or content'); return; }
  NOTES.unshift({title, content, created: new Date().toISOString()});
  localStorage.setItem('acc_notes', JSON.stringify(NOTES));
  document.getElementById('noteTitle').value=''; document.getElementById('noteContent').value='';
  renderNotes();
}
function removeNote(i){
  if(!confirm('Delete this note?')) return;
  NOTES.splice(i,1); localStorage.setItem('acc_notes', JSON.stringify(NOTES)); renderNotes();
}

/* --- Tasks --- */
let TASKS = JSON.parse(localStorage.getItem('acc_tasks')||'[]');
function renderTasks(){
  const el = document.getElementById('tasksList');
  if(TASKS.length===0){ el.innerHTML = '<div class="muted">No tasks yet.</div>'; updateStats(); return; }
  el.innerHTML = TASKS.map((t,i)=>`<div class="item-row"><div><input type="checkbox" ${t.done?'checked':''} onchange="toggleTask(${i})" /> <strong style="text-decoration:${t.done?'line-through':''}">${t.text}</strong></div>
    <div><button class="btn small" onclick="removeTask(${i})">Delete</button></div></div>`).join('');
  updateStats();
}
function addTask(){
  const text = document.getElementById('taskText').value.trim();
  if(!text) return alert('Enter task');
  TASKS.unshift({text, done:false, created: new Date().toISOString()});
  localStorage.setItem('acc_tasks', JSON.stringify(TASKS));
  document.getElementById('taskText').value=''; renderTasks();
}
function toggleTask(i){
  TASKS[i].done = !TASKS[i].done; localStorage.setItem('acc_tasks', JSON.stringify(TASKS)); renderTasks();
}
function removeTask(i){
  if(!confirm('Delete task?')) return;
  TASKS.splice(i,1); localStorage.setItem('acc_tasks', JSON.stringify(TASKS)); renderTasks();
}

/* --- AI suggestion --- */
function getAISuggestion(){
  const text = (document.getElementById('aiInput').value||'').toLowerCase();
  const reply = aiSuggest(text);
  document.getElementById('aiReply').innerHTML = `<div><strong>Suggestion:</strong></div><div style="margin-top:6px">${reply}</div>`;
}
function aiSuggest(text){
  if(!text) return 'Please type a topic you are weak in (e.g., "math", "programming", "data structures").';
  if(text.includes('math') || text.includes('calculus') || text.includes('algebra')){
    return `<ol><li>Revise core formulas (30 min)</li><li>Practice solved examples (1 hr)</li><li>Solve 10 past problems (1 hr)</li><li>Revise mistakes next day</li></ol>`;
  }
  if(text.includes('prog') || text.includes('coding') || text.includes('programming') || text.includes('java') || text.includes('python')){
    return `<ol><li>Start with simple syntax & examples (30 min)</li><li>Do small exercises: loops & arrays (1 hr)</li><li>Build a mini project (1 day)</li></ol>`;
  }
  if(text.includes('exam') || text.includes('test') || text.includes('revision')){
    return `<ol><li>Create a 2-week revision plan</li><li>Use active recall and past papers</li><li>Keep daily 30-min quick revision slots</li></ol>`;
  }
  return 'Break topic into 25–30 minute focused sessions with short breaks. Start small and increase practice daily.';
}

/* --- UI helpers --- */
function updateStats(){
  document.getElementById('statCourses').textContent = (COURSES.length || 0);
  document.getElementById('statNotes').textContent = (NOTES.length || 0);
  document.getElementById('statTasks').textContent = (TASKS.length || 0);
}

// Init
(function init(){
  renderCourses(); renderSubjects(); renderNotes(); renderTasks();
  const hash = window.location.hash.replace('#','');
  if(hash) showSection(hash);
  // animate counters on load
  setTimeout(()=>{
    document.querySelectorAll('.card').forEach((c,i)=> c.animate([{opacity:0, transform:'translateY(8px)'},{opacity:1, transform:'translateY(0)'}],{duration:400, delay:i*80}));
  },120);
})();

// small helper for CSS item-row styling
document.addEventListener('DOMContentLoaded', ()=>{
  const style = document.createElement('style');
  style.innerHTML = `.item-row{display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;margin-bottom:8px;background:linear-gradient(180deg,rgba(255,255,255,0.6),rgba(255,255,255,0.5));}`;
  document.head.appendChild(style);
});

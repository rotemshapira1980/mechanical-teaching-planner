const STORAGE_KEY = 'technion-mechanical-teaching-planner-v1';
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const SEMESTERS = { fall: 'חורף', spring: 'אביב' };
const emptyData = () => ({ courses: [], proposals: [], schedules: { fall: [], spring: [] } });
let data = loadData();
let activeSemester = 'fall';
let toastTimer;

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.courses) || !Array.isArray(saved.proposals)) return emptyData();
    return { ...emptyData(), ...saved, schedules: { ...emptyData().schedules, ...(saved.schedules || {}) } };
  } catch { return emptyData(); }
}
function saveData(message) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); if (message) showToast(message); }
  catch { showToast('לא ניתן לשמור בדפדפן. ייתכן שאחסון מקומי חסום.'); }
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function showToast(message) {
  const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function courseById(id) { return data.courses.find((course) => course.id === id); }
function courseByCode(code) { return data.courses.find((course) => course.code.toLowerCase() === code.toLowerCase()); }

function renderAll() { renderStats(); renderCourses(); renderCourseOptions(); renderProposals(); renderSchedules(); renderScores(); renderDashboardRecent(); }
function renderStats() {
  document.querySelector('#stat-courses').textContent = data.courses.length;
  document.querySelector('#stat-proposals').textContent = data.proposals.length;
  document.querySelector('#stat-lecturers').textContent = new Set(data.proposals.map((item) => item.lecturer.trim().toLocaleLowerCase()).filter(Boolean)).size;
  const total = Object.values(data.schedules).flat().reduce((sum, item) => sum + Number(courseById(item.courseId)?.points || 0), 0);
  document.querySelector('#stat-points').textContent = total.toLocaleString('he-IL');
  for (const semester of ['fall', 'spring']) { const count = data.schedules[semester].length; document.querySelector(`#${semester}-summary`).textContent = count ? `${count} קורסים שובצו` : 'עדיין לא נבנתה מערכת'; }
}
function renderCourses() {
  const query = document.querySelector('#course-search').value.trim().toLocaleLowerCase(); const level = document.querySelector('#level-filter').value;
  const visible = data.courses.filter((course) => (!level || course.level === level) && `${course.code} ${course.title}`.toLocaleLowerCase().includes(query));
  document.querySelector('#catalog-count').textContent = data.courses.length;
  document.querySelector('#course-rows').innerHTML = visible.map((course) => `<tr><td class="course-code">${escapeHtml(course.code)}</td><td>${escapeHtml(course.title)}${course.lecturers?.length ? `<small class="course-lecturers">מרצים: ${escapeHtml(course.lecturers.join(', '))}</small>` : ''}</td><td><span class="level-tag">${escapeHtml(course.level || 'לא צוין')}</span></td><td class="points-tag">${course.points == null ? '<span class="unverified-points">לא אומת</span>' : escapeHtml(course.points)}</td><td><button class="icon-button" data-delete-course="${escapeHtml(course.id)}" aria-label="מחיקת קורס ${escapeHtml(course.code)}" title="מחיקת קורס">×</button></td></tr>`).join('');
  const empty = document.querySelector('#course-empty'); empty.classList.toggle('visible', visible.length === 0);
  empty.querySelector('h3').textContent = data.courses.length ? 'לא נמצאו קורסים' : 'הקטלוג עדיין ריק';
  empty.querySelector('p').textContent = data.courses.length ? 'נסו לשנות את מילות החיפוש או את הסינון.' : 'הוסיפו קורס או ייבאו קובץ CSV כדי להתחיל.';
}
function renderCourseOptions() {
  const select = document.querySelector('#proposal-course'); const selected = select.value;
  select.innerHTML = '<option value="">בחירת קורס מהקטלוג</option>' + data.courses.slice().sort((a, b) => a.code.localeCompare(b.code, 'he')).map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.code)} · ${escapeHtml(course.title)} (${escapeHtml(course.points)} נקודות)</option>`).join('');
  if (data.courses.some((course) => course.id === selected)) select.value = selected;
  const lecturers = [...new Set([...data.proposals.map((item) => item.lecturer.trim()), ...data.courses.flatMap((course) => course.lecturers || [])].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he'));
  document.querySelector('#lecturer-options').innerHTML = lecturers.map((name) => `<option value="${escapeHtml(name)}"></option>`).join('');
}
function renderProposals() {
  const filter = document.querySelector('#proposal-semester-filter').value;
  const proposals = data.proposals.filter((item) => !filter || item.semester === filter).slice().sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start));
  document.querySelector('#proposal-count').textContent = data.proposals.length; const list = document.querySelector('#proposal-list');
  if (!proposals.length) { list.innerHTML = `<div class="empty-state"><span class="empty-symbol">◷</span><h3>${data.proposals.length ? 'אין הצעות לסמסטר הזה' : 'אין עדיין הצעות'}</h3><p>הוסיפו זמינות כדי להתחיל לבנות מערכת.</p></div>`; return; }
  list.innerHTML = proposals.map((item) => { const course = courseById(item.courseId); if (!course) return ''; const role = item.role === 'assistant' ? 'מתרגלת או מתרגל' : item.role === 'lecturer' ? 'מרצה' : ''; return `<article class="proposal-item"><div class="proposal-main"><strong>${escapeHtml(course.code)} · ${escapeHtml(course.title)}</strong><small>${escapeHtml(item.lecturer)}${role ? ` · ${role}` : ''} · ${escapeHtml(item.day)} ${escapeHtml(item.start)}–${escapeHtml(item.end)}</small></div><div class="proposal-side"><b>${SEMESTERS[item.semester]}</b><small>${course.points == null ? 'נקודות לא אומתו' : `${escapeHtml(course.points)} נקודות`}</small></div><button class="icon-button" data-delete-proposal="${escapeHtml(item.id)}" aria-label="מחיקת הצעה" title="מחיקת הצעה">×</button></article>`; }).join('');
}
function scheduleConflict(proposal, placed) { return placed.some((item) => item.day === proposal.day && proposal.start < item.end && proposal.end > item.start); }
function buildSchedule(semester) {
  const eligible = data.proposals.filter((item) => item.semester === semester && courseById(item.courseId)); const grouped = new Map();
  for (const item of eligible) { if (!grouped.has(item.courseId)) grouped.set(item.courseId, []); grouped.get(item.courseId).push(item); }
  const candidates = [...grouped.entries()].map(([courseId, options]) => ({ courseId, options: options.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start)) }));
  candidates.sort((a, b) => a.options.length - b.options.length || courseById(a.courseId).code.localeCompare(courseById(b.courseId).code, 'he'));
  const placed = [], unscheduled = [];
  for (const candidate of candidates) { const option = candidate.options.find((item) => !scheduleConflict(item, placed)); if (!option) { unscheduled.push(courseById(candidate.courseId).code); continue; } placed.push({ proposalId: option.id, courseId: candidate.courseId, lecturer: option.lecturer, day: option.day, start: option.start, end: option.end }); }
  placed.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start)); data.schedules[semester] = placed; saveData(); renderAll();
  const message = placed.length ? `נבנתה מערכת עם ${placed.length} קורסים${unscheduled.length ? `. לא שובצו: ${unscheduled.join(', ')}` : ''}` : 'לא נמצאו הצעות זמינות לסמסטר הזה';
  document.querySelector('#schedule-notice').textContent = message; showToast(message);
}
function renderSchedules() {
  document.querySelectorAll('.semester-tab').forEach((button) => button.classList.toggle('active', button.dataset.semester === activeSemester));
  document.querySelector('#schedule-eyebrow').textContent = `סמסטר ${SEMESTERS[activeSemester]}`;
  const items = data.schedules[activeSemester].filter((item) => courseById(item.courseId)).slice().sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start));
  document.querySelector('#schedule-status').textContent = items.length ? `${items.length} קורסים במערכת` : 'אין מערכת שמורה';
  document.querySelector('#schedule-rows').innerHTML = items.map((item) => { const course = courseById(item.courseId); return `<tr><td>${escapeHtml(item.day)}</td><td>${escapeHtml(item.start)}–${escapeHtml(item.end)}</td><td><span class="course-code">${escapeHtml(course.code)}</span> · ${escapeHtml(course.title)}</td><td>${escapeHtml(item.lecturer)}</td><td>${escapeHtml(course.points)}</td></tr>`; }).join('');
  document.querySelector('#schedule-empty').classList.toggle('visible', items.length === 0);
}
function renderScores() {
  const filter = document.querySelector('#score-semester-filter').value;
  const entries = Object.entries(data.schedules).filter(([semester]) => !filter || semester === filter).flatMap(([semester, items]) => items.map((item) => ({ ...item, semester, course: courseById(item.courseId) }))).filter((item) => item.course);
  const unverifiedCourses = new Set(entries.filter((item) => item.course.points == null).map((item) => item.course.id));
  const totals = new Map();
  for (const item of entries) { const key = item.lecturer.trim(); const score = totals.get(key) || { points: 0, courses: [] }; score.points += Number(item.course.points) || 0; score.courses.push(`${item.course.code} (${SEMESTERS[item.semester]})`); totals.set(key, score); }
  const ranked = [...totals.entries()].sort((a, b) => b[1].points - a[1].points || a[0].localeCompare(b[0], 'he')); const totalPoints = ranked.reduce((sum, [, score]) => sum + score.points, 0);
  document.querySelector('#score-total').textContent = totalPoints.toLocaleString('he-IL');
  document.querySelector('#score-unverified-note').textContent = unverifiedCourses.size ? `${unverifiedCourses.size} קורסים ללא נקודות מאומתות אינם נכללים בסכום.` : '';
  document.querySelector('#score-rows').innerHTML = ranked.map(([name, score], index) => { const share = totalPoints ? Math.round(score.points / totalPoints * 100) : 0; return `<tr><td class="rank-cell">${String(index + 1).padStart(2, '0')}</td><td><strong>${escapeHtml(name)}</strong></td><td>${score.courses.length}</td><td class="score-points">${score.points.toLocaleString('he-IL')}</td><td><div class="score-bar" aria-label="${share}%"><span style="width:${share}%"></span></div></td></tr>`; }).join('');
  document.querySelector('#score-empty').classList.toggle('visible', ranked.length === 0);
}
function renderDashboardRecent() {
  const container = document.querySelector('#dashboard-recent'); const latest = data.proposals.slice(-3).reverse();
  if (!latest.length) { container.className = 'empty-state compact-empty'; container.innerHTML = '<span class="empty-symbol">＋</span><p>כאן יופיעו הצעות ההוראה לאחר הוספתן.</p>'; return; }
  container.className = 'proposal-list';
  container.innerHTML = latest.map((item) => { const course = courseById(item.courseId); return course ? `<article class="proposal-item"><div class="proposal-main"><strong>${escapeHtml(course.code)} · ${escapeHtml(course.title)}</strong><small>${escapeHtml(item.lecturer)} · ${escapeHtml(item.day)} ${item.start}–${item.end}</small></div><div class="proposal-side"><b>${SEMESTERS[item.semester]}</b><small>${course.points} נקודות</small></div></article>` : ''; }).join('');
}
function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) { const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[index + 1] === '\n') index += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); return rows;
}
function normalizeLevel(value) {
  const level = value.trim(); const aliases = { 'תואר ראשון': 'הסמכה', 'הסמכה': 'הסמכה', 'משותף': 'משותף', 'תואר שני': 'מוסמכים', 'תואר שלישי': 'מוסמכים', 'מוסמכים': 'מוסמכים', undergraduate: 'הסמכה', shared: 'משותף', graduate: 'מוסמכים' };
  return aliases[level.toLocaleLowerCase()] || aliases[level] || level || 'לא צוין';
}
function downloadFile(filename, content, type = 'text/csv;charset=utf-8') { const blob = new Blob(['\ufeff', content], { type }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); URL.revokeObjectURL(link.href); }
function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
function normalizedHeader(value) { return String(value ?? '').trim().toLocaleLowerCase().replace(/[\s_\-./()]/g, ''); }
function headerIndex(headers, aliases) { return headers.findIndex((header) => aliases.includes(normalizedHeader(header))); }
function extractCourseCodes(value) { return [...new Set(String(value ?? '').match(/\b\d{5,10}\b/g) || [])]; }
function stripCourseCodes(value) { return String(value ?? '').replace(/\b\d{5,10}\b/g, '').replace(/[.…]+/g, ' ').replace(/\s+/g, ' ').replace(/^[\s:;,-]+|[\s:;,-]+$/g, '').trim(); }
function mergeImportedCourse({ code, title, level, points, lecturer }) {
  let course = courseByCode(code);
  if (!course) {
    course = { id: crypto.randomUUID(), code, title: title || 'שם קורס לא צוין', level: level || 'לא צוין', points: points ?? null, lecturers: [] };
    data.courses.push(course);
  } else {
    if (title) course.title = title;
    if (level && level !== 'לא צוין') course.level = level;
    if (points != null) course.points = points;
    course.lecturers ||= [];
  }
  if (lecturer && !course.lecturers.some((name) => name.toLocaleLowerCase() === lecturer.toLocaleLowerCase())) course.lecturers.push(lecturer);
}
function importCatalogGrid(grid) {
  let headerRowIndex = -1, bestScore = 0;
  for (let rowIndex = 0; rowIndex < Math.min(grid.length, 12); rowIndex += 1) {
    const headers = grid[rowIndex].map(normalizedHeader);
    const hasCourseId = headers.some((value) => ['coursecode', 'courseid', 'coursenumber', 'number', 'מספרקורס', 'מספרהקורס', 'קודקורס'].includes(value));
    const hasLecturer = headers.some((value) => ['lecturer', 'instructor', 'teacher', 'מרצה', 'המרצה'].includes(value));
    const hasSemester = headers.some((value) => ['חורף', 'אביב', 'winter', 'spring', 'fall'].includes(value));
    const score = Number(hasCourseId) * 2 + Number(hasLecturer) + Number(hasSemester);
    if (score > bestScore) { bestScore = score; headerRowIndex = rowIndex; }
  }
  if (headerRowIndex < 0 || bestScore < 2) throw new Error('לא זיהיתי שורת כותרות. נדרשים מספר קורס או עמודות מרצה וסמסטר.');

  const headers = grid[headerRowIndex].map((value) => String(value ?? '').trim());
  const codeIndex = headerIndex(headers, ['coursecode', 'courseid', 'coursenumber', 'number', 'מספרקורס', 'מספרהקורס', 'קודקורס']);
  const titleIndex = headerIndex(headers, ['name', 'title', 'coursename', 'שםקורס', 'שםהקורס', 'שם']);
  const levelIndex = headerIndex(headers, ['level', 'רמה', 'תואר', 'רמתקורס']);
  const pointsIndex = headerIndex(headers, ['points', 'credits', 'נקודות', 'ניקוד', 'נקז', 'נקודותזכות']);
  const lecturerIndex = headerIndex(headers, ['lecturer', 'instructor', 'teacher', 'מרצה', 'המרצה']);
  const semesterIndices = headers.map((header, index) => ['חורף', 'אביב', 'winter', 'spring', 'fall'].includes(normalizedHeader(header)) ? index : -1).filter((index) => index >= 0);
  let imported = 0, matched = 0, missingPoints = 0, lecturerLinks = 0, previousLecturer = '';
  for (const row of grid.slice(headerRowIndex + 1)) {
    const lecturerCell = lecturerIndex >= 0 ? String(row[lecturerIndex] ?? '').trim() : '';
    if (lecturerCell) previousLecturer = lecturerCell;
    const lecturer = lecturerCell || (lecturerIndex >= 0 ? previousLecturer : '');
    const rawPoints = pointsIndex >= 0 ? String(row[pointsIndex] ?? '').trim().replace(',', '.') : '';
    const parsedPoints = rawPoints ? Number(rawPoints) : NaN;
    const points = Number.isFinite(parsedPoints) && parsedPoints >= 0 ? parsedPoints : null;
    const level = levelIndex >= 0 ? normalizeLevel(String(row[levelIndex] ?? '')) : 'לא צוין';
    const courseCells = codeIndex >= 0
      ? [{ value: row[codeIndex], title: titleIndex >= 0 ? String(row[titleIndex] ?? '').trim() : '' }]
      : semesterIndices.map((index) => ({ value: row[index], title: '' }));
    const rowCodes = new Set();
    for (const cell of courseCells) {
      const codes = extractCourseCodes(cell.value);
      for (const code of codes) {
        if (rowCodes.has(code)) continue;
        rowCodes.add(code);
        const title = cell.title || stripCourseCodes(cell.value);
        const existed = Boolean(courseByCode(code));
        mergeImportedCourse({ code, title, level, points, lecturer });
        matched += 1;
        imported += Number(!existed);
        missingPoints += Number(courseByCode(code)?.points == null);
        lecturerLinks += Number(Boolean(lecturer));
      }
    }
  }
  return { imported, matched, missingPoints, lecturerLinks };
}
function setupTimeOptions() {
  const times = []; for (let hour = 8; hour <= 20; hour += 1) for (const minute of [0, 30]) { if (hour === 20 && minute > 0) continue; times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`); }
  const options = '<option value="">בחירה</option>' + times.map((time) => `<option value="${time}">${time}</option>`).join('');
  document.querySelector('[name="start"]').innerHTML = options; document.querySelector('[name="end"]').innerHTML = options; document.querySelector('[name="start"]').value = '08:00'; document.querySelector('[name="end"]').value = '10:00';
}
function goTo(view) {
  document.querySelectorAll('.view').forEach((section) => section.classList.toggle('active', section.id === `view-${view}`));
  document.querySelectorAll('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  const active = document.querySelector(`.nav-link[data-view="${view}"]`); document.querySelector('#current-view-label').textContent = active ? active.textContent.trim() : 'סקירה'; window.location.hash = view;
}

document.querySelectorAll('.nav-link, [data-go]').forEach((button) => button.addEventListener('click', () => goTo(button.dataset.view || button.dataset.go)));
document.querySelectorAll('[data-open-sem]').forEach((button) => button.addEventListener('click', () => { activeSemester = button.dataset.openSem; goTo('schedule'); renderSchedules(); }));
document.querySelector('#course-search').addEventListener('input', renderCourses);
document.querySelector('#level-filter').addEventListener('change', renderCourses);
document.querySelector('#proposal-semester-filter').addEventListener('change', renderProposals);
document.querySelector('#score-semester-filter').addEventListener('change', renderScores);
document.querySelector('#course-form').addEventListener('submit', (event) => {
  event.preventDefault(); const form = new FormData(event.currentTarget); const code = String(form.get('code')).trim(); const title = String(form.get('title')).trim(); const level = String(form.get('level')).trim(); const points = Number(form.get('points'));
  if (!code || !title || !level || !Number.isFinite(points) || points < 0) return showToast('בדקו את פרטי הקורס והנקודות.');
  const existing = courseByCode(code); if (existing) Object.assign(existing, { title, level, points }); else data.courses.push({ id: crypto.randomUUID(), code, title, level, points });
  saveData(existing ? 'פרטי הקורס עודכנו' : 'הקורס נוסף לקטלוג'); event.currentTarget.reset(); renderAll();
});
document.querySelector('#course-rows').addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-course]'); if (!button) return; const course = courseById(button.dataset.deleteCourse);
  if (!course || !window.confirm(`למחוק את ${course.code} ואת ההצעות והשיבוצים שלו?`)) return;
  data.courses = data.courses.filter((item) => item.id !== course.id); data.proposals = data.proposals.filter((item) => item.courseId !== course.id);
  for (const semester of ['fall', 'spring']) data.schedules[semester] = data.schedules[semester].filter((item) => item.courseId !== course.id);
  saveData('הקורס והנתונים המשויכים אליו נמחקו'); renderAll();
});
document.querySelector('#proposal-form').addEventListener('submit', (event) => {
  event.preventDefault(); const form = new FormData(event.currentTarget); const courseId = String(form.get('courseId')); const lecturer = String(form.get('lecturer')).trim(); const start = String(form.get('start')); const end = String(form.get('end'));
  if (!courseById(courseId)) return showToast('יש לבחור קורס מהקטלוג.'); if (!lecturer) return showToast('יש להזין שם מרצה.'); if (!start || !end || start >= end) return showToast('שעת הסיום צריכה להיות מאוחרת משעת ההתחלה.');
  data.proposals.push({ id: crypto.randomUUID(), semester: String(form.get('semester')), courseId, lecturer, day: String(form.get('day')), start, end });
  saveData('הצעת הזמינות נשמרה'); event.currentTarget.reset(); setupTimeOptions(); renderAll();
});
document.querySelector('#proposal-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-proposal]'); if (!button) return; const id = button.dataset.deleteProposal;
  data.proposals = data.proposals.filter((item) => item.id !== id); for (const semester of ['fall', 'spring']) data.schedules[semester] = data.schedules[semester].filter((item) => item.proposalId !== id);
  saveData('ההצעה הוסרה'); renderAll();
});
document.querySelectorAll('.semester-tab').forEach((button) => button.addEventListener('click', () => { activeSemester = button.dataset.semester; document.querySelector('#schedule-notice').textContent = ''; renderSchedules(); }));
document.querySelector('#generate-schedule').addEventListener('click', () => buildSchedule(activeSemester));
document.querySelector('#clear-schedule').addEventListener('click', () => { if (!data.schedules[activeSemester].length) return; data.schedules[activeSemester] = []; saveData('המערכת נוקתה'); document.querySelector('#schedule-notice').textContent = ''; renderAll(); });
document.querySelector('#export-schedule').addEventListener('click', () => {
  const rows = data.schedules[activeSemester].map((item) => { const course = courseById(item.courseId); return [SEMESTERS[activeSemester], item.day, item.start, item.end, course?.code, course?.title, item.lecturer, course?.points]; });
  const csv = [['סמסטר', 'יום', 'משעה', 'עד שעה', 'מספר קורס', 'שם קורס', 'מרצה', 'נקודות'], ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n'); downloadFile(`מערכת-${SEMESTERS[activeSemester]}.csv`, csv);
});
document.querySelector('#download-template').addEventListener('click', () => {
  const csv = [['courseCode', 'name', 'level', 'points'], ['034000', 'יש להחליף בשם הרשמי', 'הסמכה', '3']].map((row) => row.map(csvCell).join(',')).join('\r\n'); downloadFile('technion-course-catalog-template.csv', csv);
});
document.querySelector('#csv-file').addEventListener('change', async (event) => {
  const input = event.currentTarget; const file = input.files?.[0]; if (!file) return;
  try {
    let grid;
    if (/\.csv$/i.test(file.name)) grid = parseCsv(await file.text());
    else {
      if (typeof XLSX === 'undefined') throw new Error('טעינת Excel דורשת חיבור לאינטרנט. אפשר לשמור את הגיליון כ-CSV ולייבא אותו.');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
      const sheets = workbook.SheetNames.map((name) => XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '', raw: false }));
      grid = sheets.sort((a, b) => b.length - a.length)[0] || [];
    }
    const result = importCatalogGrid(grid);
    if (!result.matched) throw new Error('לא נמצאו מספרי קורסים בני 5–10 ספרות בגיליון.');
    saveData(); renderAll();
    const pointStatus = result.missingPoints ? `; ${result.missingPoints} ללא נקודות מאומתות` : '';
    showToast(`${result.matched} קורסים זוהו (${result.imported} חדשים), ${result.lecturerLinks} שיוכי מרצה נטענו${pointStatus}`);
  } catch (error) { showToast(error.message || 'לא ניתן לקרוא את קובץ ה-CSV.'); }
  finally { input.value = ''; }
});
document.querySelector('#clear-catalog').addEventListener('click', () => { if (!data.courses.length || !window.confirm('לנקות את כל הקטלוג, ההצעות והמערכות?')) return; data = emptyData(); saveData('הקטלוג וכל הנתונים המשויכים אליו נוקו'); renderAll(); });
window.addEventListener('hashchange', () => { const requested = window.location.hash.slice(1); if (['dashboard', 'catalog', 'proposals', 'schedule', 'scores'].includes(requested)) goTo(requested); });
setupTimeOptions(); renderAll(); const initialView = window.location.hash.slice(1); goTo(['dashboard', 'catalog', 'proposals', 'schedule', 'scores'].includes(initialView) ? initialView : 'dashboard');
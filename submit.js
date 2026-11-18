<<<<<<< HEAD
const requestStatus = document.querySelector('#request-status');
const requestForm = document.querySelector('#request-form');
const requestCourse = document.querySelector('#request-course');
const requestSubmit = document.querySelector('#request-submit');
const requestClient = window.supabase?.createClient('https://ipogmsjnyzsuvtttxkyb.supabase.co', 'sb_publishable_q2xd0pIIlMCeQWFslo9YDA_08A_qBFY');

async function loadCourses() {
  if (!requestClient) { requestStatus.textContent = 'לא ניתן להתחבר למאגר. בדקו את החיבור לאינטרנט.'; return; }
  const { data: courses, error } = await requestClient.from('teaching_courses').select('id,code,title,points').order('code');
  if (error) { requestStatus.textContent = 'טעינת הקורסים נכשלה. נסו לרענן את הדף.'; return; }
  requestCourse.replaceChildren(new Option(courses.length ? 'בחירת קורס' : 'טרם פורסמו קורסים', ''));
  for (const course of courses) requestCourse.add(new Option(`${course.code} · ${course.title} · ${course.points == null ? 'נקודות לא אומתו' : `${course.points} נקודות`}`, course.id));
  requestCourse.disabled = !courses.length;
  requestSubmit.disabled = !courses.length;
  if (!courses.length) requestStatus.textContent = 'הקטלוג עדיין אינו זמין. יש לפנות למנהלת המערכת.';
}

requestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(requestForm);
  const start = String(form.get('start'));
  const end = String(form.get('end'));
  const lecturer = String(form.get('lecturer')).trim();
  if (!lecturer || start >= end) { requestStatus.textContent = 'יש להזין שם ושעת סיום מאוחרת משעת ההתחלה.'; return; }
  requestSubmit.disabled = true;
  const { error } = await requestClient.from('teaching_requests').insert({ course_id: form.get('course'), semester: form.get('semester'), lecturer, teaching_role: form.get('role'), day: form.get('day'), starts_at: start, ends_at: end });
  if (error) requestStatus.textContent = 'שליחת הבקשה נכשלה. בדקו את החיבור ונסו שוב.';
  else { requestForm.reset(); requestStatus.textContent = 'הבקשה נשלחה בהצלחה.'; }
  requestSubmit.disabled = false;
});

=======
const requestStatus = document.querySelector('#request-status');
const requestForm = document.querySelector('#request-form');
const requestCourse = document.querySelector('#request-course');
const requestSubmit = document.querySelector('#request-submit');
const requestClient = window.supabase?.createClient('https://ipogmsjnyzsuvtttxkyb.supabase.co', 'sb_publishable_q2xd0pIIlMCeQWFslo9YDA_08A_qBFY');

async function loadCourses() {
  if (!requestClient) { requestStatus.textContent = 'לא ניתן להתחבר למאגר. בדקו את החיבור לאינטרנט.'; return; }
  const { data: courses, error } = await requestClient.from('teaching_courses').select('id,code,title,points').order('code');
  if (error) { requestStatus.textContent = 'טעינת הקורסים נכשלה. נסו לרענן את הדף.'; return; }
  requestCourse.replaceChildren(new Option(courses.length ? 'בחירת קורס' : 'טרם פורסמו קורסים', ''));
  for (const course of courses) requestCourse.add(new Option(`${course.code} · ${course.title} · ${course.points == null ? 'נקודות לא אומתו' : `${course.points} נקודות`}`, course.id));
  requestCourse.disabled = !courses.length;
  requestSubmit.disabled = !courses.length;
  if (!courses.length) requestStatus.textContent = 'הקטלוג עדיין אינו זמין. יש לפנות למנהלת המערכת.';
}

requestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(requestForm);
  const start = String(form.get('start'));
  const end = String(form.get('end'));
  const lecturer = String(form.get('lecturer')).trim();
  if (!lecturer || start >= end) { requestStatus.textContent = 'יש להזין שם ושעת סיום מאוחרת משעת ההתחלה.'; return; }
  requestSubmit.disabled = true;
  const { error } = await requestClient.from('teaching_requests').insert({ course_id: form.get('course'), semester: form.get('semester'), lecturer, teaching_role: form.get('role'), day: form.get('day'), starts_at: start, ends_at: end });
  if (error) requestStatus.textContent = 'שליחת הבקשה נכשלה. בדקו את החיבור ונסו שוב.';
  else { requestForm.reset(); requestStatus.textContent = 'הבקשה נשלחה בהצלחה.'; }
  requestSubmit.disabled = false;
});

>>>>>>> 804131de42c7724ef9e18aa77e1d59eaf62038d5
loadCourses();
const SHARED_URL = 'https://ipogmsjnyzsuvtttxkyb.supabase.co';
const SHARED_KEY = 'sb_publishable_q2xd0pIIlMCeQWFslo9YDA_08A_qBFY';
const ADMIN_ID = 'e6045942-5fdf-4e8d-b607-cd7a1280e056';
const sharedClient = window.supabase ? window.supabase.createClient(SHARED_URL, SHARED_KEY) : null;

if (document.querySelector('#admin-login')) {
  const login = document.querySelector('#admin-login');
  const status = document.querySelector('#cloud-status');
  const signout = document.querySelector('#admin-signout');
  const publish = document.querySelector('#publish-catalog');
  const sync = document.querySelector('#sync-requests');

  function setAdmin(session) {
    const authorized = session?.user?.id === ADMIN_ID;
    login.hidden = authorized;
    signout.hidden = !authorized;
    publish.disabled = !authorized;
    sync.disabled = !authorized;
    status.textContent = authorized ? 'מחוברת כמנהלת. המערכת המקומית אינה מתעדכנת אוטומטית.' : 'יש להתחבר כדי לנהל את המאגר המשותף.';
  }

  if (!sharedClient) status.textContent = 'לא ניתן לטעון את החיבור למאגר. בדקו את החיבור לאינטרנט.';
  else {
    sharedClient.auth.getSession().then(({ data: sessionData }) => setAdmin(sessionData.session));
    sharedClient.auth.onAuthStateChange((_event, session) => setAdmin(session));
    login.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(login);
      const { data: loginData, error } = await sharedClient.auth.signInWithPassword({ email: String(form.get('email')).trim(), password: String(form.get('password')) });
      login.reset();
      if (error || loginData.user?.id !== ADMIN_ID) {
        if (!error) await sharedClient.auth.signOut();
        status.textContent = 'הכניסה נכשלה או שלמשתמשת אין הרשאת ניהול.';
        return;
      }
      setAdmin(loginData.session);
    });
    signout.addEventListener('click', async () => { await sharedClient.auth.signOut(); setAdmin(null); });
    publish.addEventListener('click', async () => {
      if (!data.courses.length) { status.textContent = 'אין קורסים בקטלוג המקומי לפרסום.'; return; }
      publish.disabled = true;
      const courses = data.courses.map(({ id, code, title, level, points }) => ({ id, code, title, level: level || 'לא צוין', points: points ?? null }));
      const { error } = await sharedClient.from('teaching_courses').upsert(courses, { onConflict: 'id' });
      status.textContent = error ? 'פרסום הקטלוג נכשל. בדקו את החיבור או כפילויות במספרי הקורסים.' : `פורסמו ${courses.length} קורסים לטופס ההגשה.`;
      publish.disabled = false;
    });
    sync.addEventListener('click', async () => {
      sync.disabled = true;
      const [{ data: courses, error: courseError }, { data: requests, error: requestError }] = await Promise.all([
        sharedClient.from('teaching_courses').select('id,code,title,level,points'),
        sharedClient.from('teaching_requests').select('id,course_id,semester,lecturer,teaching_role,day,starts_at,ends_at').order('created_at')
      ]);
      if (courseError || requestError) status.textContent = 'טעינת הבקשות נכשלה. בדקו את החיבור והרשאות המנהלת.';
      else {
        for (const course of courses) {
          if (!courseById(course.id) && !courseByCode(course.code)) data.courses.push(course);
        }
        let added = 0;
        for (const request of requests) {
          if (data.proposals.some((proposal) => proposal.id === request.id)) continue;
          const remoteCourse = courses.find((course) => course.id === request.course_id);
          const localCourse = courseById(request.course_id) || (remoteCourse && courseByCode(remoteCourse.code));
          if (!localCourse) continue;
          data.proposals.push({ id: request.id, remote: true, courseId: localCourse.id, semester: request.semester, lecturer: request.lecturer, role: request.teaching_role, day: request.day, start: request.starts_at.slice(0, 5), end: request.ends_at.slice(0, 5) });
          added += 1;
        }
        saveData(); renderAll();
        status.textContent = `נטענו ${added} בקשות חדשות. המערכת נשמרת בדפדפן זה.`;
      }
      sync.disabled = false;
    });
  }
}
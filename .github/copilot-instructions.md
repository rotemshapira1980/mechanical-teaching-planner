# Project Notes

- This is a static Hebrew RTL application. Open `index.html` directly; do not require a build tool or server unless the app architecture changes.
- Keep course catalog data user-supplied and verifiable. Do not invent Technion course records or point values. The UG catalog URL is `https://ug.technion.ac.il`.
- Store public teaching requests in Supabase with RLS restricted to the designated administrator for reading and catalog management. Keep scheduling state in browser localStorage until explicitly migrated.
- Course CSV headers are `courseCode,name,level,points`; preserve the supported Hebrew equivalents and levels.
- Keep the scheduling and lecturer point calculations in `app.js`, and preserve separate fall/winter and spring schedules.
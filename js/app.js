
const DATA_KEYS = ['users','courses','enrollments','lessons','attendance','assignments','submissions','grades','notices','learning-progress'];
const DATA_FILES = Object.fromEntries(DATA_KEYS.map(k => [k, `data/${k}.json`]));
const storeKey = k => `lms_edu_${k}`;
const authKey = 'lms_edu_current_user';
const state = { data: {}, page: 1, pageSize: 10, search: '' };
const page = document.body.dataset.page;
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const roleKo = { admin:'관리자', instructor:'강사', student:'수강생' };
const statusKo = { active:'활성', inactive:'비활성', open:'모집중', running:'진행중', closed:'종료', full:'마감', requested:'신청', approved:'승인', rejected:'반려', cancelled:'취소', published:'공개', draft:'초안', present:'출석', late:'지각', absent:'결석', excused:'공결', submitted:'제출', reviewed:'검토완료' };
const PUBLIC_PAGES = ['login','signup'];
const PAGE_ACCESS = {
  dashboard:['admin','instructor','student'],
  users:['admin'],
  courses:['admin','instructor'],
  'course-list':['student'],
  enrollments:['admin'],
  classroom:['student'],
  lessons:['admin','instructor','student'],
  attendance:['admin','instructor','student'],
  assignments:['admin','instructor','student'],
  grades:['admin','instructor','student'],
  progress:['admin','instructor','student'],
  notices:['admin','instructor','student'],
  profile:['admin','instructor','student']
};

async function initData(){
  for(const k of DATA_KEYS){
    const saved = localStorage.getItem(storeKey(k));
    if(saved){ state.data[k] = JSON.parse(saved); continue; }
    const res = await fetch(DATA_FILES[k]);
    state.data[k] = await res.json();
    localStorage.setItem(storeKey(k), JSON.stringify(state.data[k]));
  }
}
function save(k){ localStorage.setItem(storeKey(k), JSON.stringify(state.data[k])); }
function nextId(arr){ return arr.length ? Math.max(...arr.map(x => Number(x.id)||0)) + 1 : 1; }
function currentUser(){ const raw = localStorage.getItem(authKey); return raw ? JSON.parse(raw) : null; }
function canAccessPage(user, pageName=page){ if(PUBLIC_PAGES.includes(pageName)) return true; return !!user && (PAGE_ACCESS[pageName] || []).includes(user.role); }
function requireAuth(){
  if(PUBLIC_PAGES.includes(page)) return true;
  const u = currentUser();
  if(!u){ location.href='index.html'; return false; }
  if(!canAccessPage(u,page)){ accessDeniedView(); return false; }
  return true;
}
function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
function userById(id){ return state.data.users.find(u => Number(u.id) === Number(id)); }
function courseById(id){ return state.data.courses.find(c => Number(c.id) === Number(id)); }
function lessonById(id){ return state.data.lessons.find(l => Number(l.id) === Number(id)); }
function badgeClass(s){ return ['active','open','running','approved','published','present','submitted','reviewed'].includes(s)?'green':['inactive','rejected','absent','closed','cancelled'].includes(s)?'red':['requested','late','draft','full'].includes(s)?'yellow':'gray'; }
function imageAvatar(user,size=42){ const initials=(user?.name||'?').slice(0,1); return `<span class="avatar" style="width:${size}px;height:${size}px">${user?.photo?`<img src="${user.photo}" alt="${user.name}">`:initials}</span>`; }

function myCourseIds(user=currentUser()){
  if(!user) return [];
  if(user.role === 'admin') return state.data.courses.map(c => Number(c.id));
  if(user.role === 'instructor') return state.data.courses.filter(c => Number(c.instructorId) === Number(user.id)).map(c => Number(c.id));
  return state.data.enrollments.filter(e => Number(e.studentId) === Number(user.id) && ['requested','approved'].includes(e.status)).map(e => Number(e.courseId));
}
function approvedCourseIds(user=currentUser()){
  if(!user) return [];
  if(user.role === 'admin') return state.data.courses.map(c => Number(c.id));
  if(user.role === 'instructor') return myCourseIds(user);
  return state.data.enrollments.filter(e => Number(e.studentId) === Number(user.id) && e.status === 'approved').map(e => Number(e.courseId));
}
function isOwnCourse(courseId,user=currentUser()){ return myCourseIds(user).includes(Number(courseId)) || approvedCourseIds(user).includes(Number(courseId)); }
function canManageLearning(user=currentUser()){ return !!user && ['admin','instructor'].includes(user.role); }
function roleCourseOptions(){
  const u=currentUser(); let courses = state.data.courses;
  if(u?.role === 'instructor') courses = courses.filter(c => Number(c.instructorId) === Number(u.id));
  if(u?.role === 'student') courses = courses.filter(c => approvedCourseIds(u).includes(Number(c.id)));
  return courses.map(c => [c.id, c.title]);
}
function visibleNotices(){
  const u=currentUser(); const ids=approvedCourseIds(u); const own=myCourseIds(u);
  return state.data.notices.filter(n => !Number(n.targetCourseId) || u.role === 'admin' || ids.includes(Number(n.targetCourseId)) || own.includes(Number(n.targetCourseId)));
}
function accessDeniedView(){
  const u=currentUser(); const r = roleKo[u?.role] || '비로그인 사용자';
  $('#app').innerHTML = `<section class="auth-card"><div class="auth-logo">AUTH</div><h1>접근 권한 없음</h1><p>${r} 권한으로는 이 화면에 접근할 수 없습니다. 역할별 메뉴에서 허용된 화면을 이용하십시오.</p><button class="btn btn-primary" style="width:100%" onclick="location.href='dashboard.html'">대시보드로 이동</button></section>`;
}
function noPermission(){ toast('해당 작업 권한이 없습니다.'); }

function navItems(role){
  const common = [['dashboard.html','홈','대시보드'],['notices.html','공지','공지사항'],['profile.html','정보','내 정보']];
  const admin = [['users.html','사용자','사용자 관리'],['courses.html','강의','강의 관리'],['enrollments.html','신청','수강 신청 관리'],['progress.html','현황','학습 현황'],['attendance.html','출석','출석 현황'],['assignments.html','과제','과제 현황'],['grades.html','평가','평가 현황']];
  const instructor = [['courses.html','강의','내 강의'],['lessons.html','콘텐츠','콘텐츠 관리'],['attendance.html','출석','출석 관리'],['assignments.html','과제','과제 관리'],['grades.html','평가','평가 관리'],['progress.html','현황','수강생 현황']];
  const student = [['course-list.html','목록','강의 목록'],['classroom.html','강의실','내 강의실'],['lessons.html','콘텐츠','학습 콘텐츠'],['assignments.html','과제','과제 제출'],['attendance.html','출석','출석 현황'],['grades.html','평가','평가 결과'],['progress.html','현황','학습 현황']];
  const roleItems = role==='admin' ? admin : role==='instructor' ? instructor : student;
  return [common[0], ...roleItems, common[1], common[2]];
}
function shell(content){
  const u=currentUser(); if(!u){ location.href='index.html'; return; }
  const title=document.body.dataset.title||''; const desc=document.body.dataset.desc||''; const file=location.pathname.split('/').pop()||'dashboard.html';
  $('#app').innerHTML = `<div class="app"><aside class="sidebar"><div class="brand"><div class="brand-badge">LMS</div><div><strong>LMS Edu</strong><span>역할 기반 학습관리</span></div></div><nav class="nav">${navItems(u.role).map(([href,icon,label])=>`<a class="${href===file?'active':''}" href="${href}"><span class="icon">${icon}</span>${label}</a>`).join('')}</nav><div class="side-footer"><div class="user-mini">${imageAvatar(u)}<div><b>${u.name}</b><span>${roleKo[u.role]} · ${u.organization||''}</span></div></div><button class="btn btn-light" style="width:100%;margin-top:12px" data-logout>로그아웃</button></div></aside><main class="main"><header class="topbar"><div class="page-title"><h1>${title}</h1><p>${desc}</p></div><div class="top-actions"><div class="search-pill"><span>검색</span><input id="globalSearch" placeholder="현재 화면 검색"></div></div></header>${content}</main></div>`;
  $('[data-logout]').onclick = () => { localStorage.removeItem(authKey); location.href='index.html'; };
  const gs=$('#globalSearch'); if(gs){ gs.value=state.search; gs.oninput=e=>{ state.search=e.target.value.trim().toLowerCase(); state.page=1; renderPage(); }; }
}
function toolbar(buttons){ return `<div class="toolbar"><div class="filters"><button class="btn btn-light" data-reset>초기화</button></div><div class="top-actions">${buttons}</div></div>`; }
function resetAll(){ if(confirm('localStorage 데이터를 삭제하고 JSON 원본 데이터로 복구할까요?')){ DATA_KEYS.forEach(k=>localStorage.removeItem(storeKey(k))); location.reload(); } }
function csvDownload(name, rows){
  if(!rows.length){ toast('다운로드할 데이터가 없습니다.'); return; }
  const headers=Object.keys(rows[0]);
  const csv=[headers.join(',')].concat(rows.map(r=>headers.map(h=>`"${String(r[h]??'').replaceAll('"','""')}"`).join(','))).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href);
}
function filterRows(rows, keys){ if(!state.search) return rows; return rows.filter(r => keys.some(k => String(r[k] ?? '').toLowerCase().includes(state.search))); }
function paginate(rows, renderRow, columns){
  const total=rows.length; const pages=Math.max(1, Math.ceil(total/state.pageSize)); if(state.page>pages) state.page=pages;
  const start=(state.page-1)*state.pageSize; const view=rows.slice(start,start+state.pageSize);
  return `<div class="card"><div class="table-wrap"><table class="table"><thead><tr>${columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${view.length?view.map(renderRow).join(''):`<tr><td colspan="${columns.length}" class="empty">데이터가 없습니다.</td></tr>`}</tbody></table></div><div class="pagination-row"><div></div><div class="pagination-center"><button class="page-btn" data-page-move="prev" ${state.page===1?'disabled':''}>‹</button>${Array.from({length:pages},(_,i)=>i+1).filter(n=>n===1||n===pages||Math.abs(n-state.page)<=2).map((n,i,arr)=>`${i>0&&n-arr[i-1]>1?'<span class="muted">...</span>':''}<button class="page-btn ${n===state.page?'active':''}" data-page-num="${n}">${n}</button>`).join('')}<button class="page-btn" data-page-move="next" ${state.page===pages?'disabled':''}>›</button></div><div class="page-size"><span>총 ${total}건</span><select class="select" style="width:84px" id="pageSize"><option ${state.pageSize===10?'selected':''}>10</option><option ${state.pageSize===20?'selected':''}>20</option><option ${state.pageSize===30?'selected':''}>30</option></select></div></div></div>`;
}
function bindPagination(){
  $$('[data-page-num]').forEach(b=>b.onclick=()=>{ state.page=Number(b.dataset.pageNum); renderPage(); });
  $$('[data-page-move]').forEach(b=>b.onclick=()=>{ state.page += b.dataset.pageMove==='next'?1:-1; renderPage(); });
  const ps=$('#pageSize'); if(ps) ps.onchange=e=>{ state.pageSize=Number(e.target.value); state.page=1; renderPage(); };
}
function normalizeFields(fields){ return fields.map(f => ({...f, options: typeof f.options === 'function' ? f.options() : f.options})); }
function fieldHtml(f, initial){
  const val=initial[f.name] ?? f.default ?? ''; const full=f.full?' form-full':'';
  if(f.type==='select') return `<div class="form-row${full}"><label>${f.label}</label><select class="select" name="${f.name}">${f.options.map(([v,t])=>`<option value="${v}" ${String(val)===String(v)?'selected':''}>${t}</option>`).join('')}</select></div>`;
  if(f.type==='textarea') return `<div class="form-row${full}"><label>${f.label}</label><textarea class="textarea" name="${f.name}">${val}</textarea></div>`;
  if(f.type==='file') return `<div class="form-row${full}"><label>${f.label}</label><div class="photo-cell"><div class="photo-preview" id="photoPreview">${val?`<img src="${val}">`:'사진'}</div><input class="input" type="file" accept="image/*"><input type="hidden" id="photoData" name="${f.name}" value="${val}"></div></div>`;
  if(f.type==='checkbox') return `<div class="form-row${full}"><label><input type="checkbox" name="${f.name}" ${val?'checked':''}> ${f.label}</label></div>`;
  return `<div class="form-row${full}"><label>${f.label}</label><input class="input" name="${f.name}" type="${f.type||'text'}" value="${val}"></div>`;
}
function openModal(title, fields, initial, onSave){
  const root=$('#modalRoot');
  root.innerHTML = `<div class="modal"><div class="modal-head"><h2>${title}</h2><button class="btn btn-light" data-close>닫기</button></div><form id="modalForm"><div class="modal-body"><div class="form-2">${fields.map(f=>fieldHtml(f, initial)).join('')}</div></div><div class="modal-foot"><button type="button" class="btn btn-light" data-close>취소</button><button class="btn btn-primary">저장</button></div></form></div>`;
  root.classList.add('open'); $$('[data-close]',root).forEach(b=>b.onclick=()=>root.classList.remove('open'));
  const photo=$('input[type=file]',root); if(photo){ photo.onchange=e=>{ const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ $('#photoData').value=reader.result; $('#photoPreview').innerHTML=`<img src="${reader.result}">`; }; reader.readAsDataURL(file); }; }
  $('#modalForm').onsubmit=e=>{ e.preventDefault(); const fd=new FormData(e.target); const obj={...initial}; fields.forEach(f=>{ if(f.type==='file') obj[f.name]=$('#photoData')?.value||initial[f.name]||''; else if(f.type==='number') obj[f.name]=Number(fd.get(f.name)||0); else if(f.type==='checkbox') obj[f.name]=fd.get(f.name)==='on'; else obj[f.name]=fd.get(f.name)||''; }); onSave(obj); root.classList.remove('open'); };
}

function renderLogin(){
  $('#app').innerHTML = `<section class="auth-card"><div class="auth-logo">LMS</div><h1>LMS 교육용 플랫폼</h1><p>관리자, 강사, 수강생 역할에 따라 접근 가능한 페이지가 분리됩니다.</p><form id="loginForm" class="form-grid"><div class="form-row"><label>이메일</label><input class="input" name="email" value="admin@lms.com"></div><div class="form-row"><label>비밀번호</label><input class="input" name="password" type="password" value="1234"></div><button class="btn btn-primary" style="width:100%">로그인</button></form><div class="auth-links"><a href="signup.html">회원가입</a></div><div class="sample-box"><b>샘플 계정</b><br>관리자 admin@lms.com / 1234<br>강사 instructor@lms.com / 1234<br>수강생 student@lms.com / 1234</div></section>`;
  $('#loginForm').onsubmit=e=>{ e.preventDefault(); const fd=new FormData(e.target); const u=state.data.users.find(x=>x.email===fd.get('email')&&x.password===fd.get('password')&&x.status==='active'); if(!u){ toast('로그인 정보가 올바르지 않습니다.'); return; } localStorage.setItem(authKey,JSON.stringify(u)); location.href='dashboard.html'; };
}
function renderSignup(){
  $('#app').innerHTML = `<section class="auth-card"><div class="auth-logo">JOIN</div><h1>회원가입</h1><p>가입 시 선택한 역할에 따라 접근 가능한 화면이 달라집니다.</p><form id="signupForm" class="form-grid"><div class="form-row"><label>이름</label><input class="input" name="name" required></div><div class="form-row"><label>이메일</label><input class="input" name="email" type="email" required></div><div class="form-row"><label>비밀번호</label><input class="input" name="password" type="password" required></div><div class="form-row"><label>역할</label><select class="select" name="role"><option value="student">수강생</option><option value="instructor">강사</option><option value="admin">관리자</option></select></div><div class="form-row"><label>소속</label><input class="input" name="organization" value="교육생"></div><div class="form-row"><label>프로필 사진</label><div class="photo-cell"><div class="photo-preview" id="signupPreview">사진</div><input class="input" id="signupPhoto" type="file" accept="image/*"></div></div><button class="btn btn-primary" style="width:100%">가입하기</button></form><div class="auth-links"><a href="index.html">로그인으로 이동</a></div></section>`;
  let photo=''; $('#signupPhoto').onchange=e=>{ const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ photo=reader.result; $('#signupPreview').innerHTML=`<img src="${photo}">`; }; reader.readAsDataURL(file); };
  $('#signupForm').onsubmit=e=>{ e.preventDefault(); const fd=new FormData(e.target); if(state.data.users.some(u=>u.email===fd.get('email'))){ toast('이미 등록된 이메일입니다.'); return; } const u={id:nextId(state.data.users),name:fd.get('name'),email:fd.get('email'),password:fd.get('password'),role:fd.get('role'),phone:'',organization:fd.get('organization'),status:'active',photo,createdAt:new Date().toISOString().slice(0,10)}; state.data.users.push(u); save('users'); localStorage.setItem(authKey,JSON.stringify(u)); location.href='dashboard.html'; };
}

function renderDashboard(){
  const u=currentUser(); const ids=myCourseIds(u), approved=approvedCourseIds(u);
  const enroll=state.data.enrollments.filter(e => u.role==='admin'||ids.includes(Number(e.courseId))||Number(e.studentId)===Number(u.id));
  const submissions=state.data.submissions.filter(s => u.role!=='student'||Number(s.studentId)===Number(u.id));
  const cards = u.role==='admin'
    ? [['전체 사용자',state.data.users.length,'시스템 등록 사용자'],['전체 강의',state.data.courses.length,'모집중·진행중 포함'],['수강 신청',state.data.enrollments.length,'승인/반려 전체'],['공지사항',state.data.notices.length,'전체 공지 포함']]
    : u.role==='instructor'
    ? [['내 강의',ids.length,'담당 강의'],['담당 수강 신청',enroll.length,'담당 강의 기준'],['콘텐츠',state.data.lessons.filter(l=>ids.includes(Number(l.courseId))).length,'담당 강의 콘텐츠'],['제출 과제',submissions.length,'담당 강의 제출']]
    : [['수강 신청',enroll.length,'내 신청 내역'],['승인 강의',approved.length,'내 강의실 표시'],['학습 콘텐츠',state.data.lessons.filter(l=>approved.includes(Number(l.courseId))&&l.status==='published').length,'공개 콘텐츠'],['제출 과제',submissions.length,'내 제출 내역']];
  const recent=enroll.slice(-8).reverse(); const notices=visibleNotices().slice(-6).reverse();
  shell(`<div class="stats">${cards.map(c=>`<div class="stat"><div class="label">${c[0]}</div><div class="value">${c[1]}</div><div class="hint">${c[2]}</div></div>`).join('')}</div><div class="grid-2"><section class="card"><div class="section-head"><h2>최근 수강 신청</h2>${u.role==='admin'?`<button class="btn btn-small btn-light" onclick="location.href='enrollments.html'">관리</button>`:''}</div><div class="table-wrap"><table class="table"><thead><tr><th>신청자</th><th>강의</th><th>상태</th><th>신청일</th></tr></thead><tbody>${recent.map(e=>`<tr><td>${userById(e.studentId)?.name||'-'}</td><td>${courseById(e.courseId)?.title||'-'}</td><td><span class="badge ${badgeClass(e.status)}">${statusKo[e.status]}</span></td><td>${e.enrolledAt}</td></tr>`).join('') || `<tr><td colspan="4" class="empty">표시할 신청 내역이 없습니다.</td></tr>`}</tbody></table></div></section><section class="card"><div class="section-head"><h2>최근 공지사항</h2><button class="btn btn-small btn-light" onclick="location.href='notices.html'">보기</button></div>${notices.map(n=>`<div class="notice-item"><b>${n.important?'중요 ':''}${n.title}</b><span class="muted">${n.type} · ${n.createdAt}</span></div>`).join('')||'<div class="notice-item muted">표시할 공지사항이 없습니다.</div>'}</section></div>`);
}

const userFields=[{name:'photo',label:'프로필 사진',type:'file',full:true},{name:'name',label:'이름'},{name:'email',label:'이메일',type:'email'},{name:'password',label:'비밀번호'},{name:'role',label:'역할',type:'select',options:[['admin','관리자'],['instructor','강사'],['student','수강생']]},{name:'phone',label:'전화번호'},{name:'organization',label:'소속'},{name:'status',label:'상태',type:'select',options:[['active','활성'],['inactive','비활성']]}];
function renderUsers(){
  let rows=filterRows(state.data.users,['name','email','organization','role','status']);
  shell(toolbar(`<button class="btn btn-primary" id="addUser">사용자 등록</button><button class="btn btn-green" id="downCsv">CSV 다운로드</button>`)+paginate(rows,u=>`<tr><td><div class="photo-cell">${imageAvatar(u,36)}<b>${u.name}</b></div></td><td>${u.email}</td><td>${roleKo[u.role]}</td><td>${u.organization||'-'}</td><td>${u.phone||'-'}</td><td><span class="badge ${badgeClass(u.status)}">${statusKo[u.status]}</span></td><td>${u.createdAt}</td><td class="actions"><button class="btn btn-small btn-light" data-edit="${u.id}">수정</button><button class="btn btn-small btn-danger" data-del="${u.id}">삭제</button></td></tr>`,['사용자','이메일','역할','소속','전화번호','상태','가입일','작업']));
  bindPagination(); $('#addUser').onclick=()=>openModal('사용자 등록',userFields,{role:'student',status:'active'},obj=>{ obj.id=nextId(state.data.users); obj.createdAt=new Date().toISOString().slice(0,10); state.data.users.push(obj); save('users'); renderPage(); });
  $('#downCsv').onclick=()=>csvDownload('users.csv',rows); $('[data-reset]').onclick=resetAll;
  $$('[data-edit]').forEach(b=>b.onclick=()=>{ const u=state.data.users.find(x=>x.id==b.dataset.edit); openModal('사용자 수정',userFields,u,obj=>{ Object.assign(u,obj); save('users'); const cu=currentUser(); if(cu.id===u.id) localStorage.setItem(authKey,JSON.stringify(u)); renderPage(); }); });
  $$('[data-del]').forEach(b=>b.onclick=()=>{ if(confirm('삭제할까요?')){ state.data.users=state.data.users.filter(x=>x.id!=b.dataset.del); save('users'); renderPage(); } });
}

const courseFields=[{name:'courseCode',label:'강의코드'},{name:'title',label:'강의명'},{name:'category',label:'카테고리'},{name:'instructorId',label:'강사',type:'select',options:()=>state.data.users.filter(u=>u.role==='instructor').map(u=>[u.id,u.name])},{name:'capacity',label:'정원',type:'number'},{name:'startDate',label:'시작일',type:'date'},{name:'endDate',label:'종료일',type:'date'},{name:'status',label:'상태',type:'select',options:[['open','모집중'],['running','진행중'],['closed','종료'],['full','마감']]},{name:'description',label:'강의 설명',type:'textarea',full:true}];
function renderCourses(){
  const u=currentUser(); const manage=u.role==='admin'; const ids=myCourseIds(u);
  let rows=state.data.courses.filter(c=>manage||ids.includes(Number(c.id))).map(c=>({...c,instructor:userById(c.instructorId)?.name||'-'}));
  rows=filterRows(rows,['courseCode','title','category','instructor','status']);
  const add=manage?`<button class="btn btn-primary" id="addCourse">강의 등록</button>`:'';
  shell(toolbar(`${add}<button class="btn btn-green" id="downCsv">CSV 다운로드</button>`)+paginate(rows,c=>`<tr><td>${c.courseCode}</td><td>${c.title}</td><td>${c.category}</td><td>${c.instructor}</td><td>${c.capacity}</td><td>${state.data.enrollments.filter(e=>e.courseId===c.id&&e.status==='approved').length}</td><td>${c.startDate}</td><td>${c.endDate}</td><td><span class="badge ${badgeClass(c.status)}">${statusKo[c.status]}</span></td><td class="actions">${manage?`<button class="btn btn-small btn-light" data-edit="${c.id}">수정</button><button class="btn btn-small btn-danger" data-del="${c.id}">삭제</button>`:`<button class="btn btn-small btn-light" data-view="${c.id}">조회</button>`}</td></tr>`,['강의코드','강의명','카테고리','강사','정원','수강인원','시작일','종료일','상태','작업']));
  bindPagination(); $('#downCsv').onclick=()=>csvDownload('courses.csv',rows); $('[data-reset]').onclick=resetAll;
  if(manage){
    $('#addCourse').onclick=()=>openModal('강의 등록',normalizeFields(courseFields),{status:'open',capacity:30},obj=>{ obj.id=nextId(state.data.courses); obj.instructorId=Number(obj.instructorId); state.data.courses.push(obj); save('courses'); renderPage(); });
    $$('[data-edit]').forEach(b=>b.onclick=()=>{ const c=state.data.courses.find(x=>x.id==b.dataset.edit); openModal('강의 수정',normalizeFields(courseFields),c,obj=>{ obj.instructorId=Number(obj.instructorId); Object.assign(c,obj); save('courses'); renderPage(); }); });
    $$('[data-del]').forEach(b=>b.onclick=()=>{ if(confirm('삭제할까요?')){ state.data.courses=state.data.courses.filter(x=>x.id!=b.dataset.del); save('courses'); renderPage(); } });
  }
  $$('[data-view]').forEach(b=>b.onclick=()=>toast('강사는 본인 담당 강의만 조회할 수 있습니다.'));
}
function renderCourseList(){
  const u=currentUser(); let rows=filterRows(state.data.courses,['courseCode','title','category','status','description']);
  shell(`<div class="course-card-grid">${rows.map(c=>{ const ins=userById(c.instructorId); const already=state.data.enrollments.find(e=>e.courseId===c.id&&e.studentId===u.id); return `<div class="card course-card"><span class="badge ${badgeClass(c.status)}">${statusKo[c.status]}</span><h3>${c.title}</h3><div class="course-meta">${c.courseCode} · ${c.category}<br>강사: ${ins?.name||'-'}<br>기간: ${c.startDate} ~ ${c.endDate}<br>정원: ${c.capacity}명</div><p class="muted">${c.description||''}</p><button class="btn ${already?'btn-light':'btn-primary'}" data-apply="${c.id}" ${already?'disabled':''}>${already?statusKo[already.status]:'수강 신청'}</button></div>`; }).join('')}</div>`);
  $$('[data-apply]').forEach(b=>b.onclick=()=>{ state.data.enrollments.push({id:nextId(state.data.enrollments),courseId:Number(b.dataset.apply),studentId:u.id,status:'requested',enrolledAt:new Date().toISOString().slice(0,10)}); save('enrollments'); toast('수강 신청이 등록되었습니다.'); renderPage(); });
}
function renderEnrollments(){
  let rows=state.data.enrollments.map(e=>({...e,student:userById(e.studentId)?.name||'-',course:courseById(e.courseId)?.title||'-'})); rows=filterRows(rows,['student','course','status','enrolledAt']);
  shell(toolbar(`<button class="btn btn-green" id="downCsv">CSV 다운로드</button>`)+paginate(rows,e=>`<tr><td>${e.student}</td><td>${e.course}</td><td>${e.enrolledAt}</td><td><span class="badge ${badgeClass(e.status)}">${statusKo[e.status]}</span></td><td class="actions"><button class="btn btn-small btn-green" data-status="approved" data-id="${e.id}">승인</button><button class="btn btn-small btn-danger" data-status="rejected" data-id="${e.id}">반려</button><button class="btn btn-small btn-light" data-status="cancelled" data-id="${e.id}">취소</button></td></tr>`,['신청자','강의명','신청일','상태','작업']));
  bindPagination(); $('#downCsv').onclick=()=>csvDownload('enrollments.csv',rows); $('[data-reset]').onclick=resetAll; $$('[data-status]').forEach(b=>b.onclick=()=>{ const e=state.data.enrollments.find(x=>x.id==b.dataset.id); e.status=b.dataset.status; save('enrollments'); renderPage(); });
}
function renderClassroom(){
  const u=currentUser(); const approved=state.data.enrollments.filter(e=>e.studentId===u.id&&e.status==='approved');
  shell(`<div class="classroom-grid">${approved.map(e=>{ const c=courseById(e.courseId); const p=state.data['learning-progress'].find(x=>x.courseId===e.courseId&&x.studentId===u.id); return `<div class="card course-card"><span class="badge blue">수강중</span><h3>${c?.title}</h3><div class="course-meta">강사: ${userById(c?.instructorId)?.name||'-'}<br>기간: ${c?.startDate} ~ ${c?.endDate}</div><div style="margin:14px 0"><div class="progress"><span style="width:${p?.progressRate||0}%"></span></div><div class="muted" style="margin-top:6px">진도율 ${p?.progressRate||0}%</div></div><button class="btn btn-primary" onclick="location.href='lessons.html'">강의실 입장</button></div>`; }).join('')||'<div class="card empty">승인된 강의가 없습니다.</div>'}</div>`);
}

const lessonFields=[{name:'courseId',label:'강의',type:'select',options:()=>roleCourseOptions()},{name:'order',label:'차시',type:'number'},{name:'title',label:'콘텐츠 제목'},{name:'contentType',label:'유형',type:'select',options:[['video','영상'],['document','문서'],['practice','실습자료'],['quiz','퀴즈'],['link','링크']]},{name:'duration',label:'학습시간',type:'number'},{name:'status',label:'공개상태',type:'select',options:[['published','공개'],['draft','초안']]}];
function renderLessons(){
  const u=currentUser(); const manage=canManageLearning(u); const ids=u.role==='student'?approvedCourseIds(u):myCourseIds(u);
  let rows=state.data.lessons.filter(l=>ids.includes(Number(l.courseId)) && (manage || l.status==='published')).map(l=>({...l,course:courseById(l.courseId)?.title||'-'})); rows=filterRows(rows,['title','course','contentType','status']);
  const add=manage?`<button class="btn btn-primary" id="addLesson">콘텐츠 등록</button>`:'';
  shell(toolbar(`${add}<button class="btn btn-green" id="downCsv">CSV 다운로드</button>`)+paginate(rows,l=>`<tr><td>${l.order}</td><td>${l.course}</td><td>${l.title}</td><td>${l.contentType}</td><td>${l.duration}분</td><td><span class="badge ${badgeClass(l.status)}">${statusKo[l.status]}</span></td><td class="actions">${manage?`<button class="btn btn-small btn-light" data-edit="${l.id}">수정</button><button class="btn btn-small btn-danger" data-del="${l.id}">삭제</button>`:`<button class="btn btn-small btn-light" data-study="${l.id}">학습</button>`}</td></tr>`,['차시','강의명','콘텐츠 제목','유형','학습시간','공개상태','작업']));
  bindPagination(); $('#downCsv').onclick=()=>csvDownload('lessons.csv',rows); $('[data-reset]').onclick=resetAll;
  if(manage){
    $('#addLesson').onclick=()=>openModal('콘텐츠 등록',normalizeFields(lessonFields),{status:'published',duration:25,order:1},obj=>{ obj.id=nextId(state.data.lessons); obj.courseId=Number(obj.courseId); if(!isOwnCourse(obj.courseId,u)){ toast('담당 강의에만 등록할 수 있습니다.'); return; } state.data.lessons.push(obj); save('lessons'); renderPage(); });
    $$('[data-edit]').forEach(b=>b.onclick=()=>{ const l=state.data.lessons.find(x=>x.id==b.dataset.edit); if(!isOwnCourse(l.courseId,u)){ noPermission(); return; } openModal('콘텐츠 수정',normalizeFields(lessonFields),l,obj=>{ obj.courseId=Number(obj.courseId); if(!isOwnCourse(obj.courseId,u)){ toast('담당 강의만 선택할 수 있습니다.'); return; } Object.assign(l,obj); save('lessons'); renderPage(); }); });
    $$('[data-del]').forEach(b=>b.onclick=()=>{ const l=state.data.lessons.find(x=>x.id==b.dataset.del); if(!isOwnCourse(l.courseId,u)){ noPermission(); return; } if(confirm('삭제할까요?')){ state.data.lessons=state.data.lessons.filter(x=>x.id!=b.dataset.del); save('lessons'); renderPage(); } });
  } else {
    $$('[data-study]').forEach(b=>b.onclick=()=>{ const l=state.data.lessons.find(x=>x.id==b.dataset.study); let p=state.data['learning-progress'].find(x=>Number(x.courseId)===Number(l.courseId)&&Number(x.studentId)===Number(u.id)); if(!p){ p={id:nextId(state.data['learning-progress']),courseId:l.courseId,studentId:u.id,lastLessonId:l.id,progressRate:0,updatedAt:new Date().toISOString().slice(0,10)}; state.data['learning-progress'].push(p); } p.lastLessonId=l.id; p.progressRate=Math.min(100,Number(p.progressRate||0)+5); p.updatedAt=new Date().toISOString().slice(0,10); save('learning-progress'); toast('학습 이력이 반영되었습니다.'); renderPage(); });
  }
}
function renderAttendance(){
  const u=currentUser(); const manage=canManageLearning(u); const ids=u.role==='student'?approvedCourseIds(u):myCourseIds(u);
  let rows=state.data.attendance.filter(a=>ids.includes(Number(a.courseId)) && (u.role!=='student'||Number(a.studentId)===Number(u.id))).map(a=>({...a,student:userById(a.studentId)?.name||'-',course:courseById(a.courseId)?.title||'-',lesson:lessonById(a.lessonId)?.title||'-'})); rows=filterRows(rows,['student','course','lesson','status','attendedAt']);
  shell(toolbar(`<button class="btn btn-green" id="downCsv">CSV 다운로드</button>`)+paginate(rows,a=>`<tr><td>${a.course}</td><td>${a.lesson}</td><td>${a.student}</td><td>${a.attendedAt}</td><td><span class="badge ${badgeClass(a.status)}">${statusKo[a.status]}</span></td>${manage?`<td class="actions">${['present','late','absent','excused'].map(s=>`<button class="btn btn-small btn-light" data-id="${a.id}" data-status="${s}">${statusKo[s]}</button>`).join('')}</td>`:''}</tr>`,manage?['강의','차시','수강생','일자','상태','상태변경']:['강의','차시','수강생','일자','상태']));
  bindPagination(); $('#downCsv').onclick=()=>csvDownload('attendance.csv',rows); $('[data-reset]').onclick=resetAll;
  if(manage){ $$('[data-status]').forEach(b=>b.onclick=()=>{ const a=state.data.attendance.find(x=>x.id==b.dataset.id); if(!isOwnCourse(a.courseId,u)){ noPermission(); return; } a.status=b.dataset.status; save('attendance'); renderPage(); }); }
}

const assignmentFields=[{name:'courseId',label:'강의',type:'select',options:()=>roleCourseOptions()},{name:'title',label:'과제명'},{name:'dueDate',label:'마감일',type:'date'},{name:'score',label:'배점',type:'number'},{name:'status',label:'상태',type:'select',options:[['open','진행중'],['closed','마감']]}];
function renderAssignments(){
  const u=currentUser(); const manage=canManageLearning(u); const ids=u.role==='student'?approvedCourseIds(u):myCourseIds(u);
  let rows=state.data.assignments.filter(a=>ids.includes(Number(a.courseId))).map(a=>({...a,course:courseById(a.courseId)?.title||'-',submitted:state.data.submissions.filter(s=>s.assignmentId===a.id).length,already:state.data.submissions.find(s=>Number(s.assignmentId)===Number(a.id)&&Number(s.studentId)===Number(u.id))})); rows=filterRows(rows,['title','course','status','dueDate']);
  const add=manage?`<button class="btn btn-primary" id="addAssignment">과제 등록</button>`:'';
  shell(toolbar(`${add}<button class="btn btn-green" id="downCsv">CSV 다운로드</button>`)+paginate(rows,a=>`<tr><td>${a.course}</td><td>${a.title}</td><td>${a.dueDate}</td><td>${a.score}</td><td>${a.submitted}</td><td><span class="badge ${badgeClass(a.status)}">${a.status==='open'?'진행중':'마감'}</span></td><td class="actions">${u.role==='student'?`<button class="btn btn-small ${a.already?'btn-light':'btn-primary'}" data-submit="${a.id}" ${a.already?'disabled':''}>${a.already?'제출완료':'제출'}</button>`:`<button class="btn btn-small btn-light" data-edit="${a.id}">수정</button><button class="btn btn-small btn-danger" data-del="${a.id}">삭제</button>`}</td></tr>`,['강의','과제명','마감일','배점','제출수','상태','작업']));
  bindPagination(); $('#downCsv').onclick=()=>csvDownload('assignments.csv',rows); $('[data-reset]').onclick=resetAll;
  if(manage){
    $('#addAssignment').onclick=()=>openModal('과제 등록',normalizeFields(assignmentFields),{score:100,status:'open'},obj=>{ obj.id=nextId(state.data.assignments); obj.courseId=Number(obj.courseId); if(!isOwnCourse(obj.courseId,u)){ toast('담당 강의에만 과제를 등록할 수 있습니다.'); return; } state.data.assignments.push(obj); save('assignments'); renderPage(); });
    $$('[data-edit]').forEach(b=>b.onclick=()=>{ const a=state.data.assignments.find(x=>x.id==b.dataset.edit); if(!isOwnCourse(a.courseId,u)){ noPermission(); return; } openModal('과제 수정',normalizeFields(assignmentFields),a,obj=>{ obj.courseId=Number(obj.courseId); if(!isOwnCourse(obj.courseId,u)){ toast('담당 강의만 선택할 수 있습니다.'); return; } Object.assign(a,obj); save('assignments'); renderPage(); }); });
    $$('[data-del]').forEach(b=>b.onclick=()=>{ const a=state.data.assignments.find(x=>x.id==b.dataset.del); if(!isOwnCourse(a.courseId,u)){ noPermission(); return; } if(confirm('삭제할까요?')){ state.data.assignments=state.data.assignments.filter(x=>x.id!=b.dataset.del); save('assignments'); renderPage(); } });
  } else {
    $$('[data-submit]').forEach(b=>b.onclick=()=>openModal('과제 제출',[{name:'content',label:'제출 내용',type:'textarea',full:true}],{},obj=>{ state.data.submissions.push({id:nextId(state.data.submissions),assignmentId:Number(b.dataset.submit),studentId:u.id,content:obj.content,submittedAt:new Date().toISOString().slice(0,10),status:'submitted',feedback:''}); save('submissions'); renderPage(); }));
  }
}
function renderGrades(){
  const u=currentUser(); const manage=canManageLearning(u); const ids=u.role==='student'?approvedCourseIds(u):myCourseIds(u);
  let rows=state.data.grades.filter(g=>ids.includes(Number(g.courseId)) && (u.role!=='student'||Number(g.studentId)===Number(u.id))).map(g=>({...g,student:userById(g.studentId)?.name||'-',course:courseById(g.courseId)?.title||'-'})); rows=filterRows(rows,['student','course','grade']);
  shell(toolbar(`<button class="btn btn-green" id="downCsv">CSV 다운로드</button>`)+paginate(rows,g=>`<tr><td>${g.course}</td><td>${g.student}</td><td>${g.attendanceScore}</td><td>${g.assignmentScore}</td><td>${g.examScore}</td><td><b>${g.finalScore}</b></td><td><span class="badge blue">${g.grade}</span></td>${manage?`<td><button class="btn btn-small btn-light" data-edit="${g.id}">수정</button></td>`:''}</tr>`,manage?['강의','수강생','출석','과제','시험','최종','등급','작업']:['강의','수강생','출석','과제','시험','최종','등급']));
  bindPagination(); $('#downCsv').onclick=()=>csvDownload('grades.csv',rows); $('[data-reset]').onclick=resetAll;
  if(manage){ $$('[data-edit]').forEach(b=>b.onclick=()=>{ const g=state.data.grades.find(x=>x.id==b.dataset.edit); if(!isOwnCourse(g.courseId,u)){ noPermission(); return; } openModal('점수 수정',[{name:'attendanceScore',label:'출석 점수',type:'number'},{name:'assignmentScore',label:'과제 점수',type:'number'},{name:'examScore',label:'시험 점수',type:'number'}],g,obj=>{ Object.assign(g,obj); g.finalScore=Math.round(g.assignmentScore*.35+g.attendanceScore*.25+g.examScore*.4); g.grade=g.finalScore>=95?'A+':g.finalScore>=90?'A':g.finalScore>=85?'B+':g.finalScore>=80?'B':g.finalScore>=75?'C+':g.finalScore>=70?'C':'F'; save('grades'); renderPage(); }); }); }
}
function renderProgress(){
  const u=currentUser(); const ids=u.role==='student'?approvedCourseIds(u):myCourseIds(u);
  let rows=state.data['learning-progress'].filter(p=>ids.includes(Number(p.courseId)) && (u.role!=='student'||Number(p.studentId)===Number(u.id))).map(p=>({...p,student:userById(p.studentId)?.name||'-',course:courseById(p.courseId)?.title||'-',last:lessonById(p.lastLessonId)?.title||'-'})); rows=filterRows(rows,['student','course','last']);
  shell(toolbar(`<button class="btn btn-green" id="downCsv">CSV 다운로드</button>`)+paginate(rows,p=>`<tr><td>${p.course}</td><td>${p.student}</td><td><div class="progress"><span style="width:${p.progressRate}%"></span></div></td><td>${p.progressRate}%</td><td>${p.last}</td><td>${p.updatedAt}</td></tr>`,['강의','수강생','진도','진도율','마지막 학습','갱신일']));
  bindPagination(); $('#downCsv').onclick=()=>csvDownload('learning-progress.csv',rows); $('[data-reset]').onclick=resetAll;
}
const noticeFields=[{name:'title',label:'제목'},{name:'type',label:'유형',type:'select',options:[['전체공지','전체공지'],['강의공지','강의공지'],['과제공지','과제공지'],['시험공지','시험공지'],['시스템공지','시스템공지']]},{name:'targetCourseId',label:'대상 강의',type:'select',options:()=>[[0,'전체'],...roleCourseOptions()]},{name:'important',label:'중요 공지',type:'checkbox'},{name:'content',label:'내용',type:'textarea',full:true}];
function renderNotices(){
  const u=currentUser(); const manage=canManageLearning(u);
  let rows=visibleNotices().map(n=>({...n,writer:userById(n.writerId)?.name||'-',course:n.targetCourseId?courseById(n.targetCourseId)?.title:'전체'})); rows=filterRows(rows,['title','type','writer','content','course']);
  const add=manage?`<button class="btn btn-primary" id="addNotice">공지 등록</button>`:'';
  shell(toolbar(`${add}<button class="btn btn-green" id="downCsv">CSV 다운로드</button>`)+paginate(rows,n=>`<tr><td>${n.important?'중요 ':''}${n.title}</td><td>${n.type}</td><td>${n.course}</td><td>${n.writer}</td><td>${n.createdAt}</td><td class="actions">${manage?`<button class="btn btn-small btn-light" data-edit="${n.id}">수정</button><button class="btn btn-small btn-danger" data-del="${n.id}">삭제</button>`:`<button class="btn btn-small btn-light" data-view="${n.id}">조회</button>`}</td></tr>`,['제목','유형','대상','작성자','작성일','작업']));
  bindPagination(); $('#downCsv').onclick=()=>csvDownload('notices.csv',rows); $('[data-reset]').onclick=resetAll;
  if(manage){
    $('#addNotice').onclick=()=>openModal('공지 등록',normalizeFields(noticeFields),{type:'전체공지',targetCourseId:0,important:false},obj=>{ obj.id=nextId(state.data.notices); obj.writerId=u.id; obj.targetCourseId=Number(obj.targetCourseId); if(obj.targetCourseId && !isOwnCourse(obj.targetCourseId,u)){ toast('담당 강의에만 공지를 등록할 수 있습니다.'); return; } obj.createdAt=new Date().toISOString().slice(0,10); state.data.notices.push(obj); save('notices'); renderPage(); });
    $$('[data-edit]').forEach(b=>b.onclick=()=>{ const n=state.data.notices.find(x=>x.id==b.dataset.edit); if(n.targetCourseId && !isOwnCourse(n.targetCourseId,u)){ noPermission(); return; } openModal('공지 수정',normalizeFields(noticeFields),n,obj=>{ obj.targetCourseId=Number(obj.targetCourseId); if(obj.targetCourseId && !isOwnCourse(obj.targetCourseId,u)){ toast('담당 강의만 선택할 수 있습니다.'); return; } Object.assign(n,obj); save('notices'); renderPage(); }); });
    $$('[data-del]').forEach(b=>b.onclick=()=>{ const n=state.data.notices.find(x=>x.id==b.dataset.del); if(n.targetCourseId && !isOwnCourse(n.targetCourseId,u)){ noPermission(); return; } if(confirm('삭제할까요?')){ state.data.notices=state.data.notices.filter(x=>x.id!=b.dataset.del); save('notices'); renderPage(); } });
  }
  $$('[data-view]').forEach(b=>b.onclick=()=>{ const n=state.data.notices.find(x=>x.id==b.dataset.view); openModal('공지 상세',[{name:'content',label:n.title,type:'textarea',full:true}],{content:n.content},()=>{}); });
}
function renderProfile(){
  const u=state.data.users.find(x=>x.id===currentUser().id);
  shell(`<section class="card card-pad"><h2>프로필 정보</h2><p class="muted">강사와 수강생은 이 화면에서 본인 사진을 업로드해 사용할 수 있습니다. 정적 웹 환경이므로 사진은 브라우저 localStorage에 저장됩니다.</p><div style="margin-top:18px">${imageAvatar(u,96)}</div><div style="margin-top:18px"><button class="btn btn-primary" id="editProfile">프로필 수정</button></div></section>`);
  $('#editProfile').onclick=()=>openModal('프로필 수정',userFields.filter(f=>!['role','status'].includes(f.name)),u,obj=>{ Object.assign(u,obj); save('users'); localStorage.setItem(authKey,JSON.stringify(u)); renderPage(); });
}
function renderPage(){
  const map={ login:renderLogin, signup:renderSignup, dashboard:renderDashboard, users:renderUsers, courses:renderCourses, 'course-list':renderCourseList, enrollments:renderEnrollments, classroom:renderClassroom, lessons:renderLessons, attendance:renderAttendance, assignments:renderAssignments, grades:renderGrades, progress:renderProgress, notices:renderNotices, profile:renderProfile };
  map[page]?.();
}
(async function(){ await initData(); if(requireAuth()) renderPage(); })();

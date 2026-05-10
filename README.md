# LMS 교육용 플랫폼

GitHub Pages에 업로드해서 실행할 수 있는 정적 학습관리 시스템 실습 프로젝트입니다. 데이터베이스 서버를 사용하지 않고 `data/*.json` 파일을 초기 데이터 저장소로 사용하며, 브라우저에서 발생하는 등록, 수정, 삭제, 사진 업로드 결과는 `localStorage`에 저장됩니다.

## 1. 프로젝트 목적

이 프로젝트는 학습관리 시스템의 일반적인 업무 흐름을 교육용으로 이해하기 위한 예제입니다. 관리자, 강사, 수강생 역할을 분리하고 각 역할이 접근할 수 있는 화면과 기능을 제한하여 인증과 인가의 기본 구조를 실습할 수 있도록 구성했습니다.

주요 학습 목표는 다음과 같습니다.

```text
정적 웹 프로젝트 구조 이해
JSON 기반 초기 데이터 로딩 이해
localStorage 기반 클라이언트 데이터 저장 이해
로그인 인증 흐름 이해
역할 기반 인가 처리 이해
관리자, 강사, 수강생 화면 분리 이해
강의, 수강신청, 콘텐츠, 출석, 과제, 평가, 진도 관리 흐름 이해
GitHub Pages 배포 실습
```

## 2. 기술 구성

```text
HTML
CSS
JavaScript
JSON
localStorage
GitHub Pages
```

별도의 Node.js 서버, MariaDB, MongoDB, Firebase, Supabase는 사용하지 않습니다.

## 3. 실행 방식

압축을 해제한 뒤 로컬에서 확인하려면 정적 서버를 실행합니다.

```bash
cd lms-edu-platform
python3 -m http.server 8000
```

브라우저에서 접속합니다.

```text
http://localhost:8000
```

GitHub Pages에서는 저장소에 업로드한 뒤 `Settings > Pages`에서 배포 브랜치를 지정하면 됩니다.

## 4. 샘플 로그인 계정

```text
관리자
이메일: admin@lms.com
비밀번호: 1234

강사
이메일: instructor@lms.com
비밀번호: 1234

수강생
이메일: student@lms.com
비밀번호: 1234
```

## 5. 인증 구조

로그인은 `users.json` 또는 `localStorage`에 저장된 사용자 목록에서 이메일, 비밀번호, 상태값을 확인하는 방식으로 동작합니다.

로그인 성공 시 현재 사용자 정보가 다음 키로 저장됩니다.

```text
lms_edu_current_user
```

저장되는 사용자 정보에는 다음 값이 포함됩니다.

```text
id
name
email
role
organization
status
photo
```

로그아웃하면 `lms_edu_current_user` 값이 삭제되고 로그인 화면으로 이동합니다.

## 6. 인가 구조

이 버전은 역할별 접근 제어를 명확히 적용합니다. 단순히 메뉴만 숨기는 방식이 아니라, 직접 URL을 입력해 접근하더라도 권한이 없으면 접근 권한 없음 화면이 출력됩니다.

역할은 다음 세 가지입니다.

```text
admin       관리자
instructor  강사
student     수강생
```

## 7. 역할별 접근 가능 화면

### 관리자

관리자는 전체 운영 데이터를 관리합니다.

```text
dashboard.html       대시보드
users.html           사용자 관리
courses.html         강의 관리
enrollments.html     수강 신청 관리
progress.html        학습 현황
attendance.html      출석 현황
assignments.html     과제 현황
grades.html          평가 현황
notices.html         공지사항
profile.html         내 정보
```

관리자는 모든 사용자, 모든 강의, 모든 수강 신청, 모든 출석, 모든 과제, 모든 평가 데이터를 조회하고 관리할 수 있습니다.

### 강사

강사는 본인이 담당하는 강의와 관련된 데이터만 조회하고 관리합니다.

```text
dashboard.html       대시보드
courses.html         내 강의
lessons.html         콘텐츠 관리
attendance.html      출석 관리
assignments.html     과제 관리
grades.html          평가 관리
progress.html        수강생 현황
notices.html         공지사항
profile.html         내 정보
```

강사는 다음 데이터만 볼 수 있습니다.

```text
본인 instructorId가 연결된 강의
본인 담당 강의의 콘텐츠
본인 담당 강의의 수강생 출석
본인 담당 강의의 과제
본인 담당 강의의 평가
본인 담당 강의의 학습 진도
본인 담당 강의 대상 공지사항
```

강사는 관리자 전용 페이지인 `users.html`, `enrollments.html`에 접근할 수 없습니다.

### 수강생

수강생은 본인이 신청하거나 승인받은 강의 관련 데이터만 조회합니다.

```text
dashboard.html       대시보드
course-list.html     강의 목록
classroom.html       내 강의실
lessons.html         학습 콘텐츠
assignments.html     과제 제출
attendance.html      출석 현황
grades.html          평가 결과
progress.html        학습 현황
notices.html         공지사항
profile.html         내 정보
```

수강생은 다음 데이터만 볼 수 있습니다.

```text
본인이 신청한 강의
본인이 승인받은 강의
본인의 출석 내역
본인의 과제 제출 내역
본인의 평가 결과
본인의 학습 진도
본인 수강 강의 대상 공지사항
```

수강생은 `users.html`, `courses.html`, `enrollments.html`에 접근할 수 없습니다.

## 8. 화면별 주요 기능

### 로그인

```text
이메일 입력
비밀번호 입력
사용자 상태 active 확인
로그인 성공 시 current user 저장
역할별 메뉴가 있는 대시보드로 이동
```

### 회원가입

```text
이름 입력
이메일 입력
비밀번호 입력
역할 선택
소속 입력
프로필 사진 업로드
회원정보 localStorage 저장
가입 후 자동 로그인
```

### 대시보드

역할에 따라 표시되는 통계가 달라집니다.

관리자 대시보드:

```text
전체 사용자
전체 강의
수강 신청
공지사항
최근 수강 신청
최근 공지사항
```

강사 대시보드:

```text
내 강의
담당 수강 신청
등록 콘텐츠
제출 과제
담당 강의 기준 최근 신청
담당 강의 공지
```

수강생 대시보드:

```text
수강 신청
승인 강의
학습 콘텐츠
과제 제출
내 신청 내역
내 수강 강의 공지
```

### 사용자 관리

관리자 전용 화면입니다.

```text
사용자 등록
사용자 수정
사용자 삭제
사용자 검색
CSV 다운로드
페이지네이션
프로필 사진 관리
역할 변경
상태 변경
```

### 강의 관리

관리자는 전체 강의를 등록, 수정, 삭제할 수 있습니다. 강사는 본인 담당 강의만 조회합니다.

```text
강의 등록
강의 수정
강의 삭제
강사 배정
강의 상태 변경
검색
CSV 다운로드
페이지네이션
```

### 강의 목록

수강생 전용 화면입니다.

```text
전체 강의 목록 조회
강의 상세 요약 확인
수강 신청
신청 상태 표시
```

### 수강 신청 관리

관리자 전용 화면입니다.

```text
수강 신청 조회
승인
반려
취소
CSV 다운로드
페이지네이션
```

### 내 강의실

수강생 전용 화면입니다.

```text
승인된 강의 목록 조회
강의별 진도율 확인
강의실 입장
```

### 학습 콘텐츠

관리자와 강사는 콘텐츠를 등록, 수정, 삭제할 수 있습니다. 강사는 본인 담당 강의에만 콘텐츠를 등록할 수 있습니다. 수강생은 승인받은 강의의 공개 콘텐츠만 볼 수 있습니다.

```text
콘텐츠 등록
콘텐츠 수정
콘텐츠 삭제
콘텐츠 공개 상태 관리
수강생 학습 처리
학습 시 진도율 반영
```

### 출석 관리

관리자와 강사는 출석 상태를 변경할 수 있습니다. 강사는 본인 담당 강의의 출석만 변경할 수 있습니다. 수강생은 본인 출석 내역만 조회합니다.

```text
출석
지각
결석
공결
CSV 다운로드
페이지네이션
```

### 과제 관리

관리자와 강사는 과제를 등록, 수정, 삭제할 수 있습니다. 강사는 본인 담당 강의에만 과제를 등록할 수 있습니다. 수강생은 승인받은 강의의 과제를 제출할 수 있습니다.

```text
과제 등록
과제 수정
과제 삭제
과제 제출
제출 여부 표시
CSV 다운로드
페이지네이션
```

### 평가 관리

관리자와 강사는 평가 점수를 수정할 수 있습니다. 강사는 본인 담당 강의의 평가만 수정할 수 있습니다. 수강생은 본인의 평가 결과만 조회합니다.

```text
출석 점수
과제 점수
시험 점수
최종 점수 자동 계산
등급 자동 계산
CSV 다운로드
페이지네이션
```

### 학습 현황

역할별로 조회 범위가 제한됩니다.

```text
관리자: 전체 학습 현황
강사: 본인 담당 강의 학습 현황
수강생: 본인 학습 현황
```

### 공지사항

관리자와 강사는 공지를 등록, 수정, 삭제할 수 있습니다. 강사는 본인 담당 강의 대상 공지만 관리할 수 있습니다. 수강생은 전체 공지 또는 본인이 수강하는 강의 공지만 조회합니다.

```text
공지 등록
공지 수정
공지 삭제
공지 조회
중요 공지 표시
CSV 다운로드
페이지네이션
```

### 내 정보

모든 역할이 접근할 수 있습니다.

```text
이름 수정
이메일 수정
비밀번호 수정
전화번호 수정
소속 수정
프로필 사진 업로드
```

## 9. 데이터 파일 구조

```text
data/users.json
data/courses.json
data/enrollments.json
data/lessons.json
data/attendance.json
data/assignments.json
data/submissions.json
data/grades.json
data/notices.json
data/learning-progress.json
```

## 10. localStorage 저장 키

```text
lms_edu_users
lms_edu_courses
lms_edu_enrollments
lms_edu_lessons
lms_edu_attendance
lms_edu_assignments
lms_edu_submissions
lms_edu_grades
lms_edu_notices
lms_edu_learning-progress
lms_edu_current_user
```

## 11. 데이터 초기화

각 목록 화면의 초기화 버튼을 누르면 `localStorage`에 저장된 실습 데이터를 삭제하고 `data/*.json` 원본 데이터를 다시 불러옵니다.

브라우저 개발자 도구에서 직접 초기화하려면 다음 코드를 사용할 수 있습니다.

```javascript
Object.keys(localStorage)
  .filter((key) => key.startsWith('lms_edu_'))
  .forEach((key) => localStorage.removeItem(key));
location.reload();
```

## 12. 정적 웹 환경의 한계

이 프로젝트는 GitHub Pages에서 실행되는 정적 웹 프로젝트입니다. 따라서 브라우저에서 등록, 수정, 삭제한 데이터는 GitHub 저장소의 JSON 파일에 직접 저장되지 않습니다.

처리 방식은 다음과 같습니다.

```text
초기 데이터: data/*.json에서 읽기
변경 데이터: 브라우저 localStorage에 저장
초기화: localStorage 삭제 후 JSON 원본 다시 로딩
CSV 다운로드: 현재 화면 데이터를 파일로 다운로드
```

실제 운영형 LMS를 구현하려면 다음 구조가 필요합니다.

```text
Next.js 또는 Express 서버
MariaDB 또는 PostgreSQL
서버 기반 세션 또는 JWT 인증
서버 API 기반 권한 검사
파일 업로드 저장소
관리자 감사 로그
```

## 13. 교육 활용 포인트

이 프로젝트는 다음 수업에 활용하기 좋습니다.

```text
LMS 업무 프로세스 이해
역할 기반 인증과 인가 구분
정적 웹과 서버 기반 웹의 차이
JSON 데이터와 데이터베이스의 차이
localStorage 저장 구조
GitHub Pages 배포 실습
화면 중심 코드 구조 분석
관리자, 강사, 수강생 권한 설계 실습
```

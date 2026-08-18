# SEQRET_FE 작업 규칙

## UI 화면 결과물 전달 방식

UI 화면(페이지, 화면 단위 컴포넌트, 레이아웃)을 새로 만들거나 수정해서 완성했을 때는
파일 카드만 주지 말고 **리뷰 위젯으로 화면을 띄운다.**

- 도구: `mcp__visualize__show_widget`
- 형태: 완성된 화면을 렌더링하고, 화면 위 아무 곳이나 클릭하면 그 좌표에 번호 핀이 꽂히며
  댓글을 달 수 있는 리뷰 위젯. 하단에 댓글 목록과 "댓글 Claude에게 보내기" 버튼을 둔다.
- 전송 버튼은 `sendPrompt()`로 댓글을 좌표와 함께 대화로 보낸다. 그 댓글은 곧바로
  코드 수정 요청으로 처리한다.
- 위젯은 저장소를 못 쓰므로 댓글은 메모리에만 남는다. 이 점을 사용자에게 한 줄로 알린다.
- 실제로 동작하는 빌드가 필요하면 단일 HTML 미리보기를 함께 만들어 파일 카드로 전달한다.

적용 대상: UI 화면 결과물만. 문서, 스크립트, 설정 파일, 스펙 문서는 기존대로 파일 카드로 전달한다.

## 보안 계약

- access secret(초대 코드로 받은 토큰)은 **메모리에만** 보관한다.
  `sessionStorage`, `localStorage`, IndexedDB, PWA cache, log, analytics 어디에도 남기지 않는다.
  `AuthSession`을 통째로 저장하는 코드도 같은 위반이다 (`accessToken`이 들어 있다).
- 새로고침 시 재연결이 필요한 것은 이 결정의 정상 결과이며 버그가 아니다.

## API 계약

- `POST /api/v1/move-jobs/{job_id}/capture-sessions`는 body에
  `consent_policy_version`과 `privacy_notice_acknowledged`를 반드시 포함한다. 없으면 서버가 422를 준다.
- `privacy_notice_acknowledged`는 하드코딩하지 않는다. 사용자가 실제로 고지를 확인한 값을 보낸다.
- `consent_policy_version`은 `VITE_CONSENT_POLICY_VERSION`으로 주입하고 기본값은 `v1`.
- field 이름은 OpenAPI 그대로 쓴다. camelCase / snake_case를 임의로 변환하지 않는다.

## 디자인

- 화면 뎁스가 얕으므로 상태는 색으로 구분한다.
  검토 필요=primary, 고객 확인 중=warning, 공동 확정=success, 현장 이슈=danger.
  아이콘 배경, 카드 레일, 리스트 행 좌측 레일, 상태 뱃지에 일관되게 적용한다.
- 영역 구분은 배경 대비로 한다. 페이지 배경은 `bg-surface-muted`, 카드는 흰색.

## Git 작업 주의

- 이 저장소를 샌드박스에서 다룰 때 `git status` 같은 index를 갱신하는 명령을 쓰지 않는다.
  마운트가 느려 명령이 타임아웃으로 중단되면 `.git/index.lock`이 남고,
  그 뒤로 GitHub Desktop의 commit이 "A lock file already exists"로 전부 실패한다.
  샌드박스는 `.git` 안의 파일을 지울 권한이 없어 스스로 복구할 수도 없다.
- 상태 확인이 필요하면 lock을 잡지 않는 읽기 전용 형태를 쓴다.
  `git --no-optional-locks status --short`
- lock이 이미 생겼다면: git 프로세스가 없는지 확인한 뒤 `.git/index.lock`을 지운다.

## 검증

결과물을 넘기기 전에 `npx tsc -b`와 `npx eslint src --max-warnings=0`을 통과시킨다.

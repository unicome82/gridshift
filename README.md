# GRID SHIFT.

커서와 터치에 반응하는 원페이지 기하학 그리드. FLOAT의 파일 구성과 SCSS 믹스인 구조를 참고했습니다.

## 실행

`index.html`을 브라우저에서 엽니다. GSAP, Inter 폰트, Reset 아이콘을 `assets/`에 포함하므로 폴더 전체를 내려받으면 인터넷 없이도 동작합니다. 로컬 서버를 사용하려면 저장소에서 `python3 -m http.server 8000`을 실행합니다.

## 구조

- `index.html`: 화면과 컨트롤
- `scss/_reset.scss`: 기본 속성 초기화
- `scss/_variables.scss`: 색상과 레이아웃 변수
- `scss/_mixins.scss`: flex, position, font, size, mobile
- `scss/style.scss`: 화면 스타일과 Reset 깜빡임
- `scss/style.css`: 브라우저 실행용 컴파일 결과
- `js/app.js`: 격자 생성, 포인터 계산, 모드와 GSAP 제어
- `GRID_SHIFT_Codex_Prompt.md`: 최초 제작 프롬프트. 이후 변경된 실제 동작은 이 README를 기준으로 확인합니다.

SCSS 변경 시 기존 Sass 컴파일러로 `scss/style.scss`를 `scss/style.css`에 컴파일합니다. 새 의존성은 필요하지 않습니다.

## 화면과 조작

원색·분홍·검정의 직사각형 모자이크를 사용합니다. 블록과 빈칸은 고정 격자 안에서 서로 자리를 교환하며 변경된 배열을 유지합니다. 로고 아래에는 `COPYRIGHT ⓒ 2026 UNI`를 표시하고 폰트는 FLOAT와 동일한 Inter를 사용합니다. 세로 flex 레이아웃에서 그리드가 헤더·푸터를 제외한 공간을 채웁니다.

- **Swap**: 가로 교환
- **Cascade**: 순차적인 세로 교환
- **Weave**: 가로·세로 교차 교환
- **Intensity**: 교환 속도 조절. 0%는 정지
- **Radius**: 블록 높이 기준 반경. 기본 6칸, 최소 4칸, 최대 10칸. 교환 상대도 같은 반경 안에 있어야 하며 개수 제한 없이 가능한 블록 쌍이 반응
- **Width / Height**: 기본 크기 대비 가로·세로를 각각 50~200% 조절

모드는 버튼으로 선택합니다. 안내 문구 오른쪽 Reset 버튼은 현재 크기의 초기 배열로 복원하며 선택한 모드는 유지합니다. 위치가 바뀌었거나 이동 중인 블록만 복원하고, 버튼은 SCSS 애니메이션으로 한 번 깜빡입니다.

모바일에서는 터치하고 드래그합니다. 조작하지 않으면 랜덤 위치에서 자동 교환합니다. 비활성 탭과 모션 감소 설정에서는 자동 효과를 멈춥니다.

## 격자 갱신

크기 수치는 즉시 표시하고, 입력이 160ms 멈추거나 드래그를 놓으면 기존 블록을 재사용해 격자를 갱신합니다. 부족한 블록만 추가하고 초과한 블록만 제거합니다.

무거운 초기화는 프레임당 최대 96개씩 나눠 처리합니다. 갱신 중 새 입력이 들어오면 이전 작업을 취소하고 마지막 크기를 적용합니다. 갱신 중에는 블록 교환을 잠시 멈추고 완료 후 재개합니다. 블록 수는 최대 40열×60행입니다.

## 로컬 외부 자산

- `assets/vendor/gsap-3.12.5.min.js`: 기존과 같은 GSAP 3.12.5. 배포 파일의 저작권·라이선스 헤더를 보존했습니다. https://gsap.com/standard-license
- `assets/fonts/inter-latin-wght-normal.woff2`: Fontsource의 Inter 5.2.8 패키지에서 받은 Latin 가변 폰트(100–900). SIL OFL 라이선스 동봉. 한글은 기존처럼 시스템 폰트로 표시합니다.
- `assets/icons/refresh.svg`: Google Material Symbols Rounded의 Refresh 아이콘. 아이콘 하나를 위해 웹폰트를 불러오는 대신 공식 SVG를 포함했습니다. Apache 2.0 라이선스 동봉.

조절 영역의 글자, 모드 버튼 패딩, 슬라이더 thumb는 기존 대비 30% 확대했습니다.

## iPhone 홈 화면 아이콘

Safari에서 공유 → 홈 화면에 추가를 선택하면 모자이크 아이콘을 사용합니다. `assets/icons/apple-touch-icon.png`는 180×180 PNG이며, 일반 브라우저 아이콘은 `assets/icons/icon-192.png`를 사용합니다. 기존에 추가한 바로가기에 예전 아이콘이 남아 있으면 삭제 후 다시 추가합니다.

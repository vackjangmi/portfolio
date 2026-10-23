# sooyeol.link

`sooyeol.com/eba`처럼 기억하기 쉬운 개인용 짧은 URL을 만들고 관리하는 사이트입니다.

## 주요 기능

- 원하는 경로와 원본 URL로 짧은 주소 만들기
- 앱 링크의 Android·iOS·기타 기기별 목적지 자동 분기
- 짧은 주소 복사, 검색, 삭제
- 방문 횟수 기록
- D1에 링크를 영구 저장
- 짧은 경로의 GET/HEAD 요청을 원문으로 리다이렉트

앱 링크는 기본 주소에 앱 소개 페이지를 넣고, Google Play와 App Store
주소를 선택 입력합니다. Android는 Google Play, iPhone·iPad는 App Store,
그 외 환경은 기본 소개 페이지로 이동합니다.

## 실행

```bash
npm install
npm run dev
```

배포용 빌드는 `npm run build`로 확인할 수 있습니다.

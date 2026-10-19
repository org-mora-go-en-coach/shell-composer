# Shell Composer

Mora Go의 마이크로 프런트엔드와 API를 하나의 애플리케이션으로 조합하는 Next.js Shell입니다.

## 구현 내용

- Shell Config의 런타임 설정 조회
- 설정된 버전의 ESM 원격 모듈 동적 로딩
- Layout MFE가 제공하는 콘텐츠 영역에 화면 MFE 마운트
- 로딩·오류 처리와 원격 모듈 생명주기 관리
- 전체 로컬 스택을 한 번에 실행하는 개발 스크립트

## 실행 방법

```bash
npm install
npm run dev:stack
```

Shell은 `http://localhost:4000`에서 실행됩니다. Shell만 실행하려면 `npm run dev`를 사용합니다.

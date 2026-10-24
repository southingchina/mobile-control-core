# Mobile Control Core

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md)

로컬 Android/iPhone 서비스에서 추출한 재사용 가능한 기기 제어 스케줄링 코어입니다. 같은 기기의 호출 또는 배치 전체를 직렬화하고 다른 기기는 병렬 처리합니다. 취소를 전달하며 쓰기 결과가 불확실하거나 입력이 미완료이면 중단합니다. Controller 인터페이스, 독립 iOS WDA 어댑터, fusion 구현 및 실제 휴대폰에 연결하지 않는 메모리 데모를 포함합니다.

## 필요 환경

Node.js 22+; WebDriverAgent (iOS)

## 설정 및 진입점

`core.cjs`, `ios-adapter.cjs`, `wda-fusion.cjs`, `id`, `info()`, `execute(tool,args,signal)`, `127.0.0.1:8200`

## 설치 및 사용

```shell
git clone https://github.com/southingchina/mobile-control-core.git
cd mobile-control-core
node --test tests/*.test.cjs
node examples/queue-demo.cjs
```


```javascript
const {Controller}=require('./core.cjs');
const adapter={
  id:'my-device',
  info:async()=>({id:'my-device',online:true}),
  execute:async(tool,args,signal)=>{/* 在这里调用你自己的后端 */}
};
const controller=new Controller([adapter]);
// await controller.call('mobile_observe_screen',{device:'my-device'},abortSignal);
```


## 공개 범위와 제한

Node.js 22+가 필요하며 외부 npm 의존성은 없습니다. 어댑터는 id, info(), execute(tool,args,signal)를 제공하고 기기를 명시적으로 선택해야 합니다. 배치는 1–50단계이며 중첩 또는 교차 기기 배치는 금지됩니다. 취소로 이미 보낸 동작을 되돌릴 수 없습니다. iOS 어댑터는 127.0.0.1:8200의 실행 중인 WDA를 사용하므로 직접 설치·시작해야 합니다. 개인 Android/Root/NAS/SSH 배포와 토큰은 제외되어 원래의 42개 도구 전체 서비스가 아닙니다. 테스트는 모의 백엔드만 사용합니다. 원격 서비스로 감싸려면 별도의 인증과 네트워크 접근 제어가 필요합니다.

## 검증 기록

2026-10-24 · Node: 11 ✓; simulated backends

## 라이선스 및 출처

[MIT](LICENSE)

프로젝트 문서의 언어별 버전입니다. 앱 화면, CLI 출력과 실행 파일은 현재 구현을 따릅니다.

[중국어 상세 참고 문서](README.zh-CN.md) · [언어 문서 유지 관리 정책](docs/LOCALIZATION.md)

[Issues](https://github.com/southingchina/mobile-control-core/issues) — 재현 가능한 문제는 합성 데이터로 보고하고 로그의 자격 증명과 개인 정보를 제거하세요.

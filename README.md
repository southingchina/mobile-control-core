# Mobile Control Core

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md)

A reusable device-control scheduling core extracted from a local Android/iPhone service. Serialize an entire call or batch per device, run different devices concurrently, propagate cancellation and halt after uncertain writes or incomplete input. Includes a Controller interface, independent iOS WDA adapter, fusion implementation and an in-memory demo that does not connect to a phone.

## Requirements

Node.js 22+; WebDriverAgent (iOS)

## Configuration and entry points

`core.cjs`, `ios-adapter.cjs`, `wda-fusion.cjs`, `id`, `info()`, `execute(tool,args,signal)`, `127.0.0.1:8200`

## Installation and usage

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


## Scope and limitations

Requires Node.js 22+ and no third-party npm dependencies. Adapters provide id, info() and execute(tool,args,signal); select the device explicitly. Batches contain 1–50 steps and cannot be nested or cross-device. Cancellation cannot undo an action already sent. The iOS adapter uses an existing WDA at 127.0.0.1:8200; install and start WDA yourself. Private Android/Root/NAS/SSH deployment and tokens are excluded, so this is not the original full 42-tool service. Tests use simulated backends, not a new hardware regression. Add authentication and network controls before building any remote service around it.

## Validation record

2026-10-24 · Node: 11 ✓; simulated backends

## License and attribution

[MIT](LICENSE)

These are documentation editions. Application interfaces, CLI output and executable releases retain the behavior of the current implementation.

[Complete Chinese reference](README.zh-CN.md) · [Language maintenance policy](docs/LOCALIZATION.md)

[Issues](https://github.com/southingchina/mobile-control-core/issues) — Report a reproducible issue with synthetic data. Remove credentials and private information from logs.

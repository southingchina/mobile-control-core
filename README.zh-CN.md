# Mobile Control Core · 统一设备调度核心

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md)

从本地 Android/iPhone 控制服务中提取的可复用核心：**同设备整次调用排队、跨设备并发、批处理取消及不确定写入保护**。附独立 iOS WDA 适配器和不接触真实设备的演示。

## 发布范围

这是源码核心，不是原私有部署的完整手机控制服务。公开内容为 Controller、iOS 适配器、独立实现的 WDA fusion 层及其单元测试。原 Android 模拟器绑定、Root RPC、个人设备配置、NAS/SSH 网关、token、自动启动与日志均不分发。没有宣称下载后即可复现原 42 工具的完整环境。

## 安装与演示

需要 Node.js 22+，没有第三方 npm 依赖：

```shell
git clone https://github.com/southingchina/mobile-control-core.git
cd mobile-control-core
node --test tests/*.test.cjs
node examples/queue-demo.cjs
```

演示使用内存适配器，只显示合成步骤，不连接手机。

## 接入自己的适配器

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

必须显式提供设备 ID。单批 1–50 步，不能嵌套或跨设备；取消只阻止后续动作，不能撤销已发送的输入。不确定执行、失焦或输入未完成会停止后续步骤，调用方应观察状态而非盲目重放。

## iOS 参考适配器

`ios-adapter.cjs` 调用 `127.0.0.1:8200` 的现有 WebDriverAgent，支持观察、选择器、点击、输入等。你需要自行安装并启动适用于自己设备的 WDA；本项目不包含 WDA、驱动或手机账号。`wda-fusion.cjs` 为本地独立实现，代码注明受 iPhone Use 已公开设计启发，并不包含其运行时。

公开版测试使用模拟后端验证生命周期与取消逻辑，未在本次发布中进行 iPhone 真机或 Android 端到端回归。此库没有对外网络服务与认证层；如自行包装远端服务，应另行实现明确授权、认证和网络访问控制。

MIT。建议先用虚拟适配器验证自己的调度，再接入真实设备。

# Mobile Control Core

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md)

ローカル Android/iPhone サービスから抽出した、再利用可能なデバイス制御スケジューラです。同一デバイスでは呼び出しやバッチ全体を直列化し、別デバイスは並列処理します。キャンセルを伝播し、書き込み結果が不確定な場合や入力が未完了の場合に停止します。Controller インターフェイス、独立 iOS WDA アダプター、fusion 実装、スマートフォンに接続しないメモリ上のデモを含みます。

## 必要な環境

Node.js 22+; WebDriverAgent (iOS)

## 設定とエントリーポイント

`core.cjs`, `ios-adapter.cjs`, `wda-fusion.cjs`, `id`, `info()`, `execute(tool,args,signal)`, `127.0.0.1:8200`

## 導入と使用方法

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


## 公開範囲と制限

Node.js 22+ が必要で、外部 npm 依存はありません。アダプターは id、info()、execute(tool,args,signal) を実装し、対象デバイスを明示します。バッチは 1–50 ステップで、入れ子や複数デバイス混在は禁止です。送信済みの操作はキャンセルで取り消せません。iOS は起動済み WDA の 127.0.0.1:8200 を使用します。個人用 Android/Root/NAS/SSH 設定や token は含まず、元の 42 ツールを備える完全サービスではありません。テストは模擬バックエンドです。外部サービス化する場合は別途認証とネットワーク制御を実装してください。

## 検証記録

2026-10-24 · Node: 11 ✓; simulated backends

## ライセンスと出典

[MIT](LICENSE)

これらは文書の言語版です。アプリ画面、CLI 出力、実行ファイルは現在の実装に従います。

[中国語の詳細リファレンス](README.zh-CN.md) · [言語版の保守方針](docs/LOCALIZATION.md)

[Issues](https://github.com/southingchina/mobile-control-core/issues) — 再現できる問題は合成データで報告し、ログの認証情報や個人情報を除いてください。

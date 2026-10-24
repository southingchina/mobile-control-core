# Mobile Control Core

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md)

Wiederverwendbarer Ablaufkern für Gerätesteuerung, extrahiert aus einem lokalen Android-/iPhone-Dienst. Vollständige Aufrufe und Batches werden je Gerät serialisiert, verschiedene Geräte parallel ausgeführt und Abbrüche weitergegeben. Bei unsicherem Schreibausgang oder unvollständiger Eingabe stoppen weitere Schritte. Enthalten sind Controller, ein unabhängiger iOS-WDA-Adapter, die Fusion-Implementierung und eine In-Memory-Demo ohne Telefonzugriff.

## Voraussetzungen

Node.js 22+; WebDriverAgent (iOS)

## Konfiguration und Einstiegspunkte

`core.cjs`, `ios-adapter.cjs`, `wda-fusion.cjs`, `id`, `info()`, `execute(tool,args,signal)`, `127.0.0.1:8200`

## Installation und Verwendung

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


## Umfang und Einschränkungen

Erfordert Node.js 22+ ohne externe npm-Abhängigkeiten. Adapter stellen id, info() und execute(tool,args,signal) bereit; Geräte müssen ausdrücklich gewählt werden. Batches haben 1–50 Schritte und dürfen weder verschachtelt noch geräteübergreifend sein. Ein Abbruch macht gesendete Aktionen nicht rückgängig. iOS benötigt separat installiertes und gestartetes WDA unter 127.0.0.1:8200. Private Android-/Root-/NAS-/SSH-Konfigurationen und Tokens sind ausgeschlossen; dies ist nicht der vollständige ursprüngliche Dienst mit 42 Werkzeugen. Tests verwenden simulierte Backends. Vor einem entfernten Dienst eigene Authentifizierung und Netzwerkregeln ergänzen.

## Prüfstand

2026-10-24 · Node: 11 ✓; simulated backends

## Lizenz und Herkunft

[MIT](LICENSE)

Dies sind Sprachfassungen der Dokumentation. Oberflächen, CLI-Ausgaben und ausführbare Pakete folgen weiterhin der aktuellen Implementierung.

[Vollständige chinesische Referenz](README.zh-CN.md) · [Pflege der Sprachfassungen](docs/LOCALIZATION.md)

[Issues](https://github.com/southingchina/mobile-control-core/issues) — Reproduzierbare Probleme mit synthetischen Daten melden. Zugangsdaten und private Informationen aus Protokollen entfernen.

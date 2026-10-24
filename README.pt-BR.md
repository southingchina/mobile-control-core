# Mobile Control Core

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md)

Núcleo reutilizável de agendamento de controle de dispositivos, extraído de um serviço local Android/iPhone. Serializa chamadas ou lotes completos por dispositivo, permite concorrência entre dispositivos e propaga cancelamento. Interrompe etapas seguintes após gravação incerta ou entrada incompleta. Inclui Controller, adaptador iOS WDA independente, implementação fusion e demonstração em memória sem conectar um telefone.

## Requisitos

Node.js 22+; WebDriverAgent (iOS)

## Configuração e pontos de entrada

`core.cjs`, `ios-adapter.cjs`, `wda-fusion.cjs`, `id`, `info()`, `execute(tool,args,signal)`, `127.0.0.1:8200`

## Instalação e uso

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


## Escopo e limitações

Exige Node.js 22+ sem dependências npm externas. Os adaptadores fornecem id, info() e execute(tool,args,signal); o dispositivo deve ser escolhido explicitamente. Lotes têm 1–50 etapas, sem aninhamento nem vários dispositivos. Cancelar não desfaz ações enviadas. O iOS usa um WDA existente em 127.0.0.1:8200, instalado e iniciado separadamente. Configurações privadas Android/Root/NAS/SSH e tokens foram excluídos; não é o serviço original completo com 42 ferramentas. Os testes usam simulações, não nova validação física. Adicione autenticação e controle de rede antes de criar um serviço remoto.

## Registro de validação

2026-10-24 · Node: 11 ✓; simulated backends

## Licença e créditos

[MIT](LICENSE)

São versões da documentação. Interfaces, saídas CLI e executáveis mantêm o comportamento da implementação atual.

[Referência completa em chinês](README.zh-CN.md) · [Política de manutenção dos idiomas](docs/LOCALIZATION.md)

[Issues](https://github.com/southingchina/mobile-control-core/issues) — Relate problemas reproduzíveis com dados sintéticos. Remova credenciais e informações privadas dos logs.

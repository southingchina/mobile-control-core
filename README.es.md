# Mobile Control Core

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md)

Núcleo reutilizable de planificación de control de dispositivos, extraído de un servicio local Android/iPhone. Serializa cada llamada o lote completo por dispositivo, permite concurrencia entre dispositivos y propaga la cancelación. Detiene pasos posteriores ante escrituras inciertas o entrada incompleta. Incluye Controller, un adaptador iOS WDA independiente, la implementación fusion y una demostración en memoria sin conexión a un teléfono.

## Requisitos

Node.js 22+; WebDriverAgent (iOS)

## Configuración y puntos de entrada

`core.cjs`, `ios-adapter.cjs`, `wda-fusion.cjs`, `id`, `info()`, `execute(tool,args,signal)`, `127.0.0.1:8200`

## Instalación y uso

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


## Alcance y limitaciones

Requiere Node.js 22+ sin dependencias npm externas. Los adaptadores ofrecen id, info() y execute(tool,args,signal); el dispositivo debe seleccionarse explícitamente. Cada lote admite 1–50 pasos, sin anidamiento ni varios dispositivos. Cancelar no deshace acciones enviadas. iOS utiliza WDA existente en 127.0.0.1:8200, instalado e iniciado por el usuario. Se excluyen despliegues privados Android/Root/NAS/SSH y tokens; no es el servicio original completo de 42 herramientas. Las pruebas usan simulaciones, no una nueva validación física. Añade autenticación y control de red antes de exponer un servicio remoto.

## Registro de validación

2026-10-24 · Node: 11 ✓; simulated backends

## Licencia y atribución

[MIT](LICENSE)

Son versiones de la documentación. Las interfaces, salidas CLI y ejecutables mantienen el comportamiento de la implementación actual.

[Referencia completa en chino](README.zh-CN.md) · [Política de mantenimiento de idiomas](docs/LOCALIZATION.md)

[Issues](https://github.com/southingchina/mobile-control-core/issues) — Comunica problemas reproducibles con datos sintéticos. Elimina credenciales e información privada de los registros.

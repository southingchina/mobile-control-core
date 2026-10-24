# Mobile Control Core

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md)

Noyau réutilisable d'ordonnancement du contrôle d'appareils, extrait d'un service local Android/iPhone. Il sérialise chaque appel ou lot complet par appareil, autorise la concurrence entre appareils et propage l'annulation. Les étapes suivantes s'arrêtent après une écriture incertaine ou une saisie incomplète. Il inclut Controller, un adaptateur iOS WDA indépendant, l'implémentation fusion et une démonstration en mémoire sans téléphone.

## Prérequis

Node.js 22+; WebDriverAgent (iOS)

## Configuration et points d’entrée

`core.cjs`, `ios-adapter.cjs`, `wda-fusion.cjs`, `id`, `info()`, `execute(tool,args,signal)`, `127.0.0.1:8200`

## Installation et utilisation

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


## Périmètre et limites

Node.js 22+ est nécessaire, sans dépendance npm externe. Les adaptateurs fournissent id, info() et execute(tool,args,signal) ; l'appareil doit être choisi explicitement. Un lot contient 1–50 étapes, sans imbrication ni mélange d'appareils. Annuler ne défait pas une action déjà envoyée. L'adaptateur iOS utilise WDA existant sur 127.0.0.1:8200, à installer et démarrer séparément. Les déploiements privés Android/Root/NAS/SSH et tokens sont exclus : ce n'est pas le service original de 42 outils. Les tests utilisent des simulations. Ajoutez authentification et contrôle réseau avant toute exposition distante.

## Historique de validation

2026-10-24 · Node: 11 ✓; simulated backends

## Licence et attribution

[MIT](LICENSE)

Il s’agit de versions de la documentation. Interfaces, sorties CLI et exécutables conservent le comportement de l’implémentation actuelle.

[Référence complète en chinois](README.zh-CN.md) · [Politique de maintenance des langues](docs/LOCALIZATION.md)

[Issues](https://github.com/southingchina/mobile-control-core/issues) — Signalez les problèmes reproductibles avec des données synthétiques. Retirez identifiants secrets et informations privées des journaux.

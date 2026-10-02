# CAPIVARI HORIZON V2

Jogo de corrida **open world para navegador**, inspirado em Capivari-SP.

## Estado atual

A V2 já possui uma build jogável sem etapa de compilação:

- mundo 3D procedural;
- bairros: Centro, Moreto, Jardim Elisa, Morada do Sol, São João e Flamboyant;
- modo Corrida com 7 adversários, 2 voltas, checkpoints, posição e pódio;
- modo Passeio Livre;
- garagem com 20 veículos e atributos próprios;
- HUD, velocímetro e minimapa;
- controles por teclado e controles touch;
- interface responsiva para desktop e celular;
- publicação estática compatível com GitHub Pages.

## Jogar localmente

Você pode servir a pasta com qualquer servidor HTTP:

```bash
npx serve .
```

Depois abra o endereço exibido no terminal.

> Não abra apenas o `index.html` como arquivo local. O jogo utiliza módulos ES e deve ser servido por HTTP/HTTPS.

## Controles

**PC:** WASD ou setas para dirigir, Espaço para freio de mão, R para reposicionar, Esc para pausar.

**Mobile:** botões de direção, freio e acelerador aparecem automaticamente em dispositivos com toque.

## Estrutura

```
/
├── index.html
├── styles.css
├── src/
│   └── game.js
├── data/
│   └── capivari.json
├── docs/
│   └── ARCHITECTURE.md
├── .github/workflows/
│   └── pages.yml
├── .nojekyll
└── package.json
```

## Próximos patamares

A geometria atual é uma interpretação procedural pensada para gameplay e performance no navegador. A arquitetura foi deixada pronta para evoluir para dados geográficos reais (OSM/GeoJSON/DEM), modelos GLB/GLTF, sistema de progressão, áudio, clima, tráfego, física avançada e serviços de IA server-side.

A chave da OpenAI **nunca** deve ser colocada no JavaScript público do GitHub Pages. Uma futura integração com IA deve chamar um backend/Function seguro.

## Créditos

Projeto experimental **Capivari Horizon**, desenvolvido para web.

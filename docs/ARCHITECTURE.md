# Arquitetura — Capivari Horizon V2

## Objetivo

Manter uma build web jogável e leve agora, sem bloquear a evolução para uma representação mais fiel de Capivari-SP.

## Camadas

### Interface
`index.html` + `styles.css` concentram menu, garagem, HUD, minimapa, pausa, resultado e controles touch.

### Runtime 3D
`src/game.js` usa Three.js via CDN. O runtime é responsável por:

- cena, câmera, iluminação e neblina;
- ruas e avenidas procedurais;
- prédios instanciados e vegetação;
- veículo do jogador e câmera chase;
- física arcade;
- adversários seguindo o circuito;
- checkpoints, voltas, classificação e pódio;
- minimapa e HUD;
- entrada por teclado, ponteiro e touch.

### Dados
`data/capivari.json` separa os metadados geográficos do código. Hoje o jogo possui fallback interno para não deixar a aplicação quebrar se o arquivo não carregar.

## Evolução para mapa real

A próxima geração pode substituir a malha procedural por:

1. extração de vias e polígonos do OpenStreetMap;
2. conversão para GeoJSON;
3. normalização para coordenadas locais;
4. classificação das vias por largura e material;
5. geração de prédios por footprint/altura;
6. DEM para relevo;
7. LOD, instancing e streaming por setores;
8. landmarks em GLB/GLTF.

Os nomes dos bairros devem ser tratados como dados de produto e podem ganhar limites geográficos reais quando houver uma fonte confiável.

## Física

A versão atual usa física arcade determinística no cliente. Uma evolução pode adotar Rapier ou outra engine dedicada para suspensão, colisão, massa, torque, pneus e superfícies.

## OpenAI

GitHub Pages é estático, portanto não deve conter chave de API. O desenho recomendado é:

`Browser -> endpoint próprio autenticado -> OpenAI API`

Usos possíveis: engenheiro de corrida, narrador, eventos dinâmicos, desafios e tuning contextual.

## Regras de estabilidade

- Nenhum botão principal depende de elemento inexistente.
- Eventos touch usam Pointer Events e cancelamento apropriado.
- Erros globais mostram uma tela legível.
- Dados externos possuem fallback.
- O jogo evita build step para reduzir pontos de falha no Pages.

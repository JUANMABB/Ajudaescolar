# Ajudaescolar

Entorno web de aprendizaje para primaria (Cataluña), pensado para iPad con Apple Pencil.

## Estado
Fase de pruebas técnicas, con un primer taller de juegos (versión 0.3.0):

| Página | Para qué |
|---|---|
| `public/index.html` | Inicio para los padres: comprobaciones automáticas del iPad y prueba del modo infantil |
| `public/pruebas/lapiz.html` | Escritura con Apple Pencil: fluidez, presión, inclinación, palma, dedo, página quieta |
| `public/pruebas/voces.html` | Voces del iPad para dictados en catalán, castellano e inglés |
| `public/taller/` | Taller de reptes para el niño, en catalán: balanzas misteriosas (álgebra), triángulos y ángulos (180°, ángulo escondido, Pitágoras) el caballo saltador (ajedrez y lógica), el espejo (simetrías), qué hora es (horas en catalán), fracciones iguales y el robot programador (bloques y función, como el Cubetto) |

## Cómo está hecho
- Web estática: HTML, CSS y JavaScript sin herramientas de compilación. Lo que hay en el repositorio es exactamente lo que se publica.
- Instalable en la pantalla de inicio (`manifest.webmanifest`) y con funcionamiento sin conexión (`sw.js`).
- Sin dependencias de otros dominios: las fuentes van en `assets/fonts/` (licencia SIL OFL).
- Publicación: Cloudflare Workers con archivos estáticos (`wrangler.jsonc`), conectado a la rama `main`. Cada cambio en `main` se publica solo en https://ajudaescolar.juanmabb.workers.dev
- **Solo se publica la carpeta `public/`.** Todo lo demás (README, configuración, historial) se queda en el repositorio.
- Cloudflare sirve las páginas sin la terminación `.html` (`/pruebas/lapiz`). Los enlaces internos usan esa forma.

## Normas
- **Ningún dato personal del niño en este repositorio** (nombre, perfil, informes, resultados). Esos datos viven solo en el iPad.
- Diseño tranquilo: sin parpadeos, sin cronómetros visibles, errores tratados con amabilidad, sonido desactivable.
- Al cambiar archivos que se guardan para uso sin conexión, subir `VERSION` en `public/sw.js`.

## Estructura
```
wrangler.jsonc         configuración de Cloudflare (publica solo public/)
public/                lo único que se publica
  index.html           inicio de pruebas
  404.html             página amable si un enlace no existe
  pruebas/             páginas de prueba técnica
  taller/              juegos para el niño (en catalán); progreso solo en el iPad
  assets/taller.css, assets/taller.js   estilos y piezas comunes de los juegos
  assets/base.css      fuentes y estilos comunes
  assets/fonts/        fuentes alojadas (Andika, Atkinson Hyperlegible)
  assets/icons/        icono de la pantalla de inicio
  manifest.webmanifest, sw.js, _headers, robots.txt
```

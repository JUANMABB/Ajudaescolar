# Ajudaescolar

Entorno web de aprendizaje para primaria (Cataluña), pensado para iPad con Apple Pencil.

## Estado
Fase de pruebas técnicas (versión 0.1.0):

| Página | Para qué |
|---|---|
| `index.html` | Inicio para los padres: comprobaciones automáticas del iPad y prueba del modo infantil |
| `pruebas/lapiz.html` | Escritura con Apple Pencil: fluidez, presión, inclinación, palma, dedo, página quieta |
| `pruebas/voces.html` | Voces del iPad para dictados en catalán, castellano e inglés |

## Cómo está hecho
- Web estática: HTML, CSS y JavaScript sin herramientas de compilación. Lo que hay en el repositorio es exactamente lo que se publica.
- Instalable en la pantalla de inicio (`manifest.webmanifest`) y con funcionamiento sin conexión (`sw.js`).
- Sin dependencias de otros dominios: las fuentes van en `assets/fonts/` (licencia SIL OFL).
- Publicación: Cloudflare Pages, conectado a la rama `main`. Cada cambio en `main` se publica solo.

## Normas
- **Ningún dato personal del niño en este repositorio** (nombre, perfil, informes, resultados). Esos datos viven solo en el iPad.
- Diseño tranquilo: sin parpadeos, sin cronómetros visibles, errores tratados con amabilidad, sonido desactivable.
- Al cambiar archivos que se guardan para uso sin conexión, subir `VERSION` en `sw.js`.

## Estructura
```
index.html
pruebas/          páginas de prueba técnica
assets/base.css   fuentes y estilos comunes
assets/fonts/     fuentes alojadas (Andika, Atkinson Hyperlegible)
assets/icons/     icono de la pantalla de inicio
manifest.webmanifest, sw.js, _headers, robots.txt
```

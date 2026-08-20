# Prompt de implementación — La casa al final del viento

Construye una experiencia web 3D narrativa basada en el guion de `STORY.md`.

La web debe contar una historia breve sobre unas vacaciones en una casa situada en una isla. El usuario debe avanzar por las escenas mediante scroll, mientras la cámara, los modelos 3D, los textos y la iluminación construyen el ritmo narrativo.

## Skills obligatorias

Las siguientes skills ya están instaladas localmente en el proyecto o en el entorno del agente:

- `greensock/gsap-skills`
- `cloudai-x/threejs-skills`

Utiliza directamente las skills instaladas. No vuelvas a ejecutar comandos de instalación como `npx skills add` y no reemplaces estas skills por una implementación genérica.

Consulta y aplica especialmente:

- GSAP core.
- GSAP timeline.
- GSAP ScrollTrigger.
- GSAP performance.
- GSAP React, si el proyecto utiliza React.
- Three.js fundamentals.
- Three.js loaders.
- Three.js animation.
- Three.js textures.
- Three.js lighting.
- Three.js interaction.

No inventes una solución genérica si las skills proporcionan un patrón específico para Three.js, GSAP, carga de GLB, animaciones o rendimiento.

## Modelos

Utiliza estos archivos GLB:

```text
/home/botom/Descargas/dae_diorama_retake_-_picturesque_holiday_home.glb
/home/botom/Descargas/osprey__flying_raptor_rigged_bird.glb
/home/botom/Descargas/a_macaw_flying_3d_model_free.glb
/home/botom/Descargas/cute+cats+3d+model.glb
/home/botom/Descargas/ramen.glb
/home/botom/Descargas/cofre.glb
```

Copia o integra los modelos en una estructura de assets adecuada para una aplicación estática que pueda desplegarse en GitHub Pages. No dependas de rutas absolutas del sistema local en la aplicación final.

## Requisitos narrativos

Implementa las escenas descritas en `STORY.md`:

1. Loader y llegada a la isla.
2. Casa frente al mar.
3. Águila pescadora y guacamayo.
4. Los dos gatos.
5. El ramen.
6. El sótano y el cofre misterioso.
7. Final abierto con la frase: “Algunas islas no se visitan. Te encuentran.”

Cada escena debe tener:

- Texto narrativo breve.
- Un estado visual identificable.
- Acciones concretas de cámara, modelo o iluminación.
- Entrada y salida animadas.
- Soporte para desplazamiento hacia delante y hacia atrás.

## Carga de modelos

Implementa un loader visible y narrativo que:

- Muestre el progreso general de carga.
- Indique qué escena o asset se está preparando.
- Evite mostrar una pantalla vacía.
- Maneje errores de carga sin romper toda la experiencia.
- No cargue todos los modelos pesados de forma bloqueante al inicio si puede evitarse.
- Precargue el modelo siguiente cuando sea razonable.
- Mantenga el primer render rápido.
- Evite duplicar la carga del mismo modelo.

Utiliza `LoadingManager` o un patrón equivalente y conserva referencias a los recursos cargados para poder liberarlos cuando una escena ya no los necesite.

## Optimización de assets

Inspecciona los GLB antes de integrarlos. Optimiza copias de los archivos originales, nunca los originales directamente.

Evalúa:

- Tamaño del archivo.
- Número de polígonos.
- Número de materiales.
- Número de texturas.
- Resolución de las texturas.
- Animaciones disponibles.
- Draw calls potenciales.

Utiliza Draco o Meshopt para la geometría cuando resulte beneficioso, pero no apliques ambos sin medir el resultado. Configura también el decoder correspondiente en `GLTFLoader`.

Para las texturas:

- Usa 1K como valor general.
- Usa 2K únicamente para modelos protagonistas o primeros planos.
- Usa 512 para assets secundarios si la calidad lo permite.
- Considera WebP para la primera versión.
- Considera KTX2/Basis Universal como optimización posterior si se configura correctamente su transcoder.

Valida los GLB optimizados y comprueba que no se hayan perdido materiales, texturas ni animaciones.

## Animaciones de los modelos

Detecta automáticamente las animaciones incluidas en cada GLB.

- Utiliza `AnimationMixer` para las animaciones internas de Three.js.
- Reproduce clips de vuelo del águila y del guacamayo si están disponibles.
- Reproduce cualquier animación disponible en los gatos.
- Si un modelo no tiene animación, crea un movimiento procedural sutil sin fingir que existe un clip.
- Usa movimientos suaves de flotación, respiración, giro o balanceo solo cuando sean apropiados.
- Actualiza los mixers correctamente en el render loop.
- Libera los mixers y recursos al desmontar la experiencia.

## Uso de GSAP

Usa GSAP para controlar:

- Timeline de introducción.
- Aparición progresiva de la casa.
- Movimiento cinematográfico de la cámara.
- Entrada y salida de cada modelo.
- Transiciones de iluminación.
- Aparición y desaparición del texto.
- Ritmo de las escenas.
- Interacciones del cofre.
- Storytelling controlado por scroll mediante `ScrollTrigger`.

Mantén separadas las responsabilidades:

```text
Three.js AnimationMixer → clips y animaciones internas de los modelos.
GSAP → cámara, textos, iluminación, transiciones y ritmo narrativo.
```

Utiliza timelines que puedan limpiarse correctamente. Evita crear múltiples timelines duplicadas durante re-renderizados. Si se usa React, aplica los patrones de cleanup recomendados por la skill de GSAP.

## Escena y experiencia

La experiencia debe incluir:

- Cámara cinematográfica.
- Iluminación cálida para la casa.
- Iluminación más misteriosa para el sótano.
- Fondo marino o atmosférico coherente.
- Controles de cámara limitados para no romper la narrativa.
- Interacción opcional para explorar los modelos.
- Diseño responsive.
- Soporte básico para dispositivos móviles.
- Respeto por `prefers-reduced-motion`.
- Estados de carga, error y final.

La interfaz debe complementar la escena y no cubrir innecesariamente el modelo.

## GitHub Pages

La aplicación debe poder desplegarse como sitio estático en GitHub Pages.

Verifica especialmente:

- Rutas relativas para modelos, texturas y decoders.
- Configuración correcta del `base path` si el repositorio se publica bajo una subruta.
- No usar rutas absolutas como `/home/botom/Descargas/...` en el código final.
- No depender de un backend para cargar los modelos.
- Configuración de build compatible con GitHub Pages.
- Assets incluidos en el build final.
- Manejo correcto de mayúsculas, minúsculas y espacios en nombres de archivos.

## Verificación

Antes de terminar:

1. Ejecuta el proyecto localmente.
2. Comprueba que todos los GLB se cargan.
3. Comprueba que las texturas aparecen correctamente.
4. Comprueba que las animaciones internas se reproducen.
5. Comprueba que el scroll no crea timelines duplicadas.
6. Comprueba que se puede volver a escenas anteriores.
7. Comprueba el estado de carga y el estado de error.
8. Prueba una ventana móvil o viewport estrecho.
9. Ejecuta la build de producción.
10. Verifica que los paths funcionan en GitHub Pages.
11. Revisa la consola y corrige errores, warnings relevantes y recursos no liberados.

Lee primero `STORY.md` y utiliza sus textos, escenas, modelos y acciones como fuente narrativa principal.

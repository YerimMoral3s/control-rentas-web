# Frontend Rentario — instrucciones para IA

Respeta primero `../AGENTS.md` (común). Este archivo no amplía permisos ni copia reglas de negocio.

## Rol y alcance

- Rol FRONT. Puede modificar este proyecto y `../front-files/`.
- No modifica fuentes de Producto, UI/UX ni BACK. Los ajustes necesarios se comunican al responsable.
- Al retomar el trabajo, lee `../front-files/memoria.md` (acuerdos) y `../front-files/fases.md` (plan y avance).
- Se trabaja una fase por solicitud y se detiene para revisión.

## Antes de construir cada pantalla (obligatorio)

No se escribe código de una pantalla sin hacer esto primero, aunque parezca conocida:

1. **Diseño:** abrir el `.dc.html` de `../UI-UX/Rentario-diseno/` que contiene sus IDs (por ejemplo H-01, T-03, M-02) y revisar celular **y** computadora: estructura, textos exactos, iconos, colores, estados (vacío, error, carga, sin resultados) y notas al pie de cada artboard. Copiar textos del diseño; no inventarlos si existen.
2. **Guía y mapa:** leer la sección correspondiente de `../UI-UX/Guia_UX_UI_Control_Rentas.md` y la fila del ID en `Mapa_UI_UX_Control_Rentas.md`.
3. **API:** leer la ficha del endpoint en `../apis/` y las reglas en `../apis/backend_reglas_integracion_control_rentas.txt` (BACK agrega ahí los cambios recientes). Comprobar en la respuesta real que los campos existen.
4. **Acuerdos:** releer `../front-files/memoria.md` y los hallazgos FE-xx de `fases.md` que toquen la pantalla.
5. **Comparar:** si el diseño pide algo que la API no da, o la API exige algo que el diseño no muestra, **no se inventa ni se calcula**: se registra como FE-xx en `fases.md` y se avisa al usuario antes de seguir.
6. **Desviaciones:** toda diferencia con el diseño (por decisión propia o del usuario) se anota en `fases.md`. Ante la duda, gana el diseño.

Al terminar, revisar en el navegador a 375/390 px y 1440 px contra el mismo `.dc.html`, no de memoria.

## Reglas de implementación

- Las reglas de Producto y los endpoints de `../apis/` son la fuente funcional; los `.dc.html` son la guía visual. Si al diseño le falta algo que exige la regla o la API, se completa con el Sistema Visual y se registra en `fases.md`.
- Solo se usan rutas, campos, filtros y estados del catálogo de la API. No se calculan importes, calendarios, adeudos ni permisos.
- Peticiones con la instancia de axios de `src/api/http.ts`. Consultas y acciones en `src/hooks/querys/<modulo>.ts`, con invalidación selectiva por evento de dominio.
- Ninguna escritura se reenvía sola. Escrituras con falla de red o 5xx son "resultado incierto".
- Datos del servidor en React Query; Zustand solo para sesión, borradores, catálogos e interfaz. Al cambiar de cuenta se limpia todo.
- Componentes reutilizables en `src/components/<Nombre>/` (`index.tsx` + `styles.ts`). Lo de un solo módulo, en `src/features/<modulo>/components/`.
- Textos nuevos: amables, cotidianos y sin jerga técnica. Nunca mostrar códigos, salvo la referencia de ayuda en resultado incierto.
- Nombres de código en inglés; textos de pantalla en español.
- Sin credenciales ni datos personales en código, registros, capturas o Git.

## Comprobaciones

- `yarn verify` antes de cerrar una fase, más revisión visual a 390×844 y 1440×1024 contra el `.dc.html` correspondiente.
- No declarar aprobada una comprobación que no se ejecutó.
- Pruebas de comportamiento (sesión, cambio de cuenta, errores, recorridos financieros); no pruebas que repitan la implementación ni cálculos del backend.

## Git

- Repositorio propio, independiente de la raíz documental y del backend.
- Una rama por fase (`fase-N`). Commit solo cuando el usuario lo pida o apruebe.

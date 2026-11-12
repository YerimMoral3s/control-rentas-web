# control-rentas-web

Frontend de **Rentario** (Control Rentas): React, TypeScript y Vite.

Plan, avance y pendientes: [`../front-files/fases.md`](../front-files/fases.md). Acuerdos de trabajo: [`../front-files/memoria.md`](../front-files/memoria.md).

## Requisitos

- Node 24 (`.nvmrc`) y Yarn 1.22.
- Backend [`control-rentas-api`](../control-rentas-api/README.md) corriendo en local para integrar.

## Instalar y configurar

```bash
yarn install
cp .env.example .env
```

| Variable            | Para qué                              | Local                      |
| ------------------- | ------------------------------------- | -------------------------- |
| `VITE_API_BASE_URL` | URL base de la API, ya incluye `/v1`. | `http://localhost:3000/v1` |

No hay secretos en el frontend. Nunca se escriben credenciales en código, documentación ni Git.

El backend debe aceptar el origen del frontend: agrega `http://localhost:5173` a `CORS_ALLOWED_ORIGINS` en el `.env` del backend.

## Ejecutar

```bash
yarn dev        # http://localhost:5173
```

En desarrollo existe `/dev/fundamentos`: galería interna de componentes para compararlos con "00 Fundamentos" y una prueba de conexión con `GET /health`.

## Comprobar

| Comando                             | Qué hace                                              |
| ----------------------------------- | ----------------------------------------------------- |
| `yarn format` / `yarn format:check` | Prettier: corrige / comprueba formato.                |
| `yarn typecheck`                    | TypeScript (`tsc --noEmit`).                          |
| `yarn lint` / `yarn lint:fix`       | ESLint, incluye reglas de hooks y accesibilidad.      |
| `yarn test`                         | Pruebas de comportamiento (Vitest + Testing Library). |
| `yarn build`                        | Tipos y compilación de producción.                    |
| `yarn knip` / `yarn knip:deps`      | Código y dependencias sin uso.                        |
| `yarn verify`                       | format:check + typecheck + lint + test + build.       |

**Antes de cada commit** (husky): `yarn typecheck`, `yarn knip:deps` y `lint-staged` (ESLint `--fix` y Prettier sobre los archivos preparados). Si algo falla, el commit se detiene.

Prettier y TypeScript no sustituyen las pruebas de comportamiento ni la revisión visual contra `UI-UX/Rentario-diseno/*.dc.html`.

## Estructura

```
src/
  app/            arranque, rutas, proveedores y marco con navegación
  api/            axios, tipos del contrato común, errores y un archivo por módulo
  hooks/querys/   consultas y acciones por módulo (useBaseQuery, useMutation, invalidación)
  stores/         Zustand: sesión, borradores y catálogos
  components/     componentes reutilizables (index.tsx + styles.ts)
  features/       pantallas por módulo; components/ propios de cada módulo
  lib/            formato, request id y registro de desarrollo
  styles/         tema con los tokens del Sistema Visual y estilos globales
```

## Fuentes oficiales

- Producto: `../reglas_de_negocio.txt`, `../entidades_clave.txt`, `../conceptos_de_apoyo.txt`, `../seguridad_y_acceso.txt`, `../flujos*.txt`.
- API: `../apis/` (contrato común, reglas de integración y fichas por módulo) y la colección Postman del backend.
- Diseño: `../UI-UX/Rentario-diseno/*.dc.html`, `../UI-UX/assets/rentario/` y las guías de `../UI-UX/`.

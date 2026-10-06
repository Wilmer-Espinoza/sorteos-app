# Sorteos Jornadas Académicas

Aplicación web estática para sorteos institucionales de UNEMI / EPUNEMI. Usa una lista vertical animada, selección criptográfica, persistencia local y un modo presentación diseñado para auditorios; no usa ruleta, cuentas ni servicios externos.

## Ejecutar localmente

Requiere Node.js 22.12 o superior.

```bash
npm install
npm run dev
```

Vite mostrará la dirección local, normalmente `http://localhost:5173`.

## Pruebas y build

```bash
npm run test
npm run build
npm run preview
```

El build queda en `dist/`. Vite usa `base: './'`, por lo que los recursos funcionan tanto en la raíz como en una ruta de GitHub Pages (`usuario.github.io/repositorio/`).

## Publicar en GitHub Pages

1. Sube el proyecto a GitHub (`git add .`, `git commit`, `git push`).
2. Abre **Settings → Pages** en el repositorio.
3. En **Build and deployment**, selecciona **GitHub Actions**.
4. El flujo `.github/workflows/deploy.yml` ejecutará las pruebas, compilará y publicará `dist/` en cada push a `main` o `master`.

## Identidad visual y presentación

Los recursos originales entregados para Jornadas Académicas se encuentran en `public/assets/` y se cargan mediante rutas relativas:

- `logo-jornadas.png`: cabecera, presentación y tarjeta del ganador.
- `logo-epunemi.svg`: marca EPUNEMI.
- `logo-unemi-epunemi.png`: firma institucional secundaria.
- `logo-unemi.png`: recurso institucional original disponible para futuras composiciones.

No cambies la relación de aspecto. La interfaz usa `object-fit: contain` para evitar deformaciones.

En **Configuración → Apariencia** se pueden cambiar logos, colores y textos sin editar código. Los logos personalizados se guardan como datos locales dentro de IndexedDB. La configuración visual se puede exportar e importar como JSON y el respaldo general también la incluye.

El botón **Pantalla completa** usa la Fullscreen API y reacciona a `fullscreenchange`; si el navegador no ofrece esa API, mantiene el mismo layout de presentación dentro de la página. `Esc` o el control discreto **Salir de pantalla completa** restauran la interfaz administrativa.

## Persistencia y respaldos

- Las bases, configuraciones, exclusiones, historial e identidad visual se guardan automáticamente en IndexedDB.
- La configuración también tiene una copia pequeña en `localStorage`.
- Cuando el navegador lo permite, la aplicación solicita almacenamiento persistente con `navigator.storage.persist()`.
- **Configuración → Zona de datos → Exportar respaldo** descarga `backup-sorteos-jornadas.json`.
- **Restaurar respaldo** valida el archivo y pide confirmación antes de reemplazar datos.

Los datos siguen perteneciendo al navegador y pueden desaparecer si una persona borra manualmente los datos del sitio. Conviene descargar respaldos periódicos antes de un evento.

## Integridad y aleatoriedad

`ParticipantList.participants` es la base maestra. Un sorteo nunca elimina participantes: los identificadores de ganadores y excluidos se guardan por separado. **Reintegrar todos** limpia esos estados sin recrear registros.

La selección usa `crypto.getRandomValues()` y rejection sampling para obtener índices uniformes sin sesgo de módulo. Para varios ganadores, la selección normal es sin reemplazo. El modo de probabilidades personalizadas está desactivado por defecto.

## Importación y exportación

- Importación: TXT, CSV, XLSX y XLS.
- En CSV/Excel se puede elegir la columna del nombre; las demás columnas se conservan como metadatos.
- Exportación: participantes en CSV/XLSX, historial en CSV y tarjeta del ganador en PNG.
- Los posibles duplicados se mantienen en la base maestra. Se pueden ignorar únicamente al calcular elegibles.

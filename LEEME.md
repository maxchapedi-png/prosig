# PROSIG – App Android 100 % sin conexión (sin servidor, sin base de datos)

Los datos se guardan en el propio teléfono. No requiere internet, XAMPP, PHP ni MySQL.

## Qué incluye
- Los 194 módulos del catálogo PROSIG (+ submódulos: sedes, puestos, organigrama, CRM, inducciones, simulacros…).
- Formularios reales por módulo (164 con campos propios tomados de tus `config.php`), tablas de detalle con filas
  de ejemplo, listas desplegables, colores de estado, firma con el dedo.
- Cálculos automáticos portados de PHP (nivel de riesgo P×S, cumplimiento %, estados Vigente/Por vencer/Vencida, audiometría,
  espirometría, KPI, factura con IGV, notificación a autoridad con plazos, etc.).
- Alertas de vencimiento, búsqueda global, exportar CSV por módulo, vista de documento con **Imprimir / guardar PDF**.
- 10 matrices (IPERC minería/construcción/industrial/administrativa, EPP, capacitación…) y 66 normas peruanas precargadas.
- Respaldo: exportar/importar `.json` (se guarda en Descargas).

## No incluido (requería servidor)
Inicio de sesión multiusuario/roles, doble factor, multiempresa (la app es una sola empresa), correo, mapa 3D, importar Excel,
dashboards gráficos, subida de adjuntos/fotos y los datos demo de 7 MB. Los datos viven solo en el teléfono: haz respaldos.

## Generar el APK
**A) Android Studio:** abrir esta carpeta → Build → Build APK(s). Sale en `app/build/outputs/apk/`.
**B) GitHub (sin instalar nada):** subir la carpeta a un repo → pestaña Actions → "Build APK" → descargar `PROSIG-apk`.
**C) Terminal:** `gradle assembleRelease` (JDK 17 + Android SDK 34).

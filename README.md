# 🤖 Telegram Bot to Google Sheets Logger

Este proyecto contiene un script de **Google Apps Script** que crea un bot de Telegram interactivo. El bot guía al usuario a través de un formulario de 10 pasos y guarda las respuestas automáticamente en una **Google Sheet** en tiempo real.

Es ideal para registrar actividades, reportes de ventas, tickets de soporte o tareas diarias directamente desde el móvil sin abrir la hoja de cálculo.

## 🚀 Características

* **Registro Conversacional:** Interfaz paso a paso (Wizard) dentro de Telegram.
* **Validación de Datos:** Verifica fechas (DD/MM/YYYY) y campos vacíos.
* **Teclados Interactivos:** Usa botones de selección rápida para opciones predefinidas.
* **Control de Acceso:** Lista blanca (`ALLOWED_USERS`) para restringir quién puede usar el bot.
* **Integración Directa:** No requiere servidores externos, corre 100% en Google Apps Script.
* **Persistencia de Estado:** Guarda el progreso del formulario si la conversación se interrumpe.

## 📋 Requisitos Previos

1.  Una cuenta de **Google** (para acceder a Sheets y Apps Script).
2.  Una cuenta de **Telegram**.
3.  Un bot creado con [@BotFather](https://t.me/BotFather) (necesitarás el API Token).

## ⚙️ Configuración e Instalación

### Paso 1: Preparar la Google Sheet
1.  Crea una nueva hoja de cálculo en Google Sheets.
2.  Copia el **ID de la hoja** (se encuentra en la URL: `docs.google.com/spreadsheets/d/ID_DE_LA_HOJA/edit...`).
3.  Renombra la pestaña inferior a `Actividades` (o el nombre que prefieras, pero recuérdalo).
4.  Crea los encabezados en la primera fila (Fila 1) en este orden exacto:
    * `A1`: Fecha Creación
    * `B1`: Medio
    * `C1`: Condición
    * `D1`: Cliente
    * `E1`: Vencimiento
    * `F1`: Asunto
    * `G1`: Prioridad
    * `H1`: Descripción
    * `I1`: Team
    * `J1`: Respuesta
    * `K1`: Estado
    * `L1`: Fuente

### Paso 2: Configurar el Script
1.  En tu Google Sheet, ve a **Extensiones > Apps Script**.
2.  Borra cualquier código que aparezca y pega el contenido del archivo `Code.gs` (o el código proporcionado en este repo).
3.  Edita la sección de **CONFIGURACIÓN** al inicio del código con tus datos:

```javascript
// ======================================================================
// CONFIGURACIÓN
// ======================================================================
const TOKEN = '123456789:ABCdefGHIjklMNOpqRSTuvwXYZ'; // Tu Token de BotFather
const ID_SHEET = '1xY2z3_ID_DE_TU_HOJA_DE_CALCULO_AQUI'; // El ID largo de la URL de tu Sheet
const SHEET_NAME = 'Actividades'; // El nombre exacto de la pestaña
const ALLOWED_USERS = ['12345678', '87654321']; // Tu ID de Telegram (usa IDBot para saber cuál es)

### Paso 3: Desplegar como Aplicación Web
1.  Haz clic en el botón azul **Implementar** (Deploy) > **Nueva implementación**.
2.  En "Seleccionar tipo", elige **Aplicación web**.
3.  Configura lo siguiente:
    * **Descripción:** `Bot Telegram v1`
    * **Ejecutar como:** `Yo` (tu email).
    * **Quién tiene acceso:** `Cualquier persona` (Esto es necesario para que Telegram pueda enviar datos al script, pero la seguridad la manejamos con `ALLOWED_USERS` dentro del código).
4.  Haz clic en **Implementar**.
5.  Copia la **URL de la aplicación web** generada (termina en `/exec`).
6.  Pega esa URL en la variable `WEB_APP_URL` dentro de tu código:

```javascript
const WEB_APP_URL = '[https://script.google.com/macros/s/TU_URL_LARGA_AQUI/exec](https://script.google.com/macros/s/TU_URL_LARGA_AQUI/exec)';

## Paso 4: Activar el Webhook
1. Guarda el código (`Ctrl + S`).
2. Dentro del editor de Apps Script, selecciona la función **`setWebhook`** en la barra de herramientas superior.
3. Haz clic en **Ejecutar**.
4. Acepta los permisos que solicita Google.
5. Si ves un log que dice `{"ok":true, "result":true...}`, ¡tu bot está listo!

---

## 🎮 Uso
1. Abre tu bot en Telegram.
2. Envía el comando `/registro` o `/start`.
3. El bot te hará 10 preguntas. Responde escribiendo o usando los botones.
4. Al finalizar, recibirás una confirmación y los datos aparecerán automáticamente en tu Google Sheet.

---

## 🛠 Personalización
Puedes editar la constante **`FIELDS`** en el código para cambiar las preguntas, las opciones de los menús desplegables o las validaciones.

**Ejemplo para cambiar las opciones del equipo:**

```javascript
{ 
  key: 'team', 
  type: 'select', 
  question: 'Paso 8/10: ¿A qué **Team** está asignada?', 
  options: ['Soporte', 'Ventas', 'Desarrollo', 'Administración'] // Edita esto
},

## 📄 Licencia
Este proyecto es de código abierto. Siéntete libre de usarlo y modificarlo para tus necesidades personales o empresariales.
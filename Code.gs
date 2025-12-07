// ======================================================================
// CONFIGURACIÓN (REEMPLAZA ESTOS VALORES) - Richard-Dev
// ======================================================================
// 1. TOKEN: El token que te dio BotFather.
const TOKEN = '123456789:AAF_testToken_EJEMPLO_9j_pX_qR_sT_uV_wX'; 

// 2. WEB_APP_URL: La URL obtenida al desplegar el script como Aplicación Web.
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx_TEST_WEBAPP_URL_AQUI_EJEMPLO_EXEC'; 

// 3. ID_SHEET: El ID largo de la URL de tu hoja de cálculo.
const ID_SHEET = '1aB2c3D4e5F6g7H8i9J0kL1mN2oP3qR4sT5uV6wX7yZ8';

// 4. SHEET_NAME: El nombre exacto de la pestaña (ej. Actividades, Datos).
const SHEET_NAME = 'Registro_Actividades'; 

// 5. IDs de Telegram autorizados (deben ser strings). 
// Solo estos usuarios podrán usar el bot.
const ALLOWED_USERS = ['1000000001', '1000000002']; 

// URL base de Telegram (se construye automáticamente) y acceso a Google Sheet.
const URL_BASE = "https://api.telegram.org/bot" + TOKEN;
const DATA_SHEET = SpreadsheetApp.openById(ID_SHEET).getSheetByName(SHEET_NAME);
const PROPERTIES = PropertiesService.getScriptProperties();


// ======================================================================
// DEFINICIONES DE CAMPOS Y TECLADOS (AHORA SON SOLO 5 PASOS)
// ======================================================================

const FIELDS = [
  { key: 'cliente', type: 'text', question: 'Paso 1/5: Por favor, escribe el nombre del **Cliente**:', validation: /.+/, error: 'El nombre del cliente no puede estar vacío.' },
  { key: 'asunto', type: 'text', question: 'Paso 2/5: Escribe el **Asunto** (título) de la actividad:', validation: /.+/, error: 'El asunto no puede estar vacío.' },
  { key: 'prioridad', type: 'select', question: 'Paso 3/5: ¿Cuál es la **Prioridad**?', options: ['ALTA', 'MEDIA', 'BAJA'] },
  { key: 'descripcion', type: 'text', question: 'Paso 4/5: Escribe la **Descripción** detallada de la Actividad:', validation: /.+/, error: 'La descripción no puede estar vacía.' },
  { key: 'estado', type: 'select', question: 'Paso 5/5: ¿Cuál es el **Estado** actual de la actividad?', options: ['Por iniciar', 'En Curso', 'Pendiente/Info Cliente', 'Seguimiento', 'Cerrado'] }
];

// ======================================================================
// UTILIDADES DE ESTADO (PropertiesService)
// ======================================================================

/**
 * Obtiene el estado de conversación del usuario (en qué paso está y datos recolectados).
 * @param {string} chatId - ID del chat.
 * @returns {Object} El estado del usuario o un estado inicial.
 */
function getUserState(chatId) {
  const data = PROPERTIES.getProperty(chatId);
  if (data) {
    return JSON.parse(data);
  }
  // Estado inicial
  return { step: 0, data: {} };
}

/**
 * Guarda el estado de conversación del usuario.
 * @param {string} chatId - ID del chat.
 * @param {Object} state - Objeto de estado a guardar.
 */
function saveUserState(chatId, state) {
  try {
    PROPERTIES.setProperty(chatId, JSON.stringify(state));
  } catch (e) {
    Logger.log("Error al guardar estado de usuario: " + e.toString());
  }
}

/**
 * Limpia el estado de conversación del usuario.
 * @param {string} chatId - ID del chat.
 */
function clearUserState(chatId) {
  PROPERTIES.deleteProperty(chatId);
}

// ======================================================================
// FUNCIONES DE TELEGRAM
// ======================================================================

/**
 * Envía un mensaje de texto.
 * @param {string} chatId - ID del chat.
 * @param {string} text - Mensaje a enviar.
 * @param {Object} [keyboard=null] - Teclado opcional a enviar.
 */
function sendText(chatId, text, keyboard = null) {
  const payload = {
    method: 'sendMessage',
    chat_id: String(chatId),
    text: text,
    parse_mode: 'HTML',
  };
  
  if (keyboard) {
    payload.reply_markup = JSON.stringify(keyboard);
  }
  
  const options = {
    method: 'post',
    payload: payload,
  };
  
  try {
    UrlFetchApp.fetch(URL_BASE + '/', options);
  } catch (e) {
    Logger.log("Error al enviar mensaje: " + e.toString());
  }
}

/**
 * Envía un teclado de botones personalizados.
 * @param {string} chatId - ID del chat.
 * @param {string} question - Texto de la pregunta.
 * @param {Array<string>} options - Array de opciones para los botones.
 */
function sendCustomKeyboard(chatId, question, options) {
  const buttons = options.map(option => [{ text: option }]);
  
  const keyboard = {
    keyboard: buttons,
    resize_keyboard: true,
    one_time_keyboard: true
  };
  
  sendText(chatId, question, keyboard);
}

/**
 * Elimina el teclado al finalizar el registro.
 * @param {string} chatId - ID del chat.
 * @param {string} text - Mensaje final.
 */
function removeKeyboard(chatId, text) {
  const keyboard = {
    remove_keyboard: true
  };
  sendText(chatId, text, keyboard);
}


// ======================================================================
// LÓGICA DE PROCESAMIENTO
// ======================================================================

/**
 * Procesa la respuesta de un paso y avanza al siguiente.
 * @param {string} chatId - ID del chat.
 * @param {string} input - El texto o la selección del usuario.
 * @param {Object} state - El estado actual del usuario.
 */
function processStep(chatId, input, state) {
  // El estado usa step (1-5), el índice de array usa (0-4)
  const currentStepIndex = state.step - 1; 
  
  // Si el índice es inválido (fuera de rango de las preguntas), reiniciamos.
  if (currentStepIndex < 0 || currentStepIndex >= FIELDS.length) {
    Logger.log(`Error de estado: currentStepIndex (${currentStepIndex}) fuera de rango.`);
    clearUserState(chatId);
    removeKeyboard(chatId, "⚠️ **Error de conversación.** Por favor, intenta de nuevo con el comando /registro.");
    return;
  }
  
  const currentField = FIELDS[currentStepIndex];

  // Bandera para saber si se debe volver a preguntar
  let shouldReask = false;
  let errorMessage = '';

  // 1. VALIDACIÓN
  if (currentField.type === 'select') {
    // Para campos de selección, validar que la entrada sea una de las opciones
    const normalizedOptions = currentField.options.map(opt => opt.toLowerCase());
    if (!normalizedOptions.includes(input.toLowerCase())) {
      errorMessage = `❌ **Error de Selección:** La opción "${input}" no es válida. Por favor, elige una de las opciones: ${currentField.options.join(', ')}.`;
      shouldReask = true;
    }
  } else if (currentField.validation) {
    // Para campos de texto con validación regex
    const regex = currentField.validation;
    if (!regex.test(input)) {
      errorMessage = `❌ **Error:** ${currentField.error || 'El formato de la respuesta es incorrecto.'} Vuelve a ingresar el dato.`;
      shouldReask = true;
    }
  }

  // Si falló la validación, volvemos a hacer la pregunta con el teclado correcto
  if (shouldReask) {
    sendText(chatId, errorMessage); // Enviamos el error primero
    
    if (currentField.type === 'select') {
      sendCustomKeyboard(chatId, currentField.question, currentField.options);
    } else {
      // Re-preguntar un campo de texto y asegurar que no hay teclado
      removeKeyboard(chatId, currentField.question); 
    }
    // No avanzamos el paso y guardamos el estado sin cambios.
    saveUserState(chatId, state); 
    return;
  }
  
  // 2. Guardar la respuesta actual en el estado (Solo si la validación es exitosa)
  state.data[currentField.key] = input;

  // 3. Avanzar al siguiente paso
  const nextStepIndex = currentStepIndex + 1;
  state.step = nextStepIndex + 1; // Step para el estado es 1-based (1 a 5)

  // 4. Determinar si hay más preguntas o si el formulario terminó
  if (nextStepIndex < FIELDS.length) {
    // Aún hay preguntas. Preguntar la siguiente.
    const nextField = FIELDS[nextStepIndex];
    
    if (nextField.type === 'select') {
      sendCustomKeyboard(chatId, nextField.question, nextField.options);
    } else {
      // Para campos de texto, asegurar que se remueve el teclado
      removeKeyboard(chatId, nextField.question); 
    }
    
    saveUserState(chatId, state);

  } else {
    // FORMULARIO COMPLETADO: Guardar datos y finalizar.
    
    // Obtener los valores en el orden de los campos + Fecha Creación
    const dateCreated = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    // El orden de las columnas en Sheets debe ser (7 columnas en total): 
    // Col 1: Fecha Creación (automático)
    // Col 2: Cliente
    // Col 3: Asunto
    // Col 4: Prioridad
    // Col 5: Descripción
    // Col 6: Estado
    // Col 7: Fuente (automático)

    // Asegúrate de que los encabezados de tu Google Sheet (Fila 1) coincidan.
    const row = [
      dateCreated, 
      state.data.cliente,
      state.data.asunto,
      state.data.prioridad,
      state.data.descripcion,
      state.data.estado,
      "Telegram" // Valor fijo para saber que viene de este bot
    ];
    
    try {
      DATA_SHEET.appendRow(row);
      
      const successMessage = `
        ✅ **Registro Completado Exitosamente**
        
        Se ha guardado una nueva actividad en la hoja "${SHEET_NAME}".
        
        **Resumen de la Tarea:**
        • Cliente: ${state.data.cliente}
        • Asunto: ${state.data.asunto}
        • Prioridad: ${state.data.prioridad}
        • Estado: ${state.data.estado}
        • Fuente: Telegram

        Puedes iniciar un nuevo registro con el comando /registro.
      `;
      removeKeyboard(chatId, successMessage);
      clearUserState(chatId);
      
    } catch (e) {
      removeKeyboard(chatId, `⚠️ **Error al guardar:** No se pudo escribir en la hoja de cálculo. Revisa que el ID y el nombre de la hoja sean correctos y que tengas permiso de edición. Error: ${e.message}`);
      Logger.log("Error al guardar en Sheets: " + e.toString());
    }
  }
}

// ======================================================================
// FUNCIÓN PRINCIPAL doPost(e) - MANEJA LAS PETICIONES DE TELEGRAM
// ======================================================================

function doPost(e) {
  const update = JSON.parse(e.postData.contents);
  
  if (!update.message) return;

  const message = update.message;
  const chatId = String(message.chat.id);
  
  // ----------------------------------------------------
  // A. VALIDACIÓN DE AUTORIZACIÓN 
  // ----------------------------------------------------
  // Si la lista de usuarios autorizados no está vacía, verifica el acceso.
  if (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(chatId)) {
    const unauthorizedMessage = "❌ **Acceso Denegado:** No estás autorizado para usar este bot. Por favor, contacta al administrador.";
    sendText(chatId, unauthorizedMessage);
    Logger.log(`Intento de acceso no autorizado desde Chat ID: ${chatId}`);
    return; // Detiene la ejecución si el usuario no está autorizado
  }
  // ----------------------------------------------------

  // Normalizar el texto del mensaje para manejo de comandos y respuestas.
  const rawText = message.text || '';
  // Quita @nombre_bot si está en un grupo
  const cleanText = rawText.toLowerCase().split('@')[0].trim(); 
  const username = message.from.username || message.from.first_name;
  
  let state = getUserState(chatId);

  // MANEJO DE COMANDOS
  if (cleanText === '/registro' || cleanText === '/start') {
    clearUserState(chatId); // Borra cualquier registro a medias
    state = { step: 1, data: {} }; // Reinicia el estado a PASO 1

    const firstField = FIELDS[0];
    // Ahora se indica que son 5 pasos en total
    sendCustomKeyboard(chatId, `¡Hola, **${username}**! 👋\n\nVamos a iniciar el registro de la actividad. Hay **${FIELDS.length} pasos**. \n\n${firstField.question}`, firstField.options);
    saveUserState(chatId, state);
    return;
  }
  
  // MANEJO DE CONVERSACIÓN 
  // Si no es un comando y el usuario está en un paso (state.step 1 a 5)
  if (state.step >= 1 && state.step <= FIELDS.length) {
    // Si el usuario está en un paso, procesamos su respuesta.
    processStep(chatId, rawText.trim(), state);
    
  } else if (cleanText) {
    // Si no está en un registro, pero envió un mensaje que no es comando.
    Logger.log(`Comando desconocido/Estado perdido. cleanText: ${cleanText}, state: ${JSON.stringify(state)}`);
    sendText(chatId, "Comando desconocido. Por favor, inicia el proceso de registro con el comando: /registro");
  }
}

// ======================================================================
// FUNCIÓN WEBHOOK - SE DEBE EJECUTAR MANUALMENTE UNA VEZ
// ======================================================================

function setWebhook() {
  // Esto vincula el bot de Telegram a la URL de la Aplicación Web de Google.
  const response = UrlFetchApp.fetch(URL_BASE + "/setWebhook?url=" + WEB_APP_URL);
  Logger.log(response.getContentText());
}
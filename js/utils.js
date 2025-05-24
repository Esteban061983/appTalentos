// js/utils.js

// Mapeo de tipos de prueba para mostrar en la tabla y analisis
const testTypeMap = {
    speed30m: 'Velocidad 30m',
    situps30s: 'Abdominales Rectos 30s',
    obliqueSitups30s: 'Abdominales Inferiores 30s',
    longJump: 'Salto Largo',
    flexibility: 'Flexibilidad',
    ropeJumps1min: 'Saltos con soga en 1 min',
    run500m: '500 metros',
    pushups30s: 'Flexiones en 30 segundos'
};

// Mapeo de nombres de propiedades a encabezados de columna en espanol para CSV
const csvHeadersMap = {
    'id': 'ID_Registro', // Anadir ID para exportacion/importacion
    'name': 'Nombre',
    'age': 'Edad',
    'sex': 'Sexo',
    'height': 'Estatura (cm)',
    'course': 'Curso',
    'school': 'Escuela',
    'district': 'Distrito',
    'testType': 'Tipo de Prueba',
    'date': 'Fecha',
    'result': 'Resultado',
    'academicYear': 'Ciclo Lectivo'
};

// Umbrales para fortalezas y debilidades (porcentaje de diferencia con el promedio de la misma edad)
const STRENGTH_THRESHOLD_PERCENTAGE = 15; // Considerar fortaleza si es X% mejor
const SIMILAR_TO_AVERAGE_THRESHOLD_PERCENTAGE = 5; // Considerar similar si está dentro de este porcentaje (no se muestra análisis de categoría)
const SIGNIFICANTLY_BELOW_THRESHOLD_PERCENTAGE = 10; // Considerar debilidad si es X% peor que el promedio
const MIN_PARTICIPANTS_FOR_RANKING = 5; // Mínimo de alumnos para calcular ranking

// Unidades de medida para cada prueba
const testUnits = {
    speed30m: 's',
    situps30s: ' reps',
    obliqueSitups30s: ' reps',
    longJump: ' cm',
    flexibility: ' cm',
    ropeJumps1min: ' reps',
    run500m: 's',
    pushups30s: ' reps'
};

// Indica si un valor menor es mejor (true) o si un valor mayor es mejor (false)
const isLowerBetterMap = {
    speed30m: true,
    situps30s: false,
    obliqueSitups30s: false,
    longJump: false,
    flexibility: false,
    ropeJumps1min: false,
    run500m: true,
    pushups30s: false
};


// Funciones de utilidad

/**
 * Genera un ID único.
 * @returns {string} Un ID único.
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Normaliza una cadena para comparación (sin tildes, minúsculas, espacios y caracteres especiales removidos).
 * @param {string} str - La cadena a normalizar.
 * @returns {string} La cadena normalizada.
 */
function normalizeString(str) {
    if (typeof str !== 'string') {
        return '';
    }
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Formatea una fecha de ISO (YYYY-MM-DD) a DD/MM/YYYY.
 * @param {string} isoDateString - Fecha en formato ISO.
 * @returns {string} Fecha en formato DD/MM/YYYY.
 */
function formatDateFromISO(isoDateString) {
    if (!isoDateString) return '';
    try {
        const date = new Date(isoDateString);
        // Ajustar la fecha para la zona horaria local y evitar desajustes por UTC
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() + userTimezoneOffset);

        const day = String(localDate.getDate()).padStart(2, '0');
        const month = String(localDate.getMonth() + 1).padStart(2, '0'); // Meses son 0-11
        const year = localDate.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        console.error("Error formatting date:", isoDateString, e);
        return isoDateString; // Retorna original si hay error
    }
}

/**
 * Parsea una fecha de DD/MM/YYYY a ISO (YYYY-MM-DD).
 * @param {string} dateString - Fecha en formato DD/MM/YYYY.
 * @returns {string} Fecha en formato ISO.
 */
function parseDateToISO(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    // Si ya está en ISO, o si es un formato de fecha válido que el constructor de Date puede manejar directamente
    try {
        const date = new Date(dateString);
        if (!isNaN(date)) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        console.error("Error parsing date to ISO:", dateString, e);
    }
    return dateString; // Retorna original si hay error
}

/**
 * Obtiene el ciclo lectivo (año académico) de una fecha.
 * Se considera que el ciclo lectivo cambia en marzo.
 * @param {string} isoDateString - La fecha en formato ISO (YYYY-MM-DD).
 * @returns {string} El ciclo lectivo (ej. "2023-2024").
 */
function getAcademicYear(isoDateString) {
    if (!isoDateString) return '';
    const date = new Date(isoDateString);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 para enero, 1 para febrero, etc.

    // Si el mes es de enero (0) o febrero (1), pertenece al ciclo lectivo del año anterior
    if (month < 2) { // Enero o Febrero
        return `${year - 1}-${year}`;
    } else { // Marzo (2) en adelante
        return `${year}-${year + 1}`;
    }
}


/**
 * Restaura la visualización de una fila de tabla después de una edición inline.
 * @param {HTMLTableRowElement} row - La fila de la tabla.
 * @param {Object} record - El objeto de registro con los datos actualizados.
 */
function restoreRowDisplay(row, record) {
    const cells = row.querySelectorAll('td');
    if (cells[0]) cells[0].textContent = formatDateFromISO(record.date);
    if (cells[1]) cells[1].textContent = testTypeMap[record.testType] || record.testType;
    if (cells[2]) cells[2].textContent = record.result;
    if (cells[3]) cells[3].textContent = record.academicYear;
    if (cells[4]) cells[4].innerHTML = `
        <button class="edit-record-btn inline-action-btn" data-id="${record.id}" title="Editar Registro"><i class="fas fa-edit"></i> Editar</button>
        <button class="delete-record-btn inline-action-btn" data-id="${record.id}" title="Eliminar Registro"><i class="fas fa-trash-alt"></i> Eliminar</button>
    `;
}

/**
 * Muestra un mensaje temporal (toast) al usuario.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - Tipo de mensaje: 'success', 'error', 'info', 'warning'.
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.warn('Toast container not found.');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast-message p-3 rounded-md shadow-md text-white ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Animación de entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // Pequeño retraso para permitir que la clase se aplique

    // Animación de salida y remoción
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide'); // Para la animación de salida
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000); // Duración visible antes de empezar a desaparecer
}

/**
 * Obtiene los valores de los filtros de la sección "Ver Alumnos".
 * @returns {Object} Un objeto con los filtros aplicados.
 */
function getViewFilters() {
    const ageSelect = document.getElementById('view-filter-age');
    const sexSelect = document.getElementById('view-filter-sex');
    const courseSelect = document.getElementById('view-filter-course');
    const schoolSelect = document.getElementById('view-filter-school');
    const districtSelect = document.getElementById('view-filter-district');
    const heightInput = document.getElementById('view-filter-height');

    return {
        age: ageSelect ? ageSelect.value : '',
        sex: sexSelect ? sexSelect.value : '',
        course: courseSelect ? courseSelect.value : '',
        school: schoolSelect ? schoolSelect.value : '',
        district: districtSelect ? districtSelect.value : '',
        minHeight: heightInput ? heightInput.value : ''
    };
}


/**
 * Popula un contenedor con radio buttons para una selección única.
 * @param {HTMLElement} dropdownContainer - El div que contendrá los radio buttons.
 * @param {Array<string>} options - Array de strings con las opciones (ej. nombres de escuelas).
 * @param {string} radioGroupName - El atributo 'name' para los radio buttons.
 * @param {string} defaultOptionText - Texto para la opción por defecto (vacía).
 * @param {string} currentValue - El valor actualmente seleccionado para pre-seleccionar.
 */
function populateSingleSelectCheckboxes(dropdownContainer, options, radioGroupName, defaultOptionText, currentValue) {
    dropdownContainer.innerHTML = ''; // Limpiar opciones existentes

    // Añadir opción por defecto (vacía)
    const defaultId = `${radioGroupName}-default`;
    const defaultLabel = document.createElement('label');
    defaultLabel.className = 'block p-2 hover:bg-gray-100 cursor-pointer';
    defaultLabel.innerHTML = `
        <input type="radio" name="${radioGroupName}" value="" id="${defaultId}" class="mr-2" ${currentValue === '' || currentValue === null ? 'checked' : ''}>
        ${defaultOptionText}
    `;
    dropdownContainer.appendChild(defaultLabel);

    options.forEach(option => {
        const optionId = `${radioGroupName}-${normalizeString(option)}`; // ID único
        const label = document.createElement('label');
        label.className = 'block p-2 hover:bg-gray-100 cursor-pointer';
        label.innerHTML = `
            <input type="radio" name="${radioGroupName}" value="${option}" id="${optionId}" class="mr-2" ${currentValue === option ? 'checked' : ''}>
            ${option}
        `;
        dropdownContainer.appendChild(label);
    });
}

/**
 * Configura la lógica para abrir/cerrar un dropdown de selección única
 * y actualizar el input de texto con la selección.
 * @param {HTMLInputElement} inputElement - El input de texto readonly que muestra la selección.
 * @param {HTMLElement} dropdownElement - El contenedor del dropdown con los radio buttons.
 * @param {string} radioGroupName - El nombre del grupo de radio buttons.
 */
function setupSingleSelectDropdown(inputElement, dropdownElement, radioGroupName) {
    // Función para actualizar el input de texto basado en la selección
    function updateInputField() {
        const selectedRadio = dropdownElement.querySelector(`input[name="${radioGroupName}"]:checked`);
        inputElement.value = selectedRadio ? selectedRadio.value || inputElement.placeholder : inputElement.placeholder;
    }

    // Inicializar el input con el valor pre-seleccionado o placeholder
    updateInputField();

    // Toggle del dropdown al hacer clic en el input
    inputElement.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que el clic se propague y cierre el dropdown inmediatamente
        dropdownElement.classList.toggle('hidden');
    });

    // Cerrar el dropdown si se hace clic fuera de él
    document.addEventListener('click', (event) => {
        if (!inputElement.contains(event.target) && !dropdownElement.contains(event.target)) {
            dropdownElement.classList.add('hidden');
        }
    });

    // Actualizar el input cuando se selecciona una opción en el dropdown
    dropdownElement.addEventListener('change', (event) => {
        if (event.target.type === 'radio' && event.target.name === radioGroupName) {
            updateInputField();
            dropdownElement.classList.add('hidden'); // Cerrar el dropdown después de la selección
        }
    });
}


/**
 * Imprime el listado filtrado de alumnos.
 * @param {Array<Object>} students - La lista de alumnos a imprimir.
 */
function printFilteredList(students) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Listado de Alumnos</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
        body { font-family: sans-serif; margin: 20px; }
        h1 { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .no-print { display: none; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<h1>Listado de Alumnos</h1>');
    printWindow.document.write('<table>');
    printWindow.document.write('<thead><tr><th>Nombre</th><th>Edad</th><th>Sexo</th><th>Estatura</th><th>Curso</th><th>Escuela</th><th>Distrito</th></tr></thead>');
    printWindow.document.write('<tbody>');

    students.forEach(student => {
        printWindow.document.write(`
            <tr>
                <td>${student.name || '-'}</td>
                <td>${student.age || '-'}</td>
                <td>${student.sex ? (student.sex.charAt(0).toUpperCase() + student.sex.slice(1)) : '-'}</td>
                <td>${student.height ? `${student.height} cm` : '-'}</td>
                <td>${student.course || '-'}</td>
                <td>${student.school || '-'}</td>
                <td>${student.district || '-'}</td>
            </tr>
        `);
    });

    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

/**
 * Obtiene el promedio de resultados para una prueba específica y un grupo de edad.
 * @param {Array<Object>} records - Todos los registros disponibles.
 * @param {string} testType - El tipo de prueba (ej. 'speed30m').
 * @param {number} age - La edad para la que se calcula el promedio.
 * @returns {number|null} El promedio, o null si no hay suficientes datos.
 */
function getAverageResultForAge(records, testType, age) {
    const resultsForAge = records.filter(record =>
        record.testType === testType &&
        record.age === age && // Filtra por edad exacta
        record.result !== undefined && record.result !== null && !isNaN(record.result)
    ).map(record => parseFloat(record.result));

    if (resultsForAge.length === 0) {
        return null;
    }

    const sum = resultsForAge.reduce((acc, val) => acc + val, 0);
    return sum / resultsForAge.length;
}

/**
 * Obtiene los mejores resultados de todos los alumnos para una prueba y edad específicas.
 * @param {Array<Object>} allRecords - Todos los registros de la aplicación.
 * @param {string} testType - El tipo de prueba.
 * @param {number} age - La edad para filtrar.
 * @returns {Array<Object>} Un array de registros que representan el mejor resultado de cada alumno para esa prueba y edad.
 */
function getAllStudentsBestResultsForTest(allRecords, testType, age) {
    const recordsForTestAndAge = allRecords.filter(record =>
        record.testType === testType &&
        record.age === age && // Filtrar por edad
        record.result !== undefined && record.result !== null && !isNaN(record.result)
    );

    const bestResultsByIdentity = recordsForTestAndAge.reduce((acc, record) => {
        // La identidad del alumno debe ser única para el ranking
        const identityKey = `${record.name}|${record.course}|${record.school}|${record.district}|${record.sex}`; // Sexo también para mayor unicidad
        const isLowerBetter = isLowerBetterMap[testType];

        if (!acc[identityKey] || (isLowerBetter ? record.result < acc[identityKey].result : record.result > acc[identityKey].result)) {
            acc[identityKey] = record; // Guardar el registro completo
        }
        return acc;
    }, {});

    return Object.values(bestResultsByIdentity); // Devuelve un array de los mejores registros únicos
}

/**
 * Calcula el ranking de un alumno para una prueba específica.
 * @param {Array<Object>} allRecords - Todos los registros disponibles.
 * @param {Object} studentIdentity - La identidad del alumno (nombre, curso, escuela, distrito).
 * @param {string} testType - El tipo de prueba.
 * @param {number} age - La edad del alumno.
 * @returns {number} El puesto del alumno, o 0 si no se puede calcular.
 */
function getStudentRankingForTest(allRecords, studentIdentity, testType, age) {
    const bestResults = getAllStudentsBestResultsForTest(allRecords, testType, age);

    if (bestResults.length < MIN_PARTICIPANTS_FOR_RANKING) {
        return 0; // No hay suficientes participantes para un ranking significativo
    }

    // Encontrar el mejor resultado del alumno específico para esta prueba y edad
    const studentBestRecord = bestResults.find(record =>
        record.name === studentIdentity.name &&
        record.course === studentIdentity.course &&
        record.school === studentIdentity.school &&
        record.district === studentIdentity.district
    );

    if (!studentBestRecord) {
        return 0; // El alumno no tiene un resultado válido para esta prueba y edad
    }

    const isLowerBetter = isLowerBetterMap[testType];

    // Ordenar los mejores resultados para determinar el ranking
    const sortedResults = [...bestResults].sort((a, b) => {
        if (isLowerBetter) {
            return a.result - b.result; // Ascendente para "menor es mejor"
        } else {
            return b.result - a.result; // Descendente para "mayor es mejor"
        }
    });

    // Encontrar el índice del alumno en la lista ordenada (+1 para el puesto)
    const studentRank = sortedResults.findIndex(record =>
        record.name === studentBestRecord.name &&
        record.course === studentBestRecord.course &&
        record.school === studentBestRecord.school &&
        record.district === studentBestRecord.district
    );

    return studentRank !== -1 ? studentRank + 1 : 0;
}

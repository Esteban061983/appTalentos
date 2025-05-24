// js/app.js

// Estado global de la aplicación
let allRecords = JSON.parse(localStorage.getItem('physicalEducationRecordsIndividualV59')) || [];
let chartInstances = {}; // Para almacenar las instancias de los graficos de Chart.js
let navigationHistory = JSON.parse(sessionStorage.getItem('navigationHistory')) || [];
let currentSectionId = sessionStorage.getItem('currentSectionId') || 'add-record-section';
let filteredStudentList = []; // Lista de alumnos filtrada en la sección "Ver Alumnos"

// Variables globales para la edición inline de registros individuales
// Declaradas aquí para evitar el error "Identifier 'editingRow' has already been declared"
// cuando view-records.js se inicializa múltiples veces.
window.editingRow = null;
window.editingId = null;

console.log('app.js loaded. Initial allRecords:', allRecords, 'Type:', typeof allRecords, 'Is Array:', Array.isArray(allRecords));


// Elementos del DOM globales
const mainContentDiv = document.getElementById('main-content');
const backButton = document.getElementById('back-button');
const navLinks = document.querySelectorAll('.nav-link');
const printableStudentListTableBody = document.querySelector('#printable-student-list tbody');

// Mapeo de IDs de sección a rutas de archivos HTML
const sectionHtmlMap = {
    'add-record-section': 'pages/add-record.html',
    'view-records-section': 'pages/view-records.html',
    'comparison-section': 'pages/comparison.html',
    'import-export-section': 'pages/import-export.html',
    'report-section': 'pages/report.html'
};

/**
 * Guarda los registros en localStorage.
 */
function saveRecords() {
    try {
        localStorage.setItem('physicalEducationRecordsIndividualV59', JSON.stringify(allRecords));
        console.log('Records saved to localStorage.');
    } catch (e) {
        console.error("Error saving to localStorage:", e);
        console.error("No se pudo guardar la informacion. Es posible que el almacenamiento local este lleno o deshabilitado en tu navegador.");
        showToast("Error al guardar la información. Almacenamiento lleno o deshabilitado.", "error");
    }
}

/**
 * Navega a una sección específica cargando su contenido HTML.
 * @param {string} sectionId - El ID de la sección a la que navegar.
 * @param {Object} [data={}] - Datos opcionales a pasar a la sección (ej. identidad del alumno para el reporte).
 */
async function navigateToSection(sectionId, data = {}) {
    // Si hay una fila editándose inline, cancelarla antes de navegar
    if (window.editingRow) {
        console.warn("Edición inline activa. Se recomienda implementar un guardado/cancelado antes de navegar.");
        // Opcional: Podrías forzar la cancelación o pedir confirmación aquí.
        // Por ahora, simplemente advertimos.
    }

    const htmlPath = sectionHtmlMap[sectionId];
    if (!htmlPath) {
        console.error(`Sección con ID ${sectionId} no encontrada.`);
        showToast(`Error: Sección ${sectionId} no encontrada.`, 'error');
        return;
    }

    try {
        const response = await fetch(htmlPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const htmlContent = await response.text();
        mainContentDiv.innerHTML = htmlContent;

        currentSectionId = sectionId;
        sessionStorage.setItem('currentSectionId', currentSectionId);

        // Limpiar historial si se navega a una sección que no es la siguiente en el historial
        if (navigationHistory.length === 0 || navigationHistory[navigationHistory.length - 1] !== sectionId) {
            navigationHistory.push(sectionId);
            sessionStorage.setItem('navigationHistory', JSON.stringify(navigationHistory));
        }

        updateBackButtonState();

        // Inicializar la lógica específica de la sección después de cargar el HTML
        initializeSectionLogic(sectionId, data);

    } catch (error) {
        console.error("Error loading section HTML:", error);
        mainContentDiv.innerHTML = `<p class="text-red-500 text-center">Error al cargar la sección. Por favor, inténtalo de nuevo.</p>`;
        showToast("Error al cargar la sección. Inténtalo de nuevo.", "error");
    }
}

/**
 * Inicializa la lógica JavaScript para la sección cargada.
 * @param {string} sectionId - El ID de la sección cargada.
 * @param {Object} data - Datos pasados a la sección.
 */
function initializeSectionLogic(sectionId, data) {
    // Destruir todas las instancias de gráficos anteriores al cargar una nueva sección
    for (const chartId in chartInstances) {
        if (chartInstances[chartId]) {
            chartInstances[chartId].destroy();
            delete chartInstances[chartId];
        }
    }

    switch (sectionId) {
        case 'add-record-section':
            // Asegurarse de que initAddRecordSection esté disponible globalmente
            if (typeof initAddRecordSection === 'function') {
                initAddRecordSection();
            } else {
                console.error('initAddRecordSection not found.');
            }
            break;
        case 'view-records-section':
            console.log('Initializing view-records-section with data:', data);
            // Pasa allRecords a view-records-section para el análisis y ranking
            if (typeof initViewRecordsSection === 'function') {
                initViewRecordsSection({ studentIdentity: data.studentIdentity, allRecords: allRecords });
            } else {
                console.error('initViewRecordsSection not found.');
            }
            break;
        case 'comparison-section':
            // Asegurarse de que initComparisonSection esté disponible globalmente
            if (typeof initComparisonSection === 'function') {
                initComparisonSection();
            } else {
                console.error('initComparisonSection not found.');
            }
            break;
        case 'import-export-section':
            // Asegurarse de que initImportExportSection esté disponible globalmente
            if (typeof initImportExportSection === 'function') {
                initImportExportSection();
            } else {
                console.error('initImportExportSection not found.');
            }
            break;
        case 'report-section':
            console.log('Initializing report-section with data:', data);
            // Pasa los datos del alumno Y allRecords para el reporte
            if (typeof initReportSection === 'function') {
                initReportSection({ studentIdentity: data.studentIdentity, allRecords: allRecords });
            } else {
                console.error('initReportSection not found.');
            }
            break;
        default:
            console.warn(`No hay lógica de inicialización definida para la sección: ${sectionId}`);
    }
    // Después de cargar cualquier sección, siempre poblar las opciones de filtro
    // y la lista de alumnos en "Ver Alumnos" si es necesario.
    console.log('Calling populateFilterOptions from initializeSectionLogic.');
    // populateFilterOptions() debe ser llamada después de que los elementos DOM estén disponibles
    // en la sección cargada, si es que los necesita.
    // Para evitar errores si los elementos no existen en todas las secciones,
    // esta llamada se puede mover dentro de las funciones de inicialización de cada sección
    // que realmente necesite poblar filtros.
    // Por ahora, la mantenemos aquí, asumiendo que populateFilterOptions maneja la ausencia de elementos.
    populateFilterOptions();
}

/**
 * Actualiza el estado del botón "Atrás".
 */
function updateBackButtonState() {
    if (backButton) {
        if (navigationHistory.length > 1) {
            backButton.disabled = false;
        } else {
            backButton.disabled = true;
        }
    }
}

/**
 * Manejador para el clic en el botón "Atrás".
 */
function handleBackButtonClick() {
    if (navigationHistory.length > 1) {
        navigationHistory.pop(); // Elimina la sección actual del historial
        const previousSectionId = navigationHistory[navigationHistory.length - 1]; // Obtiene la sección anterior
        sessionStorage.setItem('navigationHistory', JSON.stringify(navigationHistory));
        navigateToSection(previousSectionId);
    }
}

/**
 * Función para imprimir la lista de alumnos filtrada.
 * @param {Array<Object>} students - La lista de alumnos a imprimir.
 */
function printFilteredList(students) {
    if (students.length === 0) {
        console.error('No hay alumnos en la lista filtrada para imprimir.');
        showToast('No hay alumnos en la lista filtrada para imprimir.', 'info');
        return;
    }

    // Asegurarse de que printableStudentListTableBody exista antes de manipularlo
    if (printableStudentListTableBody) {
        printableStudentListTableBody.innerHTML = '';
        students.forEach(student => {
            const studentRecords = allRecords.filter(record =>
                record.name === student.name &&
                record.course === student.course &&
                record.school === student.school &&
                record.district === student.district
            );
            studentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
            const studentData = studentRecords.length > 0 ? studentRecords[0] : student;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${studentData.name || '-'}</td>
                <td>${studentData.age || '-'}</td>
                <td>${studentData.sex ? (studentData.sex.charAt(0).toUpperCase() + studentData.sex.slice(1)) : '-'}</td>
                <td>${studentData.height || '-'}</td>
                <td>${studentData.course || '-'}</td>
                <td>${studentData.school || '-'}</td>
                <td>${studentData.district || '-'}</td>
                <td>${studentData.academicYear || '-'}</td>
            `;
            printableStudentListTableBody.appendChild(row);
        });
    } else {
        console.warn('printableStudentListTableBody no encontrado. La impresión puede no funcionar como se espera.');
        // Si el elemento no existe, se puede llamar a una función de impresión directa
        // que genere el HTML de la tabla en una nueva ventana.
        // Por ahora, se asume que el elemento existe en el DOM.
    }

    window.print();
}


// Event Listeners globales
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el contenedor de toasts
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-4 right-4 flex flex-col space-y-2 z-50';
    document.body.appendChild(toastContainer);

    // Cargar la sección inicial al cargar la página
    navigateToSection(currentSectionId);

    // Event Listeners para la navegación
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = event.target.dataset.sectionId; // Usar data-section-id
            if (currentSectionId !== targetId) {
                navigateToSection(targetId);
            }
        });
    });

    // Event Listener para el botón Atrás
    if (backButton) {
        backButton.addEventListener('click', handleBackButtonClick);
    }

    // Ocultar listas de autocompletado/búsqueda si se hace clic fuera
    document.addEventListener('click', (event) => {
        const autocompleteResultsUl = document.getElementById('autocomplete-results');
        const searchResultsUl = document.getElementById('search-results');
        const studentNameInput = document.getElementById('student-name');
        const searchInput = document.getElementById('search-input');

        if (autocompleteResultsUl && studentNameInput && !studentNameInput.contains(event.target) && !autocompleteResultsUl.contains(event.target)) {
            autocompleteResultsUl.classList.remove('visible');
        }
        if (searchResultsUl && searchInput && !searchInput.contains(event.target) && !searchResultsUl.contains(event.target)) {
            searchResultsUl.classList.remove('visible');
        }

        // Ocultar los dropdowns multi-select si se hace clic fuera de ellos
        const filterSchoolDropdown = document.getElementById('filter-school-dropdown');
        const filterSchoolInput = document.getElementById('filter-school-input');
        const filterDistrictDropdown = document.getElementById('filter-district-dropdown');
        const filterDistrictInput = document.getElementById('filter-district-input');

        if (filterSchoolDropdown && filterSchoolInput && !filterSchoolDropdown.contains(event.target) && event.target !== filterSchoolInput) {
            filterSchoolDropdown.classList.remove('visible');
        }
        if (filterDistrictDropdown && filterDistrictInput && !filterDistrictDropdown.contains(event.target) && event.target !== filterDistrictInput) {
            filterDistrictDropdown.classList.remove('visible');
        }
    });
});

/**
 * Obtiene los filtros de la sección "Ver Alumnos".
 * @returns {Object} Un objeto con los filtros aplicados.
 */
function getViewFilters() {
    const viewFilterAgeSelect = document.getElementById('view-filter-age');
    const viewFilterSexSelect = document.getElementById('view-filter-sex');
    const viewFilterHeightInput = document.getElementById('view-filter-height');
    const viewFilterCourseSelect = document.getElementById('view-filter-course');
    const viewFilterSchoolSelect = document.getElementById('view-filter-school');
    const viewFilterDistrictSelect = document.getElementById('view-filter-district');

    return {
        age: viewFilterAgeSelect ? viewFilterAgeSelect.value : '',
        sex: viewFilterSexSelect ? viewFilterSexSelect.value : '',
        minHeight: viewFilterHeightInput ? viewFilterHeightInput.value.trim() : '',
        course: viewFilterCourseSelect ? viewFilterCourseSelect.value : '',
        school: viewFilterSchoolSelect ? viewFilterSchoolSelect.value : '',
        district: viewFilterDistrictSelect ? viewFilterDistrictSelect.value : ''
    };
}

/**
 * Obtiene los filtros de la sección "Comparativo".
 * @returns {Object} Un objeto con los filtros aplicados.
 */
function getComparisonFilters() {
    const filterAgeSelect = document.getElementById('filter-age');
    const filterSexSelect = document.getElementById('filter-sex');
    const filterCourseSelect = document.getElementById('filter-course');
    const filterSchoolDropdown = document.getElementById('filter-school-dropdown');
    const filterSchoolInput = document.getElementById('filter-school-input');
    const filterDistrictDropdown = document.getElementById('filter-district-dropdown');
    const filterDistrictInput = document.getElementById('filter-district-input');
    const filterTestTypeSelect = document.getElementById('filter-test-type');

    // Obtener valores de los checkboxes seleccionados para escuelas
    const selectedSchools = filterSchoolDropdown ? Array.from(filterSchoolDropdown.querySelectorAll('input[type="checkbox"]:checked:not([value=""])')).map(checkbox => checkbox.value) : [];
    // Obtener valores de los checkboxes seleccionados para distritos
    const selectedDistricts = filterDistrictDropdown ? Array.from(filterDistrictDropdown.querySelectorAll('input[type="checkbox"]:checked:not([value=""])')).map(checkbox => checkbox.value) : [];

    // Verificar si la opción "Todas" está marcada para escuelas y distritos
    const allSchoolsChecked = filterSchoolDropdown ? filterSchoolDropdown.querySelector('input[value=""]').checked : true;
    const allDistrictsChecked = filterDistrictDropdown ? filterDistrictDropdown.querySelector('input[value=""]').checked : true;

    return {
        age: filterAgeSelect ? filterAgeSelect.value : '',
        sex: filterSexSelect ? filterSexSelect.value : '',
        course: filterCourseSelect ? filterCourseSelect.value : '',
        schools: allSchoolsChecked ? [] : selectedSchools,
        districts: allDistrictsChecked ? [] : selectedDistricts,
        testType: filterTestTypeSelect ? filterTestTypeSelect.value : ''
    };
}

/**
 * Pobla las opciones de los selectores de filtro y los nuevos multi-select con checkboxes.
 */
function populateFilterOptions() {
    console.log('populateFilterOptions called. Checking populateSelect type:', typeof populateSelect);
    try {
        const names = [...new Set(allRecords.map(record => record.name).filter(name => name && name.trim() !== ''))];
        const ages = [...new Set(allRecords.map(record => record.age))].filter(age => age !== undefined && age !== null && !isNaN(age)).sort((a, b) => a - b);
        const schools = [...new Set(allRecords.map(record => record.school))].filter(school => school !== undefined && school !== null && school !== '').sort();
        const districts = [...new Set(allRecords.map(record => record.district))].filter(district => district !== undefined && district !== null && district !== '').sort();
        const courses = [...new Set(allRecords.map(record => record.course))].filter(course => course !== undefined && course !== null && course !== '').sort();

        // Poblar selectores de filtro en "Ver Alumnos"
        const viewFilterAgeSelect = document.getElementById('view-filter-age');
        const viewFilterCourseSelect = document.getElementById('view-filter-course');
        const viewFilterSchoolSelect = document.getElementById('view-filter-school');
        const viewFilterDistrictSelect = document.getElementById('view-filter-district');

        if (viewFilterAgeSelect) populateSelect(viewFilterAgeSelect, ages, 'Todas las Edades');
        if (viewFilterCourseSelect) populateSelect(viewFilterCourseSelect, courses, 'Todos los Cursos');
        if (viewFilterSchoolSelect) populateSelect(viewFilterSchoolSelect, schools, 'Todas las Escuelas');
        if (viewFilterDistrictSelect) populateSelect(viewFilterDistrictSelect, districts, 'Todos los Distritos');

        // Poblar selectores de filtro en "Comparativo"
        const filterAgeSelect = document.getElementById('filter-age');
        const filterCourseSelect = document.getElementById('filter-course');
        const filterSchoolDropdown = document.getElementById('filter-school-dropdown');
        const filterSchoolInput = document.getElementById('filter-school-input');
        const filterDistrictDropdown = document.getElementById('filter-district-dropdown');
        const filterDistrictInput = document.getElementById('filter-district-input');

        if (filterAgeSelect) populateSelect(filterAgeSelect, ages, 'Todas las Edades');
        if (filterCourseSelect) populateSelect(filterCourseSelect, courses, 'Todos los Cursos');

        if (filterSchoolDropdown && filterSchoolInput) {
            populateMultiSelectCheckboxes(filterSchoolDropdown, schools, 'Todas las Escuelas');
            handleMultiSelectCheckboxChange(filterSchoolDropdown, filterSchoolInput, 'Todas las Escuelas');
        }
        if (filterDistrictDropdown && filterDistrictInput) {
            populateMultiSelectCheckboxes(filterDistrictDropdown, districts, 'Todos los Distritos');
            handleMultiSelectCheckboxChange(filterDistrictDropdown, filterDistrictInput, 'Todos los Distritos');
        }

    } catch (error) {
        console.error("Error populating filter options:", error);
    }
}

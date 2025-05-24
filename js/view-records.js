// js/view-records.js

// La variable isEditingStudentData controla el estado de edición de los datos del alumno.
// Las variables editingRow y editingId son declaradas y gestionadas globalmente en app.js.
// NO se deben redeclarar aquí con 'let' o 'const' para evitar el "Identifier already declared" error.
let isEditingStudentData = false; // Bandera para controlar el estado de edición del alumno

function initViewRecordsSection(initialData = {}) {
    console.log('initViewRecordsSection called. Initial data:', initialData);

    const viewFilterAgeSelect = document.getElementById('view-filter-age');
    const viewFilterSexSelect = document.getElementById('view-filter-sex');
    const viewFilterCourseSelect = document.getElementById('view-filter-course');
    const viewFilterSchoolSelect = document.getElementById('view-filter-school');
    const viewFilterDistrictSelect = document.getElementById('view-filter-district');
    const viewFilterHeightInput = document.getElementById('view-filter-height');
    const applyViewFiltersBtn = document.getElementById('apply-view-filters-btn');
    const printFilteredListBtn = document.getElementById('print-filtered-list-btn');

    const searchInput = document.getElementById('search-input');
    const searchResultsUl = document.getElementById('search-results');
    const selectStudentSelect = document.getElementById('select-student');
    const studentRecordsDiv = document.getElementById('student-records');
    const selectedStudentNameDisplay = document.getElementById('selected-student-name-display');

    // Spans para mostrar los datos del alumno (ahora serán los objetivos de edición)
    const studentNameDisplaySpan = document.getElementById('student-name-display-span');
    const studentAgeDisplaySpan = document.getElementById('student-age-display-span');
    const studentSexDisplaySpan = document.getElementById('student-sex-display-span');
    const studentHeightDisplaySpan = document.getElementById('student-height-display-span');
    const studentCourseDisplaySpan = document.getElementById('student-course-display-span');
    const studentSchoolDisplaySpan = document.getElementById('student-school-display-span');
    const studentDistrictDisplaySpan = document.getElementById('student-district-display-span');

    // Botones de acción del alumno
    const editStudentDataBtn = document.getElementById('edit-student-data-btn');
    const deleteStudentBtn = document.getElementById('delete-student-btn');
    const studentActionButtons = document.getElementById('student-action-buttons'); // Contenedor de botones Editar/Eliminar
    const studentDataEditButtons = document.getElementById('student-data-edit-buttons'); // Contenedor de botones Guardar/Cancelar

    const recordsTableBody = document.getElementById('records-table-body');
    const generateReportBtn = document.getElementById('generate-report-btn');

    // Contenedores para el análisis y ranking en view-records.html
    const analysisRowsContainer = document.getElementById('analysis-rows-container');

    let allRecords = initialData.allRecords || []; // Recibe allRecords de app.js

    // Variables para almacenar los valores originales durante la edición inline de los datos del alumno
    // Se inicializan cuando se pulsa "Editar Datos del Alumno"
    let originalStudentData = {};

    /**
     * Filtra y muestra alumnos en la sección "Ver Alumnos".
     */
    function filterAndDisplayStudents() {
        console.log('filterAndDisplayStudents called. allRecords:', allRecords, 'Is Array:', Array.isArray(allRecords));
        const filters = getViewFilters();
        const filteredRecordsPool = allRecords.filter(record => {
            let passesFilters = true;
            if (filters.age && record.age !== undefined && record.age !== null && record.age !== parseInt(filters.age)) passesFilters = false;
            if (filters.sex && record.sex && record.sex !== filters.sex) passesFilters = false;
            if (filters.minHeight !== undefined && filters.minHeight !== null && filters.minHeight !== '') {
                const minHeightValue = parseFloat(filters.minHeight);
                if (!isNaN(minHeightValue) && (record.height === undefined || record.height === null || parseFloat(record.height) < minHeightValue)) {
                    passesFilters = false;
                }
            }
            if (filters.course && record.course && record.course !== filters.course) passesFilters = false;
            if (filters.school && record.school && record.school !== filters.school) passesFilters = false;
            if (filters.district && record.district && record.district !== filters.district) passesFilters = false;
            return passesFilters;
        });

        const uniqueStudentIdentities = {};
        filteredRecordsPool.forEach(record => {
            const identityKey = `${record.name}|${record.course}|${record.school}|${record.district}`;
            if (record.name && !uniqueStudentIdentities[identityKey]) {
                const studentRecords = allRecords.filter(r =>
                    r.name === record.name &&
                    r.course === record.course &&
                    r.school === r.school && // Use r.school here to match the record's school
                    r.district === r.district // Use r.district here to match the record's district
                );
                studentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
                const mostRecentRecord = studentRecords.length > 0 ? studentRecords[0] : record;

                uniqueStudentIdentities[identityKey] = {
                    name: mostRecentRecord.name,
                    age: mostRecentRecord.age,
                    sex: mostRecentRecord.sex,
                    height: mostRecentRecord.height,
                    course: mostRecentRecord.course,
                    school: mostRecentRecord.school,
                    district: mostRecentRecord.district
                };
            }
        });

        filteredStudentList = Object.values(uniqueStudentIdentities).sort((a, b) => a.name.localeCompare(b.name));

        if (selectStudentSelect) selectStudentSelect.innerHTML = '<option value="">-- Seleccionar Alumno --</option>';
        if (searchResultsUl) searchResultsUl.innerHTML = '';

        filteredStudentList.forEach(student => {
            const displayString = `${student.name} (${student.course || '-'}, ${student.school || '-'}, ${student.district || '-'})`;
            const identityJson = JSON.stringify({
                name: student.name,
                course: student.course,
                school: student.school,
                district: student.district,
                age: student.age,
                sex: student.sex
            });

            if (selectStudentSelect) {
                const option = document.createElement('option');
                option.value = identityJson;
                option.textContent = displayString;
                selectStudentSelect.appendChild(option);
            }

            if (searchResultsUl) {
                const li = document.createElement('li');
                li.textContent = displayString;
                li.dataset.studentIdentity = identityJson;
                searchResultsUl.appendChild(li);
            }
        });

        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const searchResults = filteredStudentList.filter(student => {
            const displayString = `${student.name} (${student.course || '-'}, ${student.school || '-'}, ${student.district || '-'})`.toLowerCase();
            return displayString.includes(searchTerm);
        });

        displaySearchResults(searchResults);
    }

    /**
     * Muestra los resultados de búsqueda en la lista.
     * @param {Array<Object>} results - Los resultados de la búsqueda.
     */
    function displaySearchResults(results) {
        if (searchResultsUl) searchResultsUl.innerHTML = '';

        const searchTerm = searchInput ? searchInput.value.trim() : '';

        if (searchTerm === '') {
            if (searchResultsUl) searchResultsUl.classList.remove('visible');
            return;
        }

        if (results.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No se encontraron alumnos.';
            li.classList.add('text-gray-500', 'italic');
            if (searchResultsUl) {
                searchResultsUl.appendChild(li);
                searchResultsUl.classList.add('visible');
            }
            return;
        }

        results.forEach(student => {
            const displayString = `${student.name} (${student.course || '-'}, ${student.school || '-'}, ${student.district || '-'})`;
            const identityJson = JSON.stringify({
                name: student.name,
                course: student.course,
                school: student.school,
                district: student.district,
                age: student.age,
                sex: student.sex
            });
            const li = document.createElement('li');
            li.textContent = displayString;
            li.dataset.studentIdentity = identityJson;
            searchResultsUl.appendChild(li);
        });

        if (searchResultsUl) searchResultsUl.classList.add('visible');
    }

    /**
     * Muestra los registros de un alumno seleccionado y genera el análisis.
     * @param {Object} studentIdentity - La identidad del alumno.
     */
    function displayStudentRecords(studentIdentity) {
        console.log('displayStudentRecords called with studentIdentity:', studentIdentity);
        // Resetear el estado de edición al mostrar un nuevo alumno
        isEditingStudentData = false; // Resetear la bandera de edición de datos del alumno
        if (studentActionButtons) studentActionButtons.classList.remove('hidden');
        if (studentDataEditButtons) studentDataEditButtons.classList.add('hidden');

        const studentRecords = allRecords.filter(record =>
            record.name === studentIdentity.name &&
            record.course === studentIdentity.course &&
            record.school === studentIdentity.school &&
            record.district === studentIdentity.district
        );

        if (studentRecords.length === 0) {
            if (studentRecordsDiv) studentRecordsDiv.classList.add('hidden');
            if (selectedStudentNameDisplay) selectedStudentNameDisplay.textContent = '';
            if (studentNameDisplaySpan) studentNameDisplaySpan.innerHTML = '-';
            if (studentAgeDisplaySpan) studentAgeDisplaySpan.innerHTML = '-';
            if (studentSexDisplaySpan) studentData.sex ? (studentSexDisplaySpan.innerHTML = studentData.sex.charAt(0).toUpperCase() + studentData.sex.slice(1)) : studentSexDisplaySpan.innerHTML = '-';
            if (studentHeightDisplaySpan) studentHeightDisplaySpan.innerHTML = '-';
            if (studentCourseDisplaySpan) studentCourseDisplaySpan.innerHTML = '-';
            if (studentSchoolDisplaySpan) studentSchoolDisplaySpan.innerHTML = '-';
            if (studentDistrictDisplaySpan) studentDistrictDisplaySpan.innerHTML = '-';
            if (recordsTableBody) recordsTableBody.innerHTML = '';
            if (studentRecordsDiv) studentRecordsDiv.dataset.currentStudentIdentity = '';
            if (analysisRowsContainer) analysisRowsContainer.innerHTML = ''; // Limpiar análisis
            return;
        }

        if (studentRecordsDiv) studentRecordsDiv.classList.remove('hidden');
        if (studentRecordsDiv) studentRecordsDiv.dataset.currentStudentIdentity = JSON.stringify(studentIdentity);

        const studentData = studentRecords.sort((a, b) => new Date(b.date) - new Date(a.date))[0] || {};

        if (selectedStudentNameDisplay) selectedStudentNameDisplay.textContent = `${studentData.name || '-'} (${studentData.course || '-'}, ${studentData.school || '-'}, ${studentData.district || '-'})`;

        // Mostrar datos del alumno en spans (modo no-edición)
        if (studentNameDisplaySpan) studentNameDisplaySpan.innerHTML = studentData.name || '-';
        if (studentAgeDisplaySpan) studentAgeDisplaySpan.innerHTML = studentData.age || '-';
        if (studentSexDisplaySpan) studentData.sex ? (studentSexDisplaySpan.innerHTML = studentData.sex.charAt(0).toUpperCase() + studentData.sex.slice(1)) : studentSexDisplaySpan.innerHTML = '-';
        if (studentHeightDisplaySpan) studentHeightDisplaySpan.innerHTML = studentData.height ? `${studentData.height} cm` : '-';
        if (studentCourseDisplaySpan) studentCourseDisplaySpan.innerHTML = studentData.course || '-';
        if (studentSchoolDisplaySpan) studentSchoolDisplaySpan.innerHTML = studentData.school || '-';
        if (studentDistrictDisplaySpan) studentDistrictDisplaySpan.innerHTML = studentData.district || '-';

        if (recordsTableBody) recordsTableBody.innerHTML = '';

        studentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        studentRecords.forEach(record => {
            const row = document.createElement('tr');
            row.dataset.recordId = record.id;

            row.innerHTML = `
                <td>${formatDateFromISO(record.date)}</td>
                <td>${testTypeMap[record.testType] || record.testType || '-'}</td>
                <td>${record.result || '-'}</td>
                <td>${record.academicYear || '-'}</td>
                <td>
                    <button class="edit-record-btn inline-action-btn" data-id="${record.id}" title="Editar Registro"><i class="fas fa-edit"></i> Editar</button>
                    <button class="delete-record-btn inline-action-btn" data-id="${record.id}" title="Eliminar Registro"><i class="fas fa-trash-alt"></i> Eliminar</button>
                </td>
            `;
            if (recordsTableBody) recordsTableBody.appendChild(row);
        });

        // --- Generar Análisis y Ranking en la sección "Ver Alumnos" ---
        generateStudentAnalysisAndRanking(studentIdentity, allRecords);
    }

    /**
     * Genera el análisis comparativo y el ranking para un alumno específico.
     * Esta lógica fue movida de report.js a view-records.js.
     * @param {Object} studentIdentity - La identidad del alumno.
     * @param {Array<Object>} allRecords - Todos los registros de la aplicación.
     */
    function generateStudentAnalysisAndRanking(studentIdentity, allRecords) {
        console.log("generateStudentAnalysisAndRanking: Generando análisis y ranking para:", studentIdentity.name);

        const studentRecords = allRecords.filter(record =>
            record.name === studentIdentity.name &&
            record.course === studentIdentity.course &&
            record.school === studentIdentity.school &&
            record.district === studentIdentity.district
        ).sort((a, b) => new Date(a.date) - new Date(b.date));

        const latestRecord = studentRecords[studentRecords.length - 1];

        let hasAnalysisData = false; // Bandera para saber si se generó algún análisis (fuerza, debilidad o ranking)
        const testTypesForAnalysis = Object.keys(testTypeMap);

        if (analysisRowsContainer) analysisRowsContainer.innerHTML = ''; // Limpiar contenedor antes de generar

        testTypesForAnalysis.forEach(testType => {
            const studentResultsForTest = studentRecords.filter(r => r.testType === testType && r.result !== undefined && r.result !== null && !isNaN(r.result));

            if (studentResultsForTest.length > 0) {
                const latestResultRecordForTest = studentResultsForTest.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                const studentResult = parseFloat(latestResultRecordForTest.result);
                const testName = testTypeMap[testType];
                const unit = testUnits[testType] || '';

                let analysisCategoryHtml = '';
                const studentAge = latestRecord.age;
                // Ahora getAverageResultForAge compara solo por edad
                const averageForAge = getAverageResultForAge(allRecords, testType, studentAge);

                console.log(`Análisis ${testName}: Resultado Alumno: ${studentResult}${unit}, Edad: ${studentAge}`);
                console.log(`Análisis ${testName}: Promedio para ${studentAge} años: ${averageForAge !== null ? averageForAge.toFixed(2) + unit : 'N/A'}`);


                if (averageForAge !== null) {
                    const difference = studentResult - averageForAge;
                    const percentageDifference = (difference / averageForAge) * 100;

                    const isLowerBetter = isLowerBetterMap[testType];

                    if (Math.abs(percentageDifference) < SIMILAR_TO_AVERAGE_THRESHOLD_PERCENTAGE) {
                        // Si es similar al promedio, no generar HTML de análisis de categoría
                        analysisCategoryHtml = ''; // No se muestra nada para "similar"
                        console.log(`Análisis ${testName}: Resultado similar al promedio. No se mostrará información.`);
                    } else if (isLowerBetter) { // Menor es mejor (ej. tiempo)
                        if (studentResult < averageForAge) { // Mejor que el promedio
                            analysisCategoryHtml = `<div class="strength analysis-item-row-content"><strong>${testName}:</strong> ¡Excelente! Tu resultado (${latestResultRecordForTest.result}${unit}) es superior al promedio de tu edad (${averageForAge.toFixed(2)}${unit}).</div>`;
                            hasAnalysisData = true;
                        } else if (percentageDifference > SIGNIFICANTLY_BELOW_THRESHOLD_PERCENTAGE) { // Significativamente peor que el promedio
                            analysisCategoryHtml = `<div class="weakness analysis-item-row-content"><strong>${testName}:</strong> ¡Atención! Tu resultado (${latestResultRecordForTest.result}${unit}) está significativamente por debajo del promedio de tu edad (${averageForAge.toFixed(2)}${unit}).</div>`;
                            hasAnalysisData = true;
                        } else { // Peor, pero no significativamente (se considera neutral)
                            analysisCategoryHtml = `<div class="neutral analysis-item-row-content"><strong>${testName}:</strong> Tu resultado (${latestResultRecordForTest.result}${unit}) está por debajo del promedio de tu edad (${averageForAge.toFixed(2)}${unit}), pero no significativamente.</div>`;
                            hasAnalysisData = true;
                        }
                    } else { // Mayor es mejor (ej. repeticiones, distancia)
                        if (studentResult > averageForAge) { // Mejor que el promedio
                            analysisCategoryHtml = `<div class="strength analysis-item-row-content"><strong>${testName}:</strong> ¡Excelente! Tu resultado (${latestResultRecordForTest.result}${unit}) es superior al promedio de tu edad (${averageForAge.toFixed(2)}${unit}).</div>`;
                            hasAnalysisData = true;
                        } else if (Math.abs(percentageDifference) > SIGNIFICANTLY_BELOW_THRESHOLD_PERCENTAGE) { // Significativamente peor que el promedio
                            analysisCategoryHtml = `<div class="weakness analysis-item-row-content"><strong>${testName}:</strong> ¡Atención! Tu resultado (${latestResultRecordForTest.result}${unit}) está significativamente por debajo del promedio de tu edad (${averageForAge.toFixed(2)}${unit}).</div>`;
                            hasAnalysisData = true;
                        } else { // Peor, pero no significativamente (se considera neutral)
                            analysisCategoryHtml = `<div class="neutral analysis-item-row-content"><strong>${testName}:</strong> Tu resultado (${latestResultRecordForTest.result}${unit}) está por debajo del promedio de tu edad (${averageForAge.toFixed(2)}${unit}), pero no significativamente.</div>`;
                            hasAnalysisData = true;
                        }
                    }
                    if (analysisCategoryHtml) { // Solo loguear si se generó algo
                        console.log(`Análisis ${testName}: Frase de categoría generada:`, analysisCategoryHtml);
                    }

                } else {
                    analysisCategoryHtml = `<div class="neutral analysis-item-row-content"><strong>${testName}:</strong> No hay suficientes datos para comparar con el promedio de su edad.</div>`;
                    hasAnalysisData = true;
                    console.log(`Análisis ${testName}: No hay datos de promedio.`);
                }

                // Análisis de Ranking (Solo puesto)
                let analysisRankingHtml = '';
                // Ahora getStudentRankingForTest compara solo por edad e identidad completa
                const studentRanking = getStudentRankingForTest(allRecords, studentIdentity, testType, studentAge);
                // Ahora getAllStudentsBestResultsForTest compara solo por edad
                const totalStudentsInRanking = getAllStudentsBestResultsForTest(allRecords, testType, studentAge).length;

                console.log(`Ranking ${testName}: Puesto Alumno: ${studentRanking}, Total Alumnos en Ranking: ${totalStudentsInRanking}`);


                if (studentRanking > 0 && totalStudentsInRanking >= MIN_PARTICIPANTS_FOR_RANKING) {
                    hasAnalysisData = true;
                    analysisRankingHtml = `<div class="ranking-item analysis-item-row-content"><strong>${testName}:</strong> Puesto ${studentRanking} de ${totalStudentsInRanking} alumnos de tu edad.</div>`;
                } else {
                    analysisRankingHtml = `<div class="ranking-item analysis-item-row-content">No hay suficientes datos (${totalStudentsInRanking} alumnos) para calcular el ranking de ${testName} para su edad (se necesitan ${MIN_PARTICIPANTS_FOR_RANKING}).</div>`;
                    hasAnalysisData = true;
                }
                console.log(`Ranking ${testName}: Frase de ranking generada:`, analysisRankingHtml);

                if (analysisCategoryHtml || analysisRankingHtml) {
                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'analysis-item-row';
                    rowDiv.innerHTML = analysisCategoryHtml + analysisRankingHtml;
                    if (analysisRowsContainer) analysisRowsContainer.appendChild(rowDiv);
                    console.log(`Análisis ${testType}: Fila de análisis añadida al contenedor.`);
                } else {
                    console.log(`Análisis ${testType}: No se generó HTML de análisis o ranking para esta prueba (posiblemente similar al promedio).`);
                }
            } else {
                console.log(`Análisis ${testType}: No se encontraron resultados válidos para esta prueba en el alumno.`);
            }
        });

        // Si no se generó ningún análisis de fuerza/debilidad/ranking para ninguna prueba
        if (!hasAnalysisData && analysisRowsContainer) {
            console.log("generateStudentAnalysisAndRanking: No se generó ningún análisis de fuerza/debilidad/ranking.");
            const noDataRow = document.createElement('div');
            noDataRow.className = 'analysis-item-row';
            noDataRow.innerHTML = `
                <div class="neutral w-full p-3 text-center">No hay resultados válidos para este alumno para generar análisis de comparación o los resultados son muy cercanos al promedio.</div>
            `;
            analysisRowsContainer.appendChild(noDataRow);
        } else {
            console.log("generateStudentAnalysisAndRanking: Se generaron análisis de fuerza/debilidad/ranking.");
        }
    }


    /**
     * Manejador de clic delegado para los botones de las tablas de registros.
     * @param {Event} event - El evento de clic.
     */
    function handleTableButtonClick(event) {
        const target = event.target;
        const button = target.closest('button');

        if (!button) return;

        const row = button.closest('tr');
        if (!row) return;

        const recordId = row.dataset.recordId;

        if (button.classList.contains('edit-record-btn')) {
            handleEditRecordClick(row, recordId);
        } else if (button.classList.contains('delete-record-btn')) {
            handleDeleteRecordClick(recordId);
        } else if (button.classList.contains('save-inline-edit-btn')) {
            handleSaveInlineEdit(row, recordId);
        } else if (button.classList.contains('cancel-inline-edit-btn')) {
            handleCancelInlineEdit(row, recordId);
        }
    }

    /**
     * Manejador para el clic en el botón de editar registro individual (inline).
     * @param {HTMLTableRowElement} row - La fila de la tabla que se está editando.
     * @param {string} recordId - El ID del registro.
     */
    function handleEditRecordClick(row, recordId) {
        // Accedemos a la variable global `editingRow` sin redeclararla
        if (window.editingRow && window.editingId !== recordId) {
            // Si ya hay una fila editándose, la cancelamos antes de iniciar una nueva
            handleCancelInlineEdit(window.editingRow, window.editingId);
        }

        const record = allRecords.find(r => r.id === recordId);

        if (!record) {
            console.error('Registro no encontrado.');
            return;
        }

        // Asignamos a las variables globales
        window.editingRow = row;
        window.editingId = recordId;

        const cells = row.querySelectorAll('td');
        const dateCell = cells[0];
        const testTypeCell = cells[1];
        const resultCell = cells[2];
        const actionsCell = cells[4]; // Acciones esta en la 5ta celda (indice 4)

        row.dataset.originalDateHtml = dateCell.innerHTML;
        row.dataset.originalTestTypeHtml = testTypeCell.innerHTML;
        row.dataset.originalResultHtml = resultCell.innerHTML;
        row.dataset.originalActionsHtml = actionsCell.innerHTML;

        dateCell.innerHTML = `<input type="date" value="${record.date || ''}" class="w-full p-1 border rounded text-sm">`;

        const testTypeSelectInput = document.createElement('select');
        testTypeSelectInput.classList.add('w-full', 'p-1', 'border', 'rounded', 'text-sm');
        let optionsHtml = `<option value="">-- Seleccionar Prueba --</option>`;
        for (const key in testTypeMap) {
            optionsHtml += `<option value="${key}" ${record.testType === key ? 'selected' : ''}>${testTypeMap[key]}</option>`;
        }
        testTypeSelectInput.innerHTML = optionsHtml;
        testTypeCell.innerHTML = '';
        testTypeCell.appendChild(testTypeSelectInput);

        resultCell.innerHTML = `<input type="number" value="${record.result || ''}" step="0.01" class="w-full p-1 border rounded text-sm">`;

        actionsCell.innerHTML = `
            <button class="save-inline-edit-btn inline-action-btn" title="Guardar Cambios"><i class="fas fa-save"></i> Guardar</button>
            <button class="cancel-inline-edit-btn inline-action-btn" title="Cancelar Edicion"><i class="fas fa-times"></i> Cancelar</button>
        `;
    }

    /**
     * Manejador para guardar la edición inline.
     * @param {HTMLTableRowElement} row - La fila de la tabla que se está editando.
     * @param {string} recordId - El ID del registro.
     */
    function handleSaveInlineEdit(row, recordId) {
        const recordIndex = allRecords.findIndex(r => r.id === recordId);

        if (recordIndex === -1) {
            console.error('Error al guardar: Registro no encontrado.');
            handleCancelInlineEdit(row, recordId);
            return;
        }

        const cells = row.querySelectorAll('td');
        const newDate = cells[0].querySelector('input').value;
        const newTestType = cells[1].querySelector('select').value;
        const newResult = parseFloat(cells[2].querySelector('input').value);

        if (!newDate || !newTestType || isNaN(newResult)) {
            console.error('Por favor, completa todos los campos (Fecha, Tipo de Prueba, Resultado) para guardar.');
            showToast('Por favor, completa todos los campos (Fecha, Tipo de Prueba, Resultado) para guardar.', 'error');
            return;
        }

        allRecords[recordIndex].date = newDate;
        allRecords[recordIndex].testType = newTestType;
        allRecords[recordIndex].result = newResult;
        allRecords[recordIndex].academicYear = getAcademicYear(newDate);

        saveRecords(); // Esta función debería ser global o pasada
        restoreRowDisplay(row, allRecords[recordIndex]);
        window.editingRow = null; // Resetear la variable global
        window.editingId = null;  // Resetear la variable global
        console.log('Registro actualizado correctamente.');
        showToast('Registro actualizado correctamente.', 'success');


        const currentStudentIdentityJson = studentRecordsDiv ? studentRecordsDiv.dataset.currentStudentIdentity : null;
        if (currentStudentIdentityJson) {
            const currentStudentIdentity = JSON.parse(currentStudentIdentityJson);
            displayStudentRecords(currentStudentIdentity); // Volver a cargar los datos y análisis
        }
    }

    /**
     * Manejador para cancelar la edición inline.
     * @param {HTMLTableRowElement} row - La fila de la tabla que se está editando.
     * @param {string} recordId - El ID del registro.
     */
    function handleCancelInlineEdit(row, recordId) {
        const cells = row.querySelectorAll('td');
        cells[0].innerHTML = row.dataset.originalDateHtml;
        cells[1].innerHTML = row.dataset.originalTestTypeHtml;
        cells[2].innerHTML = row.dataset.originalResultHtml;
        cells[4].innerHTML = row.dataset.originalActionsHtml;

        delete row.dataset.originalDateHtml;
        delete row.dataset.originalTestTypeHtml;
        delete row.dataset.originalResultHtml;
        delete row.dataset.originalActionsHtml;

        window.editingRow = null; // Resetear la variable global
        window.editingId = null;  // Resetear la variable global
        showToast('Edición cancelada.', 'info');
    }

    /**
     * Manejador para eliminar un registro individual de la tabla.
     * @param {string} recordId - El ID del registro a eliminar.
     */
    function handleDeleteRecordClick(recordId) {
        console.log(`Intentando eliminar registro con ID: ${recordId}`);
        const recordIndex = allRecords.findIndex(r => r.id === recordId);

        if (recordIndex === -1) {
            console.error('Error al eliminar: Registro no encontrado.');
            showToast('Error al eliminar: Registro no encontrado.', 'error');
            return;
        }

        // Obtener la identidad del alumno antes de eliminar el registro
        const currentStudentIdentityJson = studentRecordsDiv ? studentRecordsDiv.dataset.currentStudentIdentity : null;
        let currentStudentIdentity = null;
        if (currentStudentIdentityJson) {
            currentStudentIdentity = JSON.parse(currentStudentIdentityJson);
        }

        allRecords.splice(recordIndex, 1); // Eliminar el registro del array
        saveRecords(); // Guardar los cambios en localStorage

        // Refrescar la visualización de los registros del alumno actual
        if (currentStudentIdentity) {
            displayStudentRecords(currentStudentIdentity);
        } else {
            // Si no hay un alumno seleccionado, simplemente refrescar la lista general
            filterAndDisplayStudents();
        }
        console.log(`Registro con ID ${recordId} eliminado correctamente.`);
        showToast(`Registro eliminado correctamente.`, 'success');
    }

    /**
     * Manejador para el clic en el botón de editar datos del alumno (inline).
     */
    function handleEditStudentDataClick() {
        console.log('handleEditStudentDataClick called. isEditingStudentData:', isEditingStudentData);
        if (isEditingStudentData) {
            console.log('Already in editing mode for student data. Exiting.');
            showToast('Ya estás editando los datos del alumno.', 'info');
            return; // Evitar múltiples ediciones
        }
        isEditingStudentData = true;

        const currentStudentIdentityJson = studentRecordsDiv ? studentRecordsDiv.dataset.currentStudentIdentity : null;
        if (!currentStudentIdentityJson) {
            console.error('No se ha seleccionado un alumno para editar.');
            showToast('Por favor, selecciona un alumno para editar.', 'error');
            isEditingStudentData = false; // Resetear si no hay alumno seleccionado
            return;
        }
        const studentIdentity = JSON.parse(currentStudentIdentityJson);
        console.log('Editing student with identity:', studentIdentity);


        const studentRecords = allRecords.filter(record =>
            record.name === studentIdentity.name &&
            record.course === studentIdentity.course &&
            record.school === studentIdentity.school &&
            record.district === studentIdentity.district
        );

        if (studentRecords.length === 0) {
            console.error('No se encontraron datos para editar de este alumno.');
            showToast('No se encontraron datos para editar de este alumno.', 'error');
            isEditingStudentData = false;
            return;
        }

        const studentData = studentRecords.sort((a, b) => new Date(b.date) - new Date(a.date))[0] || {};

        // Guardar valores originales para el caso de cancelación
        originalStudentData = {
            name: studentData.name || '',
            age: studentData.age || '',
            sex: studentData.sex || '',
            height: studentData.height || '',
            course: studentData.course || '',
            school: studentData.school || '',
            district: studentData.district || ''
        };
        console.log('Original Student Data stored:', originalStudentData);

        // Reemplazar spans con inputs/selects
        studentNameDisplaySpan.innerHTML = `<input type="text" id="edit-name" value="${originalStudentData.name}" class="w-full p-1 border rounded text-sm">`;
        studentAgeDisplaySpan.innerHTML = `<input type="number" id="edit-age" value="${originalStudentData.age}" class="w-full p-1 border rounded text-sm">`;

        // Sexo
        let sexOptionsHtml = `<select id="edit-sex" class="w-full p-1 border rounded text-sm">`;
        sexOptionsHtml += `<option value="masculino" ${originalStudentData.sex === 'masculino' ? 'selected' : ''}>Masculino</option>`;
        sexOptionsHtml += `<option value="femenino" ${originalStudentData.sex === 'femenino' ? 'selected' : ''}>Femenino</option>`;
        sexOptionsHtml += `</select>`;
        studentSexDisplaySpan.innerHTML = sexOptionsHtml;

        // Estatura ya no es obligatoria, se permite dejarla vacia
        studentHeightDisplaySpan.innerHTML = `<input type="number" id="edit-height" value="${originalStudentData.height !== null ? originalStudentData.height : ''}" step="0.01" class="w-full p-1 border rounded text-sm">`;
        studentCourseDisplaySpan.innerHTML = `<input type="text" id="edit-course" value="${originalStudentData.course}" class="w-full p-1 border rounded text-sm">`;

        // Para Escuela y Distrito, usar la nueva lógica de single-select
        const schools = [...new Set(allRecords.map(record => record.school))].filter(s => s !== undefined && s !== null && s !== '').sort();
        const districts = [...new Set(allRecords.map(record => record.district))].filter(d => d !== undefined && d !== null && d !== '').sort();

        studentSchoolDisplaySpan.innerHTML = `
            <div class="relative school-dropdown-wrapper">
                <input type="text" id="edit-school-input" class="mt-1 block w-full p-2 border border-gray-300 rounded-md cursor-pointer" readonly placeholder="Seleccionar Escuela">
                <div id="edit-school-dropdown" class="multi-select-dropdown absolute w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto z-10 hidden"></div>
            </div>
        `;
        const editSchoolInput = document.getElementById('edit-school-input');
        const editSchoolDropdown = document.getElementById('edit-school-dropdown');
        populateSingleSelectCheckboxes(editSchoolDropdown, schools, 'edit-school-radio-group', 'Seleccionar Escuela', originalStudentData.school);
        setupSingleSelectDropdown(editSchoolInput, editSchoolDropdown, 'edit-school-radio-group');


        studentDistrictDisplaySpan.innerHTML = `
            <div class="relative district-dropdown-wrapper">
                <input type="text" id="edit-district-input" class="mt-1 block w-full p-2 border border-gray-300 rounded-md cursor-pointer" readonly placeholder="Seleccionar Distrito">
                <div id="edit-district-dropdown" class="multi-select-dropdown absolute w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto z-10 hidden"></div>
            </div>
        `;
        const editDistrictInput = document.getElementById('edit-district-input');
        const editDistrictDropdown = document.getElementById('edit-district-dropdown');
        populateSingleSelectCheckboxes(editDistrictDropdown, districts, 'edit-district-radio-group', 'Seleccionar Distrito', originalStudentData.district);
        setupSingleSelectDropdown(editDistrictInput, editDistrictDropdown, 'edit-district-radio-group');


        // Ocultar botones de Editar/Eliminar y mostrar Guardar/Cancelar
        if (studentActionButtons) studentActionButtons.classList.add('hidden');
        if (studentDataEditButtons) studentDataEditButtons.classList.remove('hidden');

        // Adjuntar event listeners para los botones de Guardar/Cancelar
        const saveBtn = document.getElementById('save-student-data-btn');
        const cancelBtn = document.getElementById('cancel-student-data-btn');
        console.log('handleEditStudentDataClick: saveBtn found:', !!saveBtn, 'cancelBtn found:', !!cancelBtn);
        // Asegurarse de que los listeners no se dupliquen si la función se llama varias veces
        saveBtn.removeEventListener('click', handleSaveStudentDataClick); // Remover antes de añadir
        cancelBtn.removeEventListener('click', handleCancelStudentDataClick); // Remover antes de añadir
        saveBtn.addEventListener('click', handleSaveStudentDataClick);
        cancelBtn.addEventListener('click', handleCancelStudentDataClick);
    }

    /**
     * Manejador para el clic en el botón de guardar datos del alumno (inline).
     */
    function handleSaveStudentDataClick() {
        console.log('handleSaveStudentDataClick called. isEditingStudentData:', isEditingStudentData);
        if (!isEditingStudentData) {
            console.log('Not in editing mode, exiting handleSaveStudentDataClick.');
            return;
        }

        const currentStudentIdentityJson = studentRecordsDiv ? studentRecordsDiv.dataset.currentStudentIdentity : null;
        if (!currentStudentIdentityJson) {
            console.error('Error: No se ha seleccionado un alumno para guardar.');
            showToast('Error: No se ha seleccionado un alumno para guardar.', 'error');
            return;
        }
        const originalStudentIdentity = JSON.parse(currentStudentIdentityJson);
        console.log('Original Student Identity:', originalStudentIdentity);

        const newName = document.getElementById('edit-name') ? document.getElementById('edit-name').value.trim() : '';
        const newAge = document.getElementById('edit-age') ? parseInt(document.getElementById('edit-age').value) : NaN;
        let newHeight = document.getElementById('edit-height') ? parseFloat(document.getElementById('edit-height').value) : NaN; // Estatura ahora es opcional

        // Si la estatura no es un número válido (ej. campo vacío), la guardamos como null
        if (isNaN(newHeight)) {
            newHeight = null;
        }

        const newSex = document.getElementById('edit-sex') ? document.getElementById('edit-sex').value : '';
        const newCourse = document.getElementById('edit-course') ? document.getElementById('edit-course').value.trim() : '';

        // Obtener la escuela y el distrito seleccionados de los radio buttons
        const selectedSchoolRadio = document.querySelector('#edit-school-dropdown input[type="radio"]:checked');
        const newSchool = selectedSchoolRadio && selectedSchoolRadio.value !== '' ? selectedSchoolRadio.value : null; // Usar null para campos vacíos

        const selectedDistrictRadio = document.querySelector('#edit-district-dropdown input[type="radio"]:checked');
        const newDistrict = selectedDistrictRadio && selectedDistrictRadio.value !== '' ? selectedDistrictRadio.value : null; // Usar null para campos vacíos

        console.log('Collected Data:');
        console.log('  Name:', newName);
        console.log('  Age:', newAge);
        console.log('  Sex:', newSex);
        console.log('  Height:', newHeight); // newHeight puede ser null aquí
        console.log('  Course:', newCourse);
        console.log('  School:', newSchool);
        console.log('  District:', newDistrict);

        // Validaciones (Estatura ya no es obligatoria, pero sus rangos sí si se proporciona)
        if (!newName || isNaN(newAge) || !newSex || !newCourse || newSchool === null || newDistrict === null) {
            console.error('Por favor, completa todos los campos obligatorios (Nombre, Edad, Sexo, Curso, Escuela, Distrito).');
            showToast('Por favor, completa todos los campos obligatorios.', 'error');
            return;
        }
        if (newAge <= 0 || newAge > 150) {
             console.error('La edad debe ser un número positivo y razonable.');
             showToast('La edad debe ser un número positivo y razonable.', 'error');
             return;
        }
        // Validar estatura solo si se ha proporcionado un valor (no es null)
        if (newHeight !== null && (newHeight <= 0 || newHeight > 300)) {
             console.error('La estatura debe ser un número positivo y razonable.');
             showToast('La estatura debe ser un número positivo y razonable.', 'error');
             return;
        }


        // Si la validación es exitosa, se puede proceder a guardar y salir del modo edición
        isEditingStudentData = false;

        allRecords.forEach(record => {
            if (record.name === originalStudentIdentity.name &&
                record.course === originalStudentIdentity.course &&
                record.school === originalStudentIdentity.school &&
                record.district === originalStudentIdentity.district) {

                record.name = newName;
                record.age = newAge;
                record.sex = newSex;
                record.height = newHeight; // newHeight puede ser null aquí
                record.course = newCourse;
                record.school = newSchool;
                record.district = newDistrict;
            }
        });

        saveRecords();

        const newStudentIdentity = {
            name: newName,
            course: newCourse,
            school: newSchool,
            district: newDistrict,
            age: newAge,
            sex: newSex
        };

        populateFilterOptions(); // Actualizar filtros globales
        filterAndDisplayStudents(); // Refrescar la lista de alumnos

        if (selectStudentSelect) {
            const newIdentityJson = JSON.stringify(newStudentIdentity);
            // Asegurarse de que la opción exista antes de intentar seleccionarla
            if (selectStudentSelect.querySelector(`option[value='${newIdentityJson}']`)) {
                selectStudentSelect.value = newIdentityJson;
            } else {
                console.warn('New student identity not found in selectStudentSelect options. May need re-selecting.');
            }
        }
        displayStudentRecords(newStudentIdentity); // Volver a cargar los datos y análisis
        console.log('Datos del alumno actualizados correctamente.');
        showToast('Datos del alumno actualizados correctamente.', 'success');


        // Restaurar interfaz: Mostrar botones de Editar/Eliminar y ocultar Guardar/Cancelar
        if (studentActionButtons) studentActionButtons.classList.remove('hidden');
        if (studentDataEditButtons) studentDataEditButtons.classList.add('hidden');

        // Remover event listeners después de una operación exitosa
        const saveBtn = document.getElementById('save-student-data-btn');
        const cancelBtn = document.getElementById('cancel-student-data-btn');
        if (saveBtn) saveBtn.removeEventListener('click', handleSaveStudentDataClick);
        if (cancelBtn) cancelBtn.removeEventListener('click', handleCancelStudentDataClick);
    }

    /**
     * Manejador para el clic en el botón de cancelar edición de datos del alumno (inline).
     */
    function handleCancelStudentDataClick() {
        console.log('handleCancelStudentDataClick called.');
        if (!isEditingStudentData) return; // Solo cancelar si estamos en modo edición
        isEditingStudentData = false;

        // Restaurar los valores originales en los spans
        if (studentNameDisplaySpan) studentNameDisplaySpan.innerHTML = originalStudentData.name || '-';
        if (studentAgeDisplaySpan) studentAgeDisplaySpan.innerHTML = originalStudentData.age || '-';
        if (studentSexDisplaySpan) originalStudentData.sex ? (studentSexDisplaySpan.innerHTML = originalStudentData.sex.charAt(0).toUpperCase() + originalStudentData.sex.slice(1)) : studentSexDisplaySpan.innerHTML = '-';
        if (studentHeightDisplaySpan) studentHeightDisplaySpan.innerHTML = originalStudentData.height ? `${originalStudentData.height} cm` : '-';
        if (studentCourseDisplaySpan) studentCourseDisplaySpan.innerHTML = originalStudentData.course || '-';
        if (studentSchoolDisplaySpan) studentSchoolDisplaySpan.innerHTML = originalStudentData.school || '-';
        if (studentDistrictDisplaySpan) studentDistrictDisplaySpan.innerHTML = originalStudentData.district || '-';

        // Mostrar botones de Editar/Eliminar y ocultar Guardar/Cancelar
        if (studentActionButtons) studentActionButtons.classList.remove('hidden');
        if (studentDataEditButtons) studentDataEditButtons.classList.add('hidden');

        // Remover event listeners para evitar llamadas duplicadas
        const saveBtn = document.getElementById('save-student-data-btn');
        const cancelBtn = document.getElementById('cancel-student-data-btn');
        if (saveBtn) saveBtn.removeEventListener('click', handleSaveStudentDataClick);
        if (cancelBtn) cancelBtn.removeEventListener('click', handleCancelStudentDataClick);

        console.log('Edición de datos del alumno cancelada.');
        showToast('Edición de datos del alumno cancelada.', 'info');
    }

    /**
     * Manejador para eliminar un alumno completo.
     */
    function handleDeleteStudentClick() {
        const currentStudentIdentityJson = studentRecordsDiv ? studentRecordsDiv.dataset.currentStudentIdentity : null;
        if (!currentStudentIdentityJson) {
            console.error('Por favor, selecciona un alumno para eliminar.');
            showToast('Por favor, selecciona un alumno para eliminar.', 'error');
            return;
        }
        const studentIdentity = JSON.parse(currentStudentIdentityJson);
        const displayString = `${studentIdentity.name} (${studentIdentity.course || '-'}, ${studentIdentity.school || '-'}, ${studentIdentity.district || '-'})`;

        // Confirmación para el usuario
        if (!confirm(`¿Estás seguro de que deseas eliminar TODOS los registros de ${displayString}? Esta acción no se puede deshacer.`)) {
            console.log('Eliminación de alumno cancelada por el usuario.');
            return;
        }

        console.log(`Procediendo a eliminar todos los registros de: ${displayString}`);

        // Filtrar `allRecords` para excluir los registros del alumno a eliminar
        const initialRecordCount = allRecords.length;
        allRecords = allRecords.filter(record =>
            !(record.name === studentIdentity.name &&
                record.course === studentIdentity.course &&
                record.school === studentIdentity.school &&
                record.district === studentIdentity.district)
        );
        const recordsRemoved = initialRecordCount - allRecords.length;
        console.log(`Se eliminaron ${recordsRemoved} registros.`);

        saveRecords(); // Guardar los cambios en localStorage

        // Limpiar la interfaz de usuario
        if (studentRecordsDiv) studentRecordsDiv.classList.add('hidden');
        if (selectedStudentNameDisplay) selectedStudentNameDisplay.textContent = '';
        if (recordsTableBody) recordsTableBody.innerHTML = '';
        if (studentRecordsDiv) studentRecordsDiv.dataset.currentStudentIdentity = '';
        if (analysisRowsContainer) analysisRowsContainer.innerHTML = ''; // Limpiar análisis

        // Actualizar la lista de alumnos y filtros
        populateFilterOptions();
        filterAndDisplayStudents();
        console.log(`Todos los registros de ${displayString} han sido eliminados correctamente.`);
        showToast(`Todos los registros de ${displayString} han sido eliminados correctamente.`, 'success');
    }

    // Event Listeners
    if (applyViewFiltersBtn) {
        applyViewFiltersBtn.addEventListener('click', filterAndDisplayStudents);
    }
    if (printFilteredListBtn) {
        printFilteredListBtn.addEventListener('click', () => {
            const filters = getViewFilters();
            const filteredStudents = allRecords.filter(record => {
                let passesFilters = true;
                if (filters.age && record.age !== undefined && record.age !== null && record.age !== parseInt(filters.age)) passesFilters = false;
                if (filters.sex && record.sex && record.sex !== filters.sex) passesFilters = false;
                if (filters.minHeight !== undefined && filters.minHeight !== null && filters.minHeight !== '') {
                    const minHeightValue = parseFloat(filters.minHeight);
                    if (!isNaN(minHeightValue) && (record.height === undefined || record.height === null || parseFloat(record.height) < minHeightValue)) {
                        passesFilters = false;
                    }
                }
                if (filters.course && record.course && record.course !== filters.course) passesFilters = false;
                if (filters.school && record.school && record.school !== filters.school) passesFilters = false;
                if (filters.district && record.district && record.district !== filters.district) passesFilters = false;
                return passesFilters;
            }).filter((record, index, self) =>
                index === self.findIndex((r) =>
                    r.name === record.name &&
                    r.course === record.course &&
                    r.school === record.school &&
                    r.district === record.district
                )
            );
            printFilteredList(filteredStudents);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterAndDisplayStudents);
    }

    if (searchResultsUl) {
        searchResultsUl.addEventListener('click', (event) => {
            if (event.target.tagName === 'LI' && event.target.dataset.studentIdentity) {
                const studentIdentityJson = event.target.dataset.studentIdentity;
                const studentIdentity = JSON.parse(studentIdentityJson);

                if (searchInput) {
                    const displayString = `${studentIdentity.name} (${studentIdentity.course || '-'}, ${studentIdentity.school || '-'}, ${studentIdentity.district || '-'})`;
                    searchInput.value = displayString;
                }

                if (searchResultsUl) {
                    searchResultsUl.innerHTML = '';
                    searchResultsUl.classList.remove('visible');
                }

                if (selectStudentSelect) selectStudentSelect.value = studentIdentityJson;
                displayStudentRecords(studentIdentity);
            }
        });
    }

    if (selectStudentSelect) {
        selectStudentSelect.addEventListener('change', (event) => {
            const studentIdentityJson = event.target.value;
            if (studentIdentityJson) {
                const studentIdentity = JSON.parse(studentIdentityJson);
                if (searchInput) searchInput.value = '';
                if (searchResultsUl) {
                    searchResultsUl.innerHTML = '';
                    searchResultsUl.classList.remove('visible');
                }
                displayStudentRecords(studentIdentity);
            } else {
                if (studentRecordsDiv) studentRecordsDiv.classList.add('hidden');
                if (selectedStudentNameDisplay) selectedStudentNameDisplay.textContent = '';
                if (studentNameDisplaySpan) studentNameDisplaySpan.innerHTML = '-';
                if (studentAgeDisplaySpan) studentAgeDisplaySpan.innerHTML = '-';
                if (studentSexDisplaySpan) studentSexDisplaySpan.innerHTML = '-';
                if (studentHeightDisplaySpan) studentHeightDisplaySpan.innerHTML = '-';
                if (studentCourseDisplaySpan) studentCourseDisplaySpan.innerHTML = '-';
                if (studentSchoolDisplaySpan) studentSchoolDisplaySpan.innerHTML = '-';
                if (studentDistrictDisplaySpan) studentDistrictDisplaySpan.innerHTML = '-';
                if (recordsTableBody) recordsTableBody.innerHTML = '';
                if (studentRecordsDiv) studentRecordsDiv.dataset.currentStudentIdentity = '';
                if (analysisRowsContainer) analysisRowsContainer.innerHTML = ''; // Limpiar análisis
            }
        });
    }

    if (editStudentDataBtn) {
        editStudentDataBtn.addEventListener('click', handleEditStudentDataClick);
    }

    if (deleteStudentBtn) {
        deleteStudentBtn.addEventListener('click', handleDeleteStudentClick);
    }
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            const currentStudentIdentityJson = studentRecordsDiv ? studentRecordsDiv.dataset.currentStudentIdentity : null;
            if (currentStudentIdentityJson) {
                const studentIdentity = JSON.parse(currentStudentIdentityJson);
                navigateToSection('report-section', { studentIdentity: studentIdentity, allRecords: allRecords });
            } else {
                console.error('Por favor, selecciona un alumno para generar la ficha.');
                showToast('Por favor, selecciona un alumno para generar la ficha.', 'error');
            }
        });
    }

    // Event delegation for record table buttons
    if (recordsTableBody) {
        recordsTableBody.addEventListener('click', handleTableButtonClick);
    }

    // Initial load logic
    populateFilterOptions();
    filterAndDisplayStudents();
    if (initialData.studentIdentity) {
        const identityJson = JSON.stringify(initialData.studentIdentity);
        if (selectStudentSelect) selectStudentSelect.value = identityJson;
        displayStudentRecords(initialData.studentIdentity);
    } else {
        if (studentRecordsDiv) studentRecordsDiv.classList.add('hidden');
    }
}

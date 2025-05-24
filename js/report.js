// js/report.js

function initReportSection(data) {
    console.log("initReportSection: Iniciando la sección de reporte.");

    const reportStudentNameSpan = document.getElementById('report-student-name');
    const reportDateSpan = document.getElementById('report-date');
    const reportStudentAgeSpan = document.getElementById('report-student-age');
    const reportStudentSexSpan = document.getElementById('report-student-sex');
    const reportStudentHeightSpan = document.getElementById('report-student-height');
    const reportStudentCourseSpan = document.getElementById('report-student-course');
    const reportStudentSchoolSpan = document.getElementById('report-school');
    const reportStudentDistrictSpan = document.getElementById('report-district');
    const reportAcademicYearSpan = document.getElementById('report-academic-year');
    const individualResultsContainer = document.getElementById('individual-results-container');
    const evolutionAnalysisDiv = document.getElementById('evolution-analysis'); // Este div ahora solo contendrá la evolución
    const printReportBtn = document.getElementById('print-report-btn');

    const studentIdentity = data.studentIdentity;
    const allRecords = data.allRecords;

    if (!studentIdentity || !allRecords || !Array.isArray(allRecords)) {
        console.error('initReportSection: Datos insuficientes para generar el reporte. studentIdentity o allRecords no proporcionados/válidos.');
        if (individualResultsContainer) individualResultsContainer.innerHTML = '<p class="text-red-500 text-center">No se pudo generar el reporte. Por favor, selecciona un alumno e inténtalo de nuevo.</p>';
        return;
    }

    /**
     * Genera la ficha del alumno, incluyendo tablas de resultados, gráficos y análisis.
     * @param {Object} studentIdentity - La identidad del alumno.
     * @param {Array<Object>} allRecords - Todos los registros de la aplicación.
     */
    function generateReportContent(studentIdentity, allRecords) {
        console.log("generateReportContent: Generando contenido del reporte para:", studentIdentity.name);

        const studentRecords = allRecords.filter(record =>
            record.name === studentIdentity.name &&
            record.course === studentIdentity.course &&
            record.school === studentIdentity.school &&
            record.district === studentIdentity.district
        ).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (studentRecords.length === 0) {
            console.warn('generateReportContent: No se encontraron registros para este alumno.');
            if (individualResultsContainer) individualResultsContainer.innerHTML = '<p class="text-red-500 text-center">No se encontraron registros para este alumno.</p>';
            return;
        }

        const latestRecord = studentRecords[studentRecords.length - 1];
        console.log("generateReportContent: Último registro del alumno:", latestRecord);

        // Actualizar información del alumno en la cabecera del reporte
        if (reportStudentNameSpan) reportStudentNameSpan.textContent = `${latestRecord.name || '-'} (${latestRecord.course || '-'}, ${latestRecord.school || '-'}, ${latestRecord.district || '-'})`;
        if (reportDateSpan) reportDateSpan.textContent = formatDateFromISO(new Date().toISOString().split('T')[0]);
        if (reportStudentAgeSpan) reportStudentAgeSpan.textContent = latestRecord.age || '-';
        if (reportStudentSexSpan) reportStudentSexSpan.textContent = latestRecord.sex ? (latestRecord.sex.charAt(0).toUpperCase() + latestRecord.sex.slice(1)) : '-';
        if (reportStudentHeightSpan) reportStudentHeightSpan.textContent = latestRecord.height ? `${latestRecord.height} cm` : '-';
        if (reportStudentCourseSpan) reportStudentCourseSpan.textContent = latestRecord.course || '-';
        if (reportStudentSchoolSpan) reportStudentSchoolSpan.textContent = latestRecord.school || '-';
        if (reportStudentDistrictSpan) reportStudentDistrictSpan.textContent = latestRecord.district || '-';
        if (reportAcademicYearSpan) reportAcademicYearSpan.textContent = latestRecord.academicYear || '-';

        if (individualResultsContainer) individualResultsContainer.innerHTML = '';

        for (const chartId in chartInstances) {
            if (chartInstances[chartId]) {
                chartInstances[chartId].destroy();
                delete chartInstances[chartId];
            }
        }

        const groupedRecords = studentRecords.reduce((acc, record) => {
            const key = record.testType || 'height';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(record);
            return acc;
        }, {});

        for (const testType in groupedRecords) {
            const records = groupedRecords[testType];
            records.sort((a, b) => new Date(a.date) - new Date(b.date));

            const sectionItem = document.createElement('div');
            sectionItem.classList.add('report-section-item');

            const sectionTitle = document.createElement('h3');
            sectionTitle.classList.add('text-lg', 'font-semibold', 'mb-2');
            sectionTitle.textContent = testType === 'height' ? 'Estatura' : (testTypeMap[testType] || testType);
            sectionItem.appendChild(sectionTitle);

            const reportContentRow = document.createElement('div');
            reportContentRow.classList.add('report-content-row');

            const tableContainer = document.createElement('div');
            tableContainer.classList.add('w-full', 'md:w-1/2');

            const tableTitle = document.createElement('h4');
            tableTitle.classList.add('text-md', 'font-semibold', 'mb-1');
            tableTitle.textContent = 'Historial de Resultados';
            tableContainer.appendChild(tableTitle);

            const table = document.createElement('table');
            table.classList.add('min-w-full', 'divide-y', 'divide-gray-200');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            tbody.dataset.studentIdentity = JSON.stringify(studentIdentity);

            thead.innerHTML = `
                <tr>
                    <th>Fecha</th>
                    <th>Resultado</th>
                    <th>Ciclo Lectivo</th>
                </tr>
            `;

            records.forEach(record => {
                const row = document.createElement('tr');
                row.dataset.recordId = record.id;
                row.dataset.originalTestType = record.testType;

                row.innerHTML = `
                    <td>${formatDateFromISO(record.date)}</td>
                    <td>${record.result || '-'}</td>
                    <td>${record.academicYear || '-'}</td>
                `;
                tbody.appendChild(row);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            tableContainer.appendChild(table);
            reportContentRow.appendChild(tableContainer);

            const chartWrapper = document.createElement('div');
            chartWrapper.classList.add('w-full', 'md:w-1/2');

            const recordsWithValidResults = records.filter(record => record.result !== undefined && record.result !== null && !isNaN(record.result));

            if (recordsWithValidResults.length >= 2) {
                const chartContainer = document.createElement('div');
                chartContainer.classList.add('chart-container');
                const canvas = document.createElement('canvas');
                const canvasId = `chart-${testType}-${studentIdentity.name.replace(/\s/g, '')}`;
                canvas.id = canvasId;
                chartContainer.appendChild(canvas);
                chartWrapper.appendChild(chartContainer);

                const ctx = canvas.getContext('2d');
                try {
                    chartInstances[canvasId] = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: recordsWithValidResults.map(record => formatDateFromISO(record.date)),
                            datasets: [{
                                label: testType === 'height' ? 'Estatura (cm)' : (testTypeMap[testType] || testType),
                                data: recordsWithValidResults.map(record => record.result),
                                borderColor: testType === 'height' ? '#3b82f6' : '#2ecc71',
                                backgroundColor: testType === 'height' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(46, 204, 113, 0.2)',
                                tension: 0.1,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Fecha'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: testType === 'height' ? 'Estatura (cm)' : (testTypeMap[testType] || testType),
                                    },
                                    reverse: isLowerBetterMap[testType] || false,
                                    beginAtZero: testType !== 'height' && testType !== 'flexibility'
                                }
                            },
                            plugins: {
                                legend: {
                                    display: true
                                }
                            }
                        }
                    });
                } catch (chartError) {
                    console.error("Error creating chart for", testType, ":", chartError);
                    chartContainer.innerHTML = `<p class="text-center text-red-500">Error al generar el gráfico de ${testTypeMap[testType] || testType}.</p>`;
                }

            } else {
                const messageContainer = document.createElement('div');
                messageContainer.classList.add('chart-container', 'flex', 'items-center', 'justify-center', 'text-gray-500', 'italic');
                messageContainer.textContent = `Se necesitan al menos 2 registros con resultados válidos para mostrar el gráfico de evolución de ${testType === 'height' ? 'Estatura' : (testTypeMap[testType] || testType)}.`;
                chartWrapper.appendChild(messageContainer);
            }

            reportContentRow.appendChild(chartWrapper);
            sectionItem.appendChild(reportContentRow);
            if (individualResultsContainer) individualResultsContainer.appendChild(sectionItem);
        }

        // --- Análisis de Evolución ---
        console.log("generateReportContent: Iniciando sección de Análisis de Evolución.");
        let evolutionAnalysisHtml = '<h4 class="text-lg font-semibold mt-6 mb-2">Análisis de Evolución</h4><ul class="list-disc pl-5">';
        let hasAnalyzedEvolutionTests = false;

        for (const testType of Object.keys(testTypeMap)) {
            const testName = testTypeMap[testType];
            const unit = testUnits[testType] || '';

            const recordsForEvolution = studentRecords.filter(r => r.testType === testType && r.result !== undefined && r.result !== null && !isNaN(r.result))
                                                    .sort((a, b) => new Date(b.date) - new Date(a.date));

            const currentResult = recordsForEvolution.length > 0 ? parseFloat(recordsForEvolution[0].result) : null;
            const previousResult = recordsForEvolution.length > 1 ? parseFloat(recordsForEvolution[1].result) : null;

            if (currentResult !== null && previousResult !== null) {
                hasAnalyzedEvolutionTests = true;
                const isLowerBetter = isLowerBetterMap[testType];
                let evolutionMessage = '';
                let evolutionClass = '';

                if (isLowerBetter) {
                    if (currentResult < previousResult) {
                        evolutionMessage = `Ha mejorado su ${testName.toLowerCase()} de ${previousResult}${unit} a ${currentResult}${unit}.`;
                        evolutionClass = 'positive';
                    } else if (currentResult > previousResult) {
                        evolutionMessage = `Ha disminuido su ${testName.toLowerCase()} de ${previousResult}${unit} a ${currentResult}${unit}.`;
                        evolutionClass = 'negative';
                    } else {
                        evolutionMessage = `Su ${testName.toLowerCase()} se ha mantenido constante en ${currentResult}${unit}.`;
                        evolutionClass = 'neutral';
                    }
                } else {
                    if (currentResult > previousResult) {
                        evolutionMessage = `Ha mejorado su ${testName.toLowerCase()} de ${previousResult}${unit} a ${currentResult}${unit}.`;
                        evolutionClass = 'positive';
                    } else if (currentResult < previousResult) {
                        evolutionMessage = `Su ${testName.toLowerCase()} ha disminuido de ${previousResult}${unit} a ${currentResult}${unit}.`;
                        evolutionClass = 'negative';
                    } else {
                        evolutionMessage = `Su ${testName.toLowerCase()} se ha mantenido constante en ${currentResult}${unit}.`;
                        evolutionClass = 'neutral';
                    }
                }
                evolutionAnalysisHtml += `
                    <li>
                        <strong>${testName}:</strong>
                        <div class="evolution-message-container ${evolutionClass}">
                            ${evolutionMessage}
                        </div>
                    </li>
                `;
                console.log(`Evolución ${testName}:`, evolutionMessage);
            } else {
                console.log(`Evolución ${testType}: Se necesitan al menos 2 registros para analizar la evolución.`);
            }
        }
        evolutionAnalysisHtml += '</ul>';
        if (!hasAnalyzedEvolutionTests) {
            evolutionAnalysisHtml = '<h4 class="text-lg font-semibold mt-6 mb-2">Análisis de Evolución</h4><p>Se necesitan al menos 2 registros con resultados válidos para una prueba o estatura para analizar la evolución.</p>';
        }
        if (evolutionAnalysisDiv) evolutionAnalysisDiv.innerHTML = evolutionAnalysisHtml;

        console.log("generateReportContent: Finalizado.");
    }

    function printReport() {
        console.log("printReport: Imprimiendo reporte.");
        window.print();
    }

    if (printReportBtn) {
        printReportBtn.addEventListener('click', printReport);
    }

    generateReportContent(studentIdentity, allRecords);
}

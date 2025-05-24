// js/import-export.js

function initImportExportSection() {
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const importFileInput = document.getElementById('import-file-input');
    const importDataBtn = document.getElementById('import-data-btn');

    /**
     * Exporta los datos a un archivo JSON.
     */
    function exportToJson() {
        if (allRecords.length === 0) {
            console.error('No hay datos para exportar.');
            return;
        }
        try {
            const dataStr = JSON.stringify(allRecords, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'registros_educacion_fisica.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Error exporting JSON:", e);
            console.error("Ocurrio un error al exportar los datos a JSON.");
        }
    }

    /**
     * Exporta los datos a un archivo CSV.
     */
    function exportToCsv() {
        if (allRecords.length === 0) {
            console.error('No hay datos para exportar.');
            return;
        }
        try {
            const headers = Object.values(csvHeadersMap);
            let csvContent = headers.join(',') + '\n';

            allRecords.forEach(record => {
                const row = Object.keys(csvHeadersMap).map(key => {
                    let value = record[key];
                    if (value === undefined || value === null) {
                        value = '';
                    }
                    if (key === 'date' && value) {
                        value = formatDate(value);
                    }
                    if (typeof value === 'string') {
                        value = value.replace(/"/g, '""');
                        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                            value = `"${value}"`;
                        }
                    }
                    return value;
                }).join(',');
                csvContent += row + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'registros_educacion_fisica.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Error exporting CSV:", e);
            console.error("Ocurrio un error al exportar los datos a CSV.");
        }
    }

    /**
     * Importa datos desde un archivo (JSON o CSV).
     * @param {File} file - El archivo a importar.
     */
    function importData(file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const content = e.target.result;
                let importedRecords = [];

                if (file.name.endsWith('.json')) {
                    importedRecords = JSON.parse(content);
                    if (!Array.isArray(importedRecords) || importedRecords.some(record => !record.id || !record.name || !record.testType || record.result === undefined)) {
                        console.error('El archivo JSON no tiene el formato esperado.');
                        return;
                    }
                    importedRecords.forEach(record => {
                        if (!record.academicYear && record.date) {
                            record.academicYear = getAcademicYear(record.date);
                        } else if (!record.academicYear) {
                            record.academicYear = '-';
                        }
                    });

                } else if (file.name.endsWith('.csv')) {
                    importedRecords = parseCsv(content);
                    if (importedRecords.length === 0) {
                        console.error('El archivo CSV esta vacio o no se pudieron parsear registros validos.');
                        return;
                    }
                } else {
                    console.error('Formato de archivo no soportado. Por favor, selecciona un archivo .json o .csv.');
                    return;
                }

                allRecords = importedRecords;
                saveRecords();
                console.log('Datos importados correctamente.');

                // Recargar la interfaz de la sección actual o ir a "Ver Alumnos"
                if (currentSectionId !== 'view-records-section') {
                    navigateToSection('view-records-section');
                } else {
                    // Si ya estábamos en "Ver Alumnos", refrescar la vista
                    const currentStudentIdentityJson = document.querySelector('#select-student') ? document.querySelector('#select-student').value : null;
                    if (currentStudentIdentityJson) {
                        const currentStudentIdentity = JSON.parse(currentStudentIdentityJson);
                        const reselectedIdentity = filteredStudentList.find(student =>
                            student.name === currentStudentIdentity.name &&
                            student.course === currentStudentIdentity.course &&
                            student.school === currentStudentIdentity.school &&
                            student.district === currentStudentIdentity.district
                        );
                        if (reselectedIdentity) {
                            navigateToSection('view-records-section', { studentIdentity: reselectedIdentity });
                        } else {
                            navigateToSection('view-records-section'); // Ir a la vista general si el alumno ya no existe
                        }
                    } else {
                        navigateToSection('view-records-section'); // Ir a la vista general
                    }
                }

            } catch (error) {
                console.error("Error importing data:", error);
                console.error('Ocurrio un error al procesar el archivo. Asegurate de que el formato sea correcto.');
            }
        };

        reader.onerror = function() {
            console.error('Ocurrio un error al leer el archivo.');
        };

        reader.readAsText(file);
    }

    // Event Listeners
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportToJson);
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCsv);
    if (importDataBtn && importFileInput) {
        importDataBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                importData(file);
            }
            importFileInput.value = '';
        });
    }
}

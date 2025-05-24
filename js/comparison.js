// js/comparison.js

function initComparisonSection() {
    const filterAgeSelect = document.getElementById('filter-age');
    const filterSexSelect = document.getElementById('filter-sex');
    const filterCourseSelect = document.getElementById('filter-course');
    const filterSchoolInput = document.getElementById('filter-school-input');
    const filterSchoolDropdown = document.getElementById('filter-school-dropdown');
    const filterDistrictInput = document.getElementById('filter-district-input');
    const filterDistrictDropdown = document.getElementById('filter-district-dropdown');
    const filterTestTypeSelect = document.getElementById('filter-test-type');
    const showComparisonBtn = document.getElementById('show-comparison-btn');
    const comparisonResultsDiv = document.getElementById('comparison-results');
    const comparisonTableBody = document.getElementById('comparison-table-body');
    const comparisonTableHeaders = document.querySelectorAll('#comparison-table th[data-sort]');
    const averageResultSpan = document.getElementById('average-result');
    const advancedComparisonSummaryDiv = document.getElementById('advanced-comparison-summary');
    const summaryListUl = document.getElementById('summary-list');
    const comparisonChartContainer = document.getElementById('comparison-chart-container');
    const comparisonChartCanvas = document.getElementById('comparison-chart');
    let comparisonChartInstance = null;

    let currentComparisonSortColumn = 'result';
    let currentComparisonSortDirection = 'desc';

    /**
     * Muestra los resultados del comparativo.
     */
    function displayComparisonResults() {
        const filters = getComparisonFilters();
        const selectedTestType = filters.testType;
        const selectedSchools = filters.schools;
        const selectedDistricts = filters.districts;

        if (!selectedTestType) {
            if (comparisonResultsDiv) comparisonResultsDiv.classList.remove('hidden');
            if (comparisonTableBody) comparisonTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-gray-500">Por favor, selecciona un tipo de prueba para el comparativo.</td></tr>';
            if (averageResultSpan) averageResultSpan.textContent = '-';
            if (advancedComparisonSummaryDiv) advancedComparisonSummaryDiv.classList.add('hidden');
            if (comparisonChartContainer) comparisonChartContainer.classList.add('hidden');
            if (comparisonChartInstance) {
                comparisonChartInstance.destroy();
                comparisonChartInstance = null;
            }
            return;
        }

        let filteredRecords = allRecords.filter(record => {
            let passesGeneralFilters = true;
            if (filters.age && record.age !== undefined && record.age !== null && record.age !== parseInt(filters.age)) passesGeneralFilters = false;
            if (filters.sex && record.sex && record.sex !== filters.sex) passesGeneralFilters = false;
            if (filters.course && record.course && record.course !== filters.course) passesGeneralFilters = false;

            if (filters.schools && filters.schools.length > 0) {
                if (!record.school || !filters.schools.includes(record.school)) {
                    passesGeneralFilters = false;
                }
            }

            if (filters.districts && filters.districts.length > 0) {
                if (!record.district || !filters.districts.includes(record.district)) {
                    passesGeneralFilters = false;
                }
            }

            return passesGeneralFilters && record.testType === selectedTestType && record.result !== undefined && record.result !== null && !isNaN(record.result);
        });

        const groupedRecordsByIdentity = filteredRecords.reduce((acc, record) => {
            const identityKey = `${record.name}|${record.course}|${record.school}|${record.district}`;
            if (!acc[identityKey]) {
                acc[identityKey] = [];
            }
            acc[identityKey].push(record);
            return acc;
        }, {});

        const bestRecordsForComparison = Object.values(groupedRecordsByIdentity).map(records => {
            const isLowerBetter = (selectedTestType === 'speed30m' || selectedTestType === 'run500m');

            records.sort((a, b) => {
                if (a.result === b.result) {
                    return new Date(a.date) - new Date(a.date);
                }
                if (isLowerBetter) {
                    return a.result - b.result;
                } else {
                    return b.result - a.result;
                }
            });
            return records[0];
        });

        let totalResults = 0;
        let validResultCount = 0;
        bestRecordsForComparison.forEach(record => {
            if (record.result !== undefined && record.result !== null && !isNaN(record.result)) {
                totalResults += record.result;
                validResultCount++;
            }
        });

        const average = validResultCount > 0 ? totalResults / validResultCount : 0;

        if (averageResultSpan) {
            if (validResultCount > 0) {
                averageResultSpan.textContent = average.toFixed(2);
            } else {
                averageResultSpan.textContent = '-';
            }
        }

        if (summaryListUl) summaryListUl.innerHTML = '';
        if (advancedComparisonSummaryDiv) advancedComparisonSummaryDiv.classList.add('hidden');
        if (comparisonChartContainer) comparisonChartContainer.classList.add('hidden');
        if (comparisonChartInstance) {
            comparisonChartInstance.destroy();
            comparisonChartInstance = null;
        }

        let groupBy = null;
        let groupNames = [];
        let groupAverages = [];
        let groupBackgroundColors = [];

        const multipleSchoolsSelected = selectedSchools.length > 1 || (selectedSchools.length === 1 && selectedSchools[0] !== "");
        const multipleDistrictsSelected = selectedDistricts.length > 1 || (selectedDistricts.length === 1 && selectedDistricts[0] !== "");

        if (selectedSchools.length > 0 && !multipleDistrictsSelected) {
            groupBy = 'school';
            if (advancedComparisonSummaryDiv) advancedComparisonSummaryDiv.querySelector('h4').textContent = 'Resumen Comparativo por Escuela';
        } else if (selectedDistricts.length > 0 && !multipleSchoolsSelected) {
            groupBy = 'district';
            if (advancedComparisonSummaryDiv) advancedComparisonSummaryDiv.querySelector('h4').textContent = 'Resumen Comparativo por Distrito';
        } else if (selectedSchools.length > 0 && selectedDistricts.length > 0) {
            console.warn("Multiple schools and districts selected. Skipping grouped comparison summary.");
            groupBy = null;
        }

        if (groupBy) {
            const groupedSummary = bestRecordsForComparison.reduce((acc, record) => {
                const key = record[groupBy] || 'Desconocido';
                if (!acc[key]) {
                    acc[key] = { total: 0, count: 0, name: key };
                }
                if (record.result !== undefined && record.result !== null && !isNaN(record.result)) {
                    acc[key].total += record.result;
                    acc[key].count++;
                }
                return acc;
            }, {});

            const summaryItems = Object.values(groupedSummary).map(group => {
                const groupAverage = group.count > 0 ? group.total / group.count : 0;
                return { name: group.name, average: groupAverage, count: group.count };
            });

            const isLowerBetter = (selectedTestType === 'speed30m' || selectedTestType === 'run500m');
            summaryItems.sort((a, b) => {
                if (a.average === b.average) return 0;
                if (isLowerBetter) {
                    return a.average - b.average;
                } else {
                    return b.average - a.average;
                }
            });

            summaryItems.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${item.name}:</strong> Promedio ${item.average.toFixed(2)} (${item.count} alumnos)`;
                if (summaryListUl) summaryListUl.appendChild(li);

                groupNames.push(item.name);
                groupAverages.push(item.average);
                groupBackgroundColors.push(getRandomColor());
            });

            if (summaryItems.filter(item => item.count > 0).length >= 2) {
                if (advancedComparisonSummaryDiv) advancedComparisonSummaryDiv.classList.remove('hidden');
                if (comparisonChartContainer) comparisonChartContainer.classList.remove('hidden');
                const ctx = comparisonChartCanvas ? comparisonChartCanvas.getContext('2d') : null;

                if (comparisonChartInstance) {
                    comparisonChartInstance.destroy();
                    comparisonChartInstance = null;
                }

                if (ctx) {
                    comparisonChartInstance = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: groupNames,
                            datasets: [{
                                label: `Promedio de ${testTypeMap[selectedTestType] || selectedTestType}`,
                                data: groupAverages,
                                backgroundColor: groupBackgroundColors,
                                borderColor: groupBackgroundColors.map(color => color.replace('0.8', '1')),
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: `Resultado (${testTypeMap[selectedTestType] || selectedTestType})`
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: groupBy === 'school' ? 'Escuela' : 'Distrito'
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false
                                }
                            }
                        }
                    });
                }
            }
        }

        bestRecordsForComparison.sort((a, b) => {
            const aValue = a[currentComparisonSortColumn];
            const bValue = b[currentComparisonSortColumn];

            if (aValue === undefined || aValue === null) return currentComparisonSortDirection === 'asc' ? 1 : -1;
            if (bValue === undefined || bValue === null) return currentComparisonSortDirection === 'asc' ? -1 : 1;

            if (currentComparisonSortColumn === 'date') {
                return currentComparisonSortDirection === 'asc' ? new Date(aValue) - new Date(bValue) : new Date(bValue) - new Date(aValue);
            } else if (currentComparisonSortColumn === 'result' || currentComparisonSortColumn === 'age' || currentComparisonSortColumn === 'height') {
                return currentComparisonSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            } else {
                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
                if (aStr < bStr) return currentComparisonSortDirection === 'asc' ? -1 : 1;
                if (aStr > bStr) return currentComparisonSortDirection === 'asc' ? 1 : -1;
                return 0;
            }
        });

        if (!groupBy && bestRecordsForComparison.length >= 3) {
            const isLowerBetter = (selectedTestType === 'speed30m' || selectedTestType === 'run500m');

            bestRecordsForComparison.sort((a, b) => {
                if (isLowerBetter) {
                    return a.result - b.result;
                } else {
                    return b.result - a.result;
                }
            });

            if (bestRecordsForComparison[0]) bestRecordsForComparison[0].medal = 'gold';
            if (bestRecordsForComparison[1]) bestRecordsForComparison[1].medal = 'silver';
            if (bestRecordsForComparison[2]) bestRecordsForComparison[2].medal = 'bronze';

            bestRecordsForComparison.sort((a, b) => {
                const aValue = a[currentComparisonSortColumn];
                const bValue = b[currentComparisonSortColumn];

                if (aValue === undefined || aValue === null) return currentComparisonSortDirection === 'asc' ? 1 : -1;
                if (bValue === undefined || bValue === null) return currentComparisonSortDirection === 'asc' ? -1 : 1;

                if (currentComparisonSortColumn === 'date') {
                    return currentComparisonSortDirection === 'asc' ? new Date(aValue) - new Date(bValue) : new Date(bValue) - new Date(aValue);
                } else if (currentComparisonSortColumn === 'result' || currentComparisonSortColumn === 'age' || currentComparisonSortColumn === 'height') {
                    return currentComparisonSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                } else {
                    const aStr = String(aValue).toLowerCase();
                    const bStr = String(bValue).toLowerCase();
                    if (aStr < bStr) return currentComparisonSortDirection === 'asc' ? -1 : 1;
                    if (aStr > bStr) return currentComparisonSortDirection === 'asc' ? 1 : -1;
                    return 0;
                }
            });
        } else {
            bestRecordsForComparison.forEach(record => delete record.medal);
        }

        if (comparisonTableBody) comparisonTableBody.innerHTML = '';

        if (bestRecordsForComparison.length === 0) {
            if (comparisonTableBody) comparisonTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-gray-500">No se encontraron mejores resultados para los filtros seleccionados.</td></tr>';
        } else {
            bestRecordsForComparison.forEach(record => {
                const row = document.createElement('tr');
                const resultCellContent = record.result !== undefined && record.result !== null ? record.result : '-';
                const medalEmoji = record.medal === 'gold' ? ' 🥇' : record.medal === 'silver' ? ' 🥈' : record.medal === 'bronze' ? ' 🥉' : '';
                const nameCellContent = record.name || '-';
                const nameWithMedal = record.medal ? `${nameCellContent} ${medalEmoji}` : nameCellContent;

                row.innerHTML = `
                    <td>${nameWithMedal}</td>
                    <td>${record.age || '-'}</td>
                    <td>${record.sex ? (record.sex.charAt(0).toUpperCase() + record.sex.slice(1)) : '-'}</td>
                    <td>${record.course || '-'}</td>
                    <td>${record.school || '-'}</td>
                    <td>${record.district || '-'}</td>
                    <td>${formatDate(record.date)}</td>
                    <td>${record.academicYear || '-'}</td>
                    <td>${resultCellContent}</td>
                `;
                if (comparisonTableBody) comparisonTableBody.appendChild(row);
            });
        }

        if (comparisonResultsDiv) comparisonResultsDiv.classList.remove('hidden');
    }

    /**
     * Maneja el ordenamiento en la tabla de comparativo.
     * @param {Event} event - El evento de clic.
     */
    function handleComparisonSort(event) {
        const column = event.currentTarget.dataset.sort;

        if (currentComparisonSortColumn === column) {
            currentComparisonSortDirection = currentComparisonSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentComparisonSortColumn = column;
            const selectedTestType = filterTestTypeSelect ? filterTestTypeSelect.value : '';
            if (column === 'result' && selectedTestType) {
                const isLowerBetter = (selectedTestType === 'speed30m' || selectedTestType === 'run500m');
                currentComparisonSortDirection = isLowerBetter ? 'asc' : 'desc';
            } else if (column === 'age' || column === 'height') {
                currentComparisonSortDirection = 'desc';
            } else {
                currentComparisonSortDirection = 'asc';
            }
        }

        comparisonTableHeaders.forEach(header => {
            const icon = header.querySelector('.fas');
            if (icon) {
                icon.classList.remove('fa-sort-up', 'fa-sort-down', 'fa-sort');
                if (header.dataset.sort === currentComparisonSortColumn) {
                    icon.classList.add(currentComparisonSortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
                } else {
                    icon.classList.add('fa-sort');
                }
            }
        });

        displayComparisonResults();
    }

    // Event Listeners
    if (showComparisonBtn) {
        showComparisonBtn.addEventListener('click', displayComparisonResults);
    }

    if (comparisonTableHeaders) {
        comparisonTableHeaders.forEach(header => {
            header.addEventListener('click', handleComparisonSort);
            const icon = document.createElement('i');
            icon.classList.add('fas', 'fa-sort');
            header.appendChild(icon);
        });
    }

    // Inicializar icono de ordenamiento en la columna por defecto
    const defaultSortHeader = document.querySelector(`#comparison-table th[data-sort="${currentComparisonSortColumn}"]`);
    if (defaultSortHeader) {
        const icon = defaultSortHeader.querySelector('.fas');
        if (icon) {
            icon.classList.remove('fa-sort');
            icon.classList.add(currentComparisonSortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
        }
    }

    // Asegurarse de que los filtros se pueblen y los resultados se oculten al cargar la sección
    populateFilterOptions();
    if (comparisonResultsDiv) comparisonResultsDiv.classList.add('hidden');
    if (averageResultSpan) averageResultSpan.textContent = '-';
    if (advancedComparisonSummaryDiv) advancedComparisonSummaryDiv.classList.add('hidden');
    if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
        comparisonChartInstance = null;
    }
    if (comparisonChartContainer) comparisonChartContainer.classList.add('hidden');
}

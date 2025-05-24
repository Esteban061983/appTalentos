// js/add-record.js

function initAddRecordSection() {
    const studentNameInput = document.getElementById('student-name');
    const autocompleteResultsUl = document.getElementById('autocomplete-results');
    const studentAgeInput = document.getElementById('student-age');
    const studentSexSelect = document.getElementById('student-sex');
    const studentHeightInput = document.getElementById('student-height');
    const studentCourseInput = document.getElementById('student-course');
    const studentSchoolSelect = document.getElementById('student-school');
    const studentDistrictSelect = document.getElementById('student-district');
    const testTypeSelect = document.getElementById('test-type');
    const recordDateInput = document.getElementById('record-date');
    const testResultInput = document.getElementById('test-result');
    const addRecordBtn = document.getElementById('add-record-btn');

    // Limpiar solo los campos de prueba para permitir carga rápida del mismo alumno
    function clearAddRecordFormTestFields() {
        if (testTypeSelect) testTypeSelect.value = '';
        if (recordDateInput) recordDateInput.value = '';
        if (testResultInput) testResultInput.value = '';
    }

    // Event Listener para agregar registro
    if (addRecordBtn) {
        addRecordBtn.addEventListener('click', () => {
            const name = studentNameInput.value.trim();
            const age = parseInt(studentAgeInput.value);
            const sex = studentSexSelect.value;
            const height = parseFloat(studentHeightInput.value);
            const course = studentCourseInput.value.trim();
            const school = studentSchoolSelect.value;
            const district = studentDistrictSelect.value;
            const testType = testTypeSelect.value;
            const date = recordDateInput.value;
            const result = parseFloat(testResultInput.value);

            if (!name || !testType || !date || isNaN(result)) {
                console.error('Por favor, completa los campos obligatorios: Nombre, Tipo de Prueba, Fecha y Resultado.');
                return;
            }

            if (studentAgeInput.value.trim() !== '' && isNaN(age)) {
                console.error('Por favor, ingresa una edad valida.');
                return;
            }
            if (studentHeightInput.value.trim() !== '' && isNaN(height)) {
                console.error('Por favor, ingresa una estatura valida.');
                return;
            }
            if (studentAgeInput.value.trim() !== '' || studentHeightInput.value.trim() !== '' || studentCourseInput.value.trim() !== '' || studentSchoolSelect.value !== '' || studentDistrictSelect.value !== '') {
                if (sex === '') {
                    console.error('Por favor, selecciona el sexo del alumno.');
                    return;
                }
                if (course === '') {
                    console.error('Por favor, ingresa el curso del alumno.');
                    return;
                }
                if (school === '') {
                    console.error('Por favor, selecciona la escuela del alumno.');
                    return;
                }
                if (district === '') {
                    console.error('Por favor, selecciona el distrito del alumno.');
                    return;
                }
            }

            const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            const academicYear = getAcademicYear(date);

            const newRecord = {
                id: id,
                name: name,
                age: isNaN(age) ? null : age,
                sex: sex || null,
                height: isNaN(height) ? null : height,
                course: course || null,
                school: school || null,
                district: district || null,
                testType: testType,
                date: date,
                result: result,
                academicYear: academicYear
            };

            allRecords.push(newRecord);
            saveRecords();
            clearAddRecordFormTestFields();
            populateFilterOptions();
            console.log('Registro agregado correctamente.');
        });
    }

    // Autocompletado datos del alumno al escribir el nombre en Agregar Registro
    if (studentNameInput) {
        studentNameInput.addEventListener('input', () => {
            const enteredName = studentNameInput.value.trim().toLowerCase();
            if (autocompleteResultsUl) autocompleteResultsUl.innerHTML = '';

            if (enteredName.length > 0) {
                const matchingIdentities = {};
                allRecords.filter(record => record.name && record.name.toLowerCase().includes(enteredName)).forEach(record => {
                    const identityKey = `${record.name}|${record.course}|${record.school}|${record.district}`;
                    if (!matchingIdentities[identityKey]) {
                        matchingIdentities[identityKey] = {
                            name: record.name,
                            course: record.course,
                            school: record.school,
                            district: record.district
                        };
                    }
                });

                const sortedMatchingIdentities = Object.values(matchingIdentities).sort((a, b) => a.name.localeCompare(b.name));

                if (sortedMatchingIdentities.length > 0) {
                    sortedMatchingIdentities.forEach(student => {
                        const displayString = `${student.name} (${student.course || '-'}, ${student.school || '-'}, ${student.district || '-'})`;
                        const identityJson = JSON.stringify({
                            name: student.name,
                            course: student.course,
                            school: student.school,
                            district: student.district
                        });
                        const li = document.createElement('li');
                        li.textContent = displayString;
                        li.dataset.studentIdentity = identityJson;
                        if (autocompleteResultsUl) autocompleteResultsUl.appendChild(li);
                    });
                    if (autocompleteResultsUl) autocompleteResultsUl.classList.add('visible');
                } else {
                    if (autocompleteResultsUl) autocompleteResultsUl.classList.remove('visible');
                }
            } else {
                if (autocompleteResultsUl) autocompleteResultsUl.classList.remove('visible');
            }

            const exactMatchIdentity = filteredStudentList.find(student => student.name.toLowerCase() === enteredName && student.course === studentCourseInput.value.trim() && student.school === studentSchoolSelect.value && student.district === studentDistrictSelect.value);

            if (exactMatchIdentity) {
                const studentRecords = allRecords.filter(record =>
                    record.name === exactMatchIdentity.name &&
                    record.course === exactMatchIdentity.course &&
                    record.school === exactMatchIdentity.school &&
                    record.district === exactMatchIdentity.district
                );
                if (studentRecords.length > 0) {
                    studentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
                    const mostRecentRecord = studentRecords[0];
                    if (studentAgeInput) studentAgeInput.value = mostRecentRecord.age || '';
                    if (studentSexSelect) studentSexSelect.value = mostRecentRecord.sex || '';
                    if (studentHeightInput) studentHeightInput.value = mostRecentRecord.height || '';
                    if (studentCourseInput) studentCourseInput.value = mostRecentRecord.course || '';
                    if (studentSchoolSelect) studentSchoolSelect.value = mostRecentRecord.school || '';
                    if (studentDistrictSelect) studentDistrictSelect.value = mostRecentRecord.district || '';
                }
            } else {
                const nameExistsInRecords = allRecords.some(record => record.name && record.name.toLowerCase() === enteredName);
                if (!nameExistsInRecords) {
                    if (studentAgeInput) studentAgeInput.value = '';
                    if (studentSexSelect) studentSexSelect.value = '';
                    if (studentHeightInput) studentHeightInput.value = '';
                    if (studentCourseInput) studentCourseInput.value = '';
                    if (studentSchoolSelect) studentSchoolSelect.value = '';
                    if (studentDistrictSelect) studentDistrictSelect.value = '';
                }
            }
        });
    }

    // Event Listener para seleccionar un nombre de la lista de autocompletado
    if (autocompleteResultsUl) {
        autocompleteResultsUl.addEventListener('click', (event) => {
            if (event.target.tagName === 'LI' && event.target.dataset.studentIdentity) {
                const studentIdentityJson = event.target.dataset.studentIdentity;
                const studentIdentity = JSON.parse(studentIdentityJson);

                if (studentNameInput) studentNameInput.value = studentIdentity.name;

                if (autocompleteResultsUl) {
                    autocompleteResultsUl.innerHTML = '';
                    autocompleteResultsUl.classList.remove('visible');
                }

                const studentRecords = allRecords.filter(record =>
                    record.name === studentIdentity.name &&
                    record.course === studentIdentity.course &&
                    record.school === studentIdentity.school &&
                    record.district === studentIdentity.district
                );
                if (studentRecords.length > 0) {
                    studentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
                    const mostRecentRecord = studentRecords[0];
                    if (studentAgeInput) studentAgeInput.value = mostRecentRecord.age || '';
                    if (studentSexSelect) studentSexSelect.value = mostRecentRecord.sex || '';
                    if (studentHeightInput) studentHeightInput.value = mostRecentRecord.height || '';
                    if (studentCourseInput) studentCourseInput.value = mostRecentRecord.course || '';
                    if (studentSchoolSelect) studentSchoolSelect.value = mostRecentRecord.school || '';
                    if (studentDistrictSelect) studentDistrictSelect.value = mostRecentRecord.district || '';
                }
            }
        });
    }

    clearAddRecordFormTestFields(); // Limpiar campos al inicializar la sección
}

const capacidadeForm = document.getElementById('capacidadeForm');
const capacidadeInput = document.getElementById('capacidadeTotal');
const editarCapacidadeButton = document.getElementById('editarCapacidade');

let editandoCapacidade = false;

editarCapacidadeButton.addEventListener('click', () => {
    if (!editandoCapacidade) {
        editandoCapacidade = true;
        capacidadeInput.readOnly = false;
        editarCapacidadeButton.textContent = 'Salvar';
        capacidadeInput.focus();
        return;
    }

    capacidadeForm.submit();
});

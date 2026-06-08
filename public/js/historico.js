document.addEventListener('DOMContentLoaded', function() {
    const ticketModal = document.getElementById('ticketModal');
    if (!ticketModal) return;

    ticketModal.addEventListener('show.bs.modal', function(event) {
        const button = event.relatedTarget;
        const id = button.getAttribute('data-id');
        const name = button.getAttribute('data-name');
        const category = button.getAttribute('data-category');
        const price = parseFloat(button.getAttribute('data-price'));
        const storage = button.getAttribute('data-storage');
        const date = button.getAttribute('data-date');

        document.getElementById('tktCode').innerText = 'TKT-' + id.toString().padStart(6, '0');
        document.getElementById('tktItemName').innerText = name;
        document.getElementById('tktCategory').innerText = category;
        document.getElementById('tktPrice').innerText = 'R$ ' + price.toFixed(2).replace('.', ',');
        document.getElementById('tktStorage').innerText = storage || 'A definir pelo administrador';
        document.getElementById('tktDate').innerText = date;
    });
});

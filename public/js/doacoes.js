document.addEventListener('DOMContentLoaded', function() {
    const claimModal = document.getElementById('claimModal');
    if (!claimModal) return;

    // Read credits from the data attribute on the modal element itself
    const userCredits = parseFloat(claimModal.getAttribute('data-user-credits') || '0');

    claimModal.addEventListener('show.bs.modal', function(event) {
        const button = event.relatedTarget;
        const itemId = button.getAttribute('data-id');
        const itemName = button.getAttribute('data-name');
        const itemPrice = parseFloat(button.getAttribute('data-price') || '0');
        const itemCategory = button.getAttribute('data-category');

        // Populate modal fields
        document.getElementById('modalItemName').innerText = itemName;
        document.getElementById('modalItemCategory').innerText = itemCategory;
        document.getElementById('modalItemPrice').innerText = 'R$ ' + itemPrice.toFixed(2).replace('.', ',');

        // Configure action form path
        document.getElementById('claimForm').action = '/doacoes/receber/' + itemId;

        const confirmBtn = document.getElementById('confirmClaimBtn');
        const alertBox = document.getElementById('insufficientBalanceAlert');

        // Check balance
        if (userCredits < itemPrice) {
            alertBox.style.display = 'block';
            confirmBtn.disabled = true;
        } else {
            alertBox.style.display = 'none';
            confirmBtn.disabled = false;
        }
    });
});

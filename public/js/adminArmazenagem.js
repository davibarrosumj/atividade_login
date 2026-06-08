document.addEventListener('DOMContentLoaded', function() {
    const tabElId = localStorage.getItem('adminActiveTab');
    if (tabElId) {
        const tabEl = document.getElementById(tabElId);
        if (tabEl) {
            const tab = new bootstrap.Tab(tabEl);
            tab.show();
        }
    }

    const tabButtons = document.querySelectorAll('#admin-pills-tab button[data-bs-toggle="pill"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function(event) {
            localStorage.setItem('adminActiveTab', event.target.id);
        });
    });
});

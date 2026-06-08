document.addEventListener('DOMContentLoaded', function() {
    const imageFile = document.getElementById('imageFile');
    const photoInput = document.getElementById('photo');
    const fileError = document.getElementById('fileError');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');

    if (!imageFile) return;

    imageFile.addEventListener('change', function(event) {
        const file = event.target.files[0];
        fileError.style.display = 'none';
        previewContainer.style.display = 'none';
        photoInput.value = '';
        submitBtn.disabled = false;

        if (!file) return;

        // Check file size (2MB = 2 * 1024 * 1024 bytes)
        const maxBytes = 2 * 1024 * 1024;
        if (file.size > maxBytes) {
            fileError.innerText = 'Erro: A imagem excede o tamanho limite de 2MB. Por favor, escolha um arquivo menor.';
            fileError.style.display = 'block';
            imageFile.value = '';
            submitBtn.disabled = true;
            return;
        }

        // Convert to Base64
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            photoInput.value = base64;
            
            // Show preview
            imagePreview.src = base64;
            previewContainer.style.display = 'block';
        };
        reader.onerror = function() {
            fileError.innerText = 'Erro ao ler a imagem. Tente outro arquivo.';
            fileError.style.display = 'block';
            submitBtn.disabled = true;
        };
        reader.readAsDataURL(file);
    });
});

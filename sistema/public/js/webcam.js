const video = document.getElementById('webcam');
const fotoImg = document.getElementById('fotoCapturada');
const canvas = document.getElementById('canvasFoto');
const inputBase64 = document.getElementById('inputFotoBase64');
let streamOriginal = null;

async function iniciarCamera() {
    try {
        video.classList.remove('hidden');
        fotoImg.classList.add('hidden');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        video.srcObject = stream;
        streamOriginal = stream;
    } catch (err) {
        console.error("Erro ao acessar a webcam: ", err);
        alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
}

function capturarFoto() {
    if (!streamOriginal) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataURL = canvas.toDataURL('image/webp', 0.7);
    inputBase64.value = dataURL;
    
    fotoImg.src = dataURL;
    fotoImg.classList.remove('hidden');
    
    desligarCamera();
}

function desligarCamera() {
    if (streamOriginal) {
        // Para todas as trilhas (vídeo e áudio)
        streamOriginal.getTracks().forEach(track => track.stop());
        streamOriginal = null;
        video.srcObject = null;
        // Esconde o elemento do vídeo completamente
        video.classList.add('hidden');
        console.log("Câmera desligada para economizar recursos.");
    }
}

function reiniciarCamera() {
    inputBase64.value = "";
    iniciarCamera();
}

// ==========================================
// INTELIGÊNCIA DA CÂMERA (O "Espião")
// ==========================================

// Usando 'focusin' e 'click' para garantir que qualquer interação com os campos desligue a câmera
['focusin', 'click'].forEach(evento => {
    document.addEventListener(evento, (event) => {
        const tag = event.target.tagName;
        // Se clicou em um input, select ou textarea
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
            // E se a câmera estiver ligada E a foto ainda não foi tirada
            if (streamOriginal && !inputBase64.value) {
                desligarCamera();
            }
        }
    });
});

// Reset do formulário após o HTMX salvar os dados
document.body.addEventListener('htmx:afterRequest', function(evt) {
    if(evt.detail.successful) {
        document.getElementById('formCadastro').reset();
        fotoImg.src = "";
        fotoImg.classList.add('hidden');
        inputBase64.value = "";
        document.querySelector('input[name="nome"]').focus();
        
        setTimeout(() => {
            document.getElementById('mensagem-retorno').innerHTML = '';
        }, 4000);
    }
});
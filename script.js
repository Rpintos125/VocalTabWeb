/**
 * 1. GESTIÓN DE MODOS Y EDICIÓN
 */
const botonesVista = document.querySelectorAll('.nav-left .btn-pill');
let mostrarMelodiaGlobal = true;
let editando = false;

botonesVista.forEach(boton => {
    if (boton.innerText.toUpperCase() === 'MELODÍA') boton.classList.add('active');
    boton.addEventListener('click', function() {
        const texto = this.innerText.toUpperCase();
        if (texto === 'ARMONÍA' || texto === 'MELODÍA') {
            botonesVista.forEach(b => {
                const bt = b.innerText.toUpperCase();
                if (bt === 'ARMONÍA' || bt === 'MELODÍA') b.classList.remove('active');
            });
            this.classList.add('active');
            mostrarMelodiaGlobal = (texto === 'MELODÍA');
            document.querySelectorAll('.melody-layer').forEach(c => c.style.display = mostrarMelodiaGlobal ? 'block' : 'none');
        }
    });
});

document.querySelector('.btn-edit-mode').addEventListener('click', function() {
    editando = !editando;
    this.classList.toggle('active', editando);
    document.querySelectorAll('[contenteditable]').forEach(c => c.contentEditable = editando);
});

/**
 * 2. CONECTOR DE CONTROLES (STEPPERS)
 */
function conectarControl(nombreControl, accion) {
    const unidades = document.querySelectorAll('.control-unit');
    unidades.forEach(u => {
        if(u.querySelector('.nav-label').innerText === nombreControl) {
            const btnMenos = u.querySelector('.step-btn:first-child');
            const btnMas = u.querySelector('.step-btn:last-child');
            const visor = u.querySelector('.step-value');
            btnMenos.addEventListener('click', () => accion(-1, visor));
            btnMas.addEventListener('click', () => accion(1, visor));
        }
    });
}

/**
 * 3. ZOOM Y SCROLL INTELIGENTE
 */
let nivelZoom = 100;
conectarControl('ZOOM', (cambio, pantalla) => {
    nivelZoom = Math.max(50, Math.min(200, nivelZoom + (cambio * 10)));
    pantalla.innerText = nivelZoom + '%';
    document.getElementById('main-canvas').style.transform = `scale(${nivelZoom / 100})`;
});

let velocidadScroll = 1;
let scrollActivo = false;
let intervaloScroll = null;
const labelScroll = Array.from(document.querySelectorAll('.nav-label')).find(el => el.innerText === 'SCROLL');

function toggleScroll() {
    scrollActivo = !scrollActivo;
    labelScroll.classList.toggle('active', scrollActivo);
    if (scrollActivo) {
        iniciarMovimiento();
    } else {
        clearInterval(intervaloScroll);
    }
}

function iniciarMovimiento() {
    if (intervaloScroll) clearInterval(intervaloScroll);
    intervaloScroll = setInterval(() => { window.scrollBy(0, 1); }, 100 / velocidadScroll);
}

labelScroll.addEventListener('click', toggleScroll);
conectarControl('SCROLL', (cambio, pantalla) => {
    velocidadScroll = Math.max(1, velocidadScroll + cambio);
    pantalla.innerText = velocidadScroll + 'x';
    if (scrollActivo) iniciarMovimiento();
});

/**
 * 4. TRANSPOSICIÓN
 */
const escalaNotas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function transponerTexto(texto, semitonos) {
    return texto.replace(/[A-G][#b]?/g, (nota) => {
        let n = nota;
        const equiv = {'Db':'C#', 'Eb':'D#', 'Gb':'F#', 'Ab':'G#', 'Bb':'A#'};
        n = equiv[n] || n;
        const idx = escalaNotas.indexOf(n.toUpperCase());
        if (idx === -1) return nota;
        let newIdx = (idx + semitonos) % 12;
        if (newIdx < 0) newIdx += 12;
        return escalaNotas[newIdx];
    });
}

let tonoAcumulado = 0;
conectarControl('TRASPONER', (cambio, pantalla) => {
    tonoAcumulado += cambio;
    pantalla.innerText = tonoAcumulado > 0 ? '+' + tonoAcumulado : tonoAcumulado;
    document.querySelectorAll('.chord-layer, .melody-layer').forEach(el => {
        if (el.innerText.trim() !== "") el.innerText = transponerTexto(el.innerText, cambio);
    });
});

/**
 * 5. TECLADO Y ARCHIVOS
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('lyric-layer')) {
        e.preventDefault();
        if (!editando) return;
        const nuevaLinea = document.createElement('div');
        nuevaLinea.className = 'music-line';
        nuevaLinea.innerHTML = `
            <div class="word-group">
                <span class="chord-layer" contenteditable="${editando}" data-placeholder="Acorde"></span>
                <span class="lyric-layer" contenteditable="${editando}" data-placeholder="Letra"></span>
                <span class="melody-layer" contenteditable="${editando}" data-placeholder="Nota" style="display: ${mostrarMelodiaGlobal ? 'block' : 'none'}"></span>
            </div>`;
        document.getElementById('main-canvas').appendChild(nuevaLinea);
        nuevaLinea.querySelector('.lyric-layer').focus();
    }
});

const btnNew = document.querySelector('.btn-pill:nth-child(1)');
const btnOpen = document.querySelector('.btn-pill:nth-child(2)');
const btnSave = document.querySelector('.btn-pill:nth-child(3)');

btnNew.addEventListener('click', () => {
    if (confirm('¿Nueva canción?')) {
        document.querySelector('.song-header h1').innerText = '';
        document.querySelector('.song-header h2').innerText = '';
        document.getElementById('main-canvas').innerHTML = '<div class="music-line"><div class="word-group"><span class="chord-layer" data-placeholder="Acorde"></span><span class="lyric-layer" data-placeholder="Letra"></span><span class="melody-layer" data-placeholder="Nota"></span></div></div>';
        document.querySelectorAll('[contenteditable]').forEach(c => c.contentEditable = editando);
    }
});

btnSave.addEventListener('click', () => {
    const titulo = document.querySelector('.song-header h1').innerText || 'cancion';
    const data = { titulo, artista: document.querySelector('.song-header h2').innerText, html: document.getElementById('main-canvas').innerHTML };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${titulo.toLowerCase().replace(/\s+/g, '_')}.vocal`;
    a.click();
});

btnOpen.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.vocal';
    input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const d = JSON.parse(ev.target.result);
            document.querySelector('.song-header h1').innerText = d.titulo;
            document.querySelector('.song-header h2').innerText = d.artista;
            document.getElementById('main-canvas').innerHTML = d.html;
            document.querySelectorAll('[contenteditable]').forEach(c => c.contentEditable = editando);
            document.querySelectorAll('.melody-layer').forEach(c => c.style.display = mostrarMelodiaGlobal ? 'block' : 'none');
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
});
/**
 * 📖 LECTURA GUIADA - AnimeStore
 * Módulo encapsulado para accesibilidad de lectura
 * 
 * USO:
 *   GuidedReading.init()           - Iniciar lectura guiada
 *   GuidedReading.start()          - Comenzar desde el inicio
 *   GuidedReading.stop()           - Detener lectura
 *   GuidedReading.toggle()         - Activar/Desactivar
 *   GuidedReading.isActive()       - Verificar si está activo
 */

(function() {
    'use strict';
    
    console.log('📖 Módulo de Lectura Guiada cargado');
    
    // ==========================
    // ESTADO PRIVADO
    // ==========================
    let isActive = false;
    let currentElement = null;
    let elements = [];
    let currentIndex = 0;
    let speechEnabled = false;
    let synth = null;
    let utterance = null;
    
    // ==========================
    // CONFIGURACIÓN
    // ==========================
    const CONFIG = {
        highlightColor: '#ff6a00',
        highlightBg: 'rgba(255, 106, 0, 0.2)',
        scrollBehavior: 'smooth',
        speechRate: 0.9,
        speechVolume: 1,
        enabled: true
    };
    
    // ==========================
    // INICIALIZAR SYNTH DE VOZ
    // ==========================
    function initSpeech() {
        if ('speechSynthesis' in window) {
            synth = window.speechSynthesis;
            speechEnabled = true;
            console.log('✅ Síntesis de voz disponible');
        } else {
            speechEnabled = false;
            console.log('⚠️ Síntesis de voz no disponible en este navegador');
        }
    }
    
    // ==========================
    // OBTENER ELEMENTOS LEGIBLES
    // ==========================
    function getReadableElements() {
        const selectors = [
            '.card h3',           // Títulos de productos
            '.card .price',       // Precios
            '.section h2',        // Títulos de sección
            '.nav-links span',    // Links de navegación
            '.cart-item',         // Items del carrito
            'footer',             // Footer
            '.hero-content'       // Contenido del hero
        ];
        
        return Array.from(document.querySelectorAll(selectors.join(', ')))
            .filter(el => {
                const style = getComputedStyle(el);
                const text = el.textContent.trim();
                return el.offsetParent !== null && 
                       style.visibility !== 'hidden' &&
                       style.display !== 'none' &&
                       text.length > 0 &&
                       text.length < 200; // Evitar textos muy largos
            });
    }
    
    // ==========================
    // RESALTAR ELEMENTO ACTUAL
    // ==========================
    function highlightElement(element) {
        // Remover resaltado anterior
        elements.forEach(el => {
            el.style.transition = 'all 0.3s ease';
            el.style.backgroundColor = '';
            el.style.color = '';
            el.style.boxShadow = '';
            el.style.borderRadius = '';
            el.style.padding = '';
        });
        
        if (!element) return;
        
        // Aplicar resaltado al elemento actual
        element.style.transition = 'all 0.3s ease';
        element.style.backgroundColor = CONFIG.highlightBg;
        element.style.boxShadow = `0 0 20px ${CONFIG.highlightColor}`;
        element.style.borderRadius = '8px';
        element.style.padding = '10px';
        
        // Scroll suave hacia el elemento
        element.scrollIntoView({
            behavior: CONFIG.scrollBehavior,
            block: 'center',
            inline: 'nearest'
        });
    }
    
    // ==========================
    // HABLAR TEXTO (TTS)
    // ==========================
    function speakText(text, element) {
        if (!speechEnabled || !synth) return;
        
        // Cancelar habla anterior
        synth.cancel();
        
        utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = CONFIG.speechRate;
        utterance.volume = CONFIG.speechVolume;
        utterance.lang = 'es-MX'; // Español México
        
        // Buscar voz en español
        const voices = synth.getVoices();
        const spanishVoice = voices.find(voice => 
            voice.lang.includes('es') || voice.lang.includes('MX')
        );
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        
        utterance.onend = function() {
            // Continuar al siguiente elemento automáticamente
            if (isActive) {
                setTimeout(() => nextElement(), 500);
            }
        };
        
        synth.speak(utterance);
    }
    
    // ==========================
    // NAVEGACIÓN
    // ==========================
    function nextElement() {
        if (!isActive || currentIndex >= elements.length - 1) {
            stop();
            return;
        }
        
        currentIndex++;
        currentElement = elements[currentIndex];
        highlightElement(currentElement);
        
        if (speechEnabled && currentElement) {
            speakText(currentElement.textContent.trim(), currentElement);
        }
    }
    
    function prevElement() {
        if (!isActive || currentIndex <= 0) {
            return;
        }
        
        currentIndex--;
        currentElement = elements[currentIndex];
        highlightElement(currentElement);
        
        if (speechEnabled && currentElement) {
            speakText(currentElement.textContent.trim(), currentElement);
        }
    }
    
    function goToElement(index) {
        if (!isActive || index < 0 || index >= elements.length) {
            return;
        }
        
        currentIndex = index;
        currentElement = elements[currentIndex];
        highlightElement(currentElement);
        
        if (speechEnabled && currentElement) {
            speakText(currentElement.textContent.trim(), currentElement);
        }
    }
    
    // ==========================
    // CONTROLES PÚBLICOS
    // ==========================
    function start() {
        if (!CONFIG.enabled) {
            console.log('⚠️ Lectura guiada está deshabilitada');
            return;
        }
        
        elements = getReadableElements();
        
        if (elements.length === 0) {
            console.log('⚠️ No hay elementos legibles en la página');
            if (typeof showNotification === 'function') {
                showNotification('⚠️ No hay contenido para leer');
            }
            return;
        }
        
        isActive = true;
        currentIndex = 0;
        currentElement = elements[0];
        
        document.body.classList.add('guided-reading-active');
        
        highlightElement(currentElement);
        
        if (speechEnabled) {
            speakText(currentElement.textContent.trim(), currentElement);
        }
        
        if (typeof showNotification === 'function') {
            showNotification(`📖 Lectura guiada iniciada (${elements.length} elementos)`);
        }
        
        console.log('✅ Lectura guiada iniciada');
    }
    
    function stop() {
        isActive = false;
        currentIndex = 0;
        currentElement = null;
        
        // Remover resaltados
        elements.forEach(el => {
            el.style.backgroundColor = '';
            el.style.color = '';
            el.style.boxShadow = '';
            el.style.borderRadius = '';
            el.style.padding = '';
        });
        
        document.body.classList.remove('guided-reading-active');
        
        // Detener habla
        if (synth) {
            synth.cancel();
        }
        
        if (typeof showNotification === 'function') {
            showNotification('📖 Lectura guiada detenida');
        }
        
        console.log('⏹️ Lectura guiada detenida');
    }
    
    function toggle() {
        if (isActive) {
            stop();
        } else {
            start();
        }
    }
    
    function isActive() {
        return isActive;
    }
    
    function setSpeech(enabled) {
        speechEnabled = enabled;
        console.log(` Voz ${enabled ? 'activada' : 'desactivada'}`);
    }
    
    function setSpeed(rate) {
        CONFIG.speechRate = Math.max(0.5, Math.min(1.5, rate));
        console.log(`🐌 Velocidad de voz: ${CONFIG.speechRate}`);
    }
    
    // ==========================
    // ATAJOS DE TECLADO
    // ==========================
    function handleKeydown(e) {
        if (!isActive) return;
        
        // Ignorar si está en input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                nextElement();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                prevElement();
                break;
            case 'Escape':
                e.preventDefault();
                stop();
                break;
            case ' ':
                e.preventDefault();
                if (synth && synth.speaking) {
                    synth.pause();
                } else if (synth && synth.paused) {
                    synth.resume();
                }
                break;
        }
    }
    
    // ==========================
    // INICIALIZACIÓN
    // ==========================
    function init() {
        console.log('📖 Inicializando Lectura Guiada...');
        
        initSpeech();
        
        // Cargar voces (puede tardar un poco)
        if (synth) {
            synth.onvoiceschanged = function() {
                console.log('🎤 Voces de síntesis cargadas:', synth.getVoices().length);
            };
        }
        
        // Event listener para teclado
        document.addEventListener('keydown', handleKeydown);
        
        console.log('✅ Lectura Guiada lista. Usa GuidedReading.start()');
    }
    
    // ==========================
    // EXPORTAR API PÚBLICA
    // ==========================
    window.GuidedReading = {
        init: init,
        start: start,
        stop: stop,
        toggle: toggle,
        isActive: () => isActive,
        next: nextElement,
        prev: prevElement,
        goTo: goToElement,
        setSpeech: setSpeech,
        setSpeed: setSpeed,
        config: CONFIG
    };
    
    // Iniciar automáticamente cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
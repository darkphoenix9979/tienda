/**
 * ⌨️ NAVEGACIÓN POR TECLADO - AnimeStore
 * Archivo independiente para navegación accesible
 * Uso: <script src="keyboard-nav.js"></script>
 */

(function() {
    'use strict';
    
    console.log('⌨️ Módulo de navegación por teclado cargado');
    
    // ==========================
    // CONFIGURACIÓN
    // ==========================
    const CONFIG = {
        focusColor: '#ff6a00',
        focusWidth: '3px',
        focusOffset: '2px',
        scrollBehavior: 'smooth',
        enabled: true
    };
    
    // ==========================
    // ESTADO
    // ==========================
    let keyboardNavigationActive = false;
    
    // ==========================
    // UTILIDADES
    // ==========================
    
    // Obtener elementos enfocables visibles
    function getFocusableElements() {
        const selectors = [
            'button:not([disabled])',
            'a[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '.card',
            '.nav-links span',
            '.cart-icon',
            '.dropdown-item',
            '.floating-btn'
        ];
        
        return Array.from(document.querySelectorAll(selectors.join(', ')))
            .filter(el => {
                const style = getComputedStyle(el);
                return el.offsetParent !== null && 
                       style.visibility !== 'hidden' &&
                       style.display !== 'none';
            });
    }
    
    // Calcular centro del elemento
    function getElementCenter(el) {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            element: el,
            rect: rect
        };
    }
    
    // Encontrar elemento en dirección específica
    function findElementInDirection(current, direction) {
        const elements = getFocusableElements().map(getElementCenter);
        const currentPos = getElementCenter(current);
        
        let closest = null;
        let minDistance = Infinity;
        
        elements.forEach(pos => {
            if (pos.element === current) return;
            
            const dx = pos.x - currentPos.x;
            const dy = pos.y - currentPos.y;
            
            let isValid = false;
            let distance = Infinity;
            
            switch(direction) {
                case 'up':
                    if (dy < -10) {
                        isValid = true;
                        distance = Math.abs(dy) + Math.abs(dx) * 0.5;
                    }
                    break;
                case 'down':
                    if (dy > 10) {
                        isValid = true;
                        distance = Math.abs(dy) + Math.abs(dx) * 0.5;
                    }
                    break;
                case 'left':
                    if (dx < -10) {
                        isValid = true;
                        distance = Math.abs(dx) + Math.abs(dy) * 0.5;
                    }
                    break;
                case 'right':
                    if (dx > 10) {
                        isValid = true;
                        distance = Math.abs(dx) + Math.abs(dy) * 0.5;
                    }
                    break;
            }
            
            if (isValid && distance < minDistance) {
                minDistance = distance;
                closest = pos.element;
            }
        });
        
        return closest;
    }
    
    // ==========================
    // MANEJO DE FOCO
    // ==========================
    
    function addFocusStyles() {
        const focusable = getFocusableElements();
        focusable.forEach(el => {
            el.addEventListener('focus', handleFocus);
            el.addEventListener('blur', handleBlur);
        });
    }
    
    function handleFocus(e) {
        if (keyboardNavigationActive) {
            e.target.classList.add('keyboard-focus');
        }
    }
    
    function handleBlur(e) {
        e.target.classList.remove('keyboard-focus');
    }
    
    // ==========================
    // EVENTOS DE TECLADO
    // ==========================
    
    function handleKeydown(e) {
        if (!CONFIG.enabled) return;
        
        // Ignorar si está escribiendo en inputs (excepto Escape)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return; // ✅ IMPORTANTE: No prevenir default aquí
        }
        
        const current = document.activeElement;
        let target = null;
        let preventDefault = false;
        
        // Navegación direccional con flechas
        switch(e.key) {
            case 'ArrowUp':
                target = findElementInDirection(current, 'up');
                preventDefault = true;
                break;
            case 'ArrowDown':
                target = findElementInDirection(current, 'down');
                preventDefault = true;
                break;
            case 'ArrowLeft':
                target = findElementInDirection(current, 'left');
                preventDefault = true;
                break;
            case 'ArrowRight':
                target = findElementInDirection(current, 'right');
                preventDefault = true;
                break;
            case 'Enter':
            case ' ':
                if (current && current !== document.body && keyboardNavigationActive) {
                    preventDefault = true;
                    current.click();
                }
                break;
            case 'Escape':
                preventDefault = true;
                handleEscape();
                break;
            case 't':
            case 'T':
                preventDefault = true;
                const toggle = document.getElementById('theme-toggle');
                if (toggle) toggle.click();
                break;
        }
        
        if (target) {
            target.focus();
            target.scrollIntoView({ 
                behavior: CONFIG.scrollBehavior, 
                block: 'nearest', 
                inline: 'nearest' 
            });
        }
        
        if (preventDefault) {
            e.preventDefault();
        }
    }
    
    // Manejar Escape para cerrar modales
    function handleEscape() {
        // Cerrar carrito
        const cartModal = document.getElementById('cartModal');
        if (cartModal && cartModal.style.display === 'flex') {
            cartModal.style.display = 'none';
            if (typeof showNotification === 'function') {
                showNotification('🛒 Carrito cerrado');
            }
        }
        
        // Cerrar ticket
        const ticketModal = document.getElementById('ticketModal');
        if (ticketModal) {
            ticketModal.remove();
            if (typeof showNotification === 'function') {
                showNotification('🎫 Ticket cerrado');
            }
        }
        
        // Cerrar dropdown
        const dropdown = document.getElementById('dropdown');
        if (dropdown && dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
            const arrow = document.getElementById('arrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
        
        // Quitar foco
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
        
        keyboardNavigationActive = false;
    }
    
    // ==========================
    // DETECTAR USO DE TECLADO
    // ==========================
    
    function handleKeydownGlobal(e) {
        // Activar navegación por teclado cuando se usa una tecla
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
            keyboardNavigationActive = true;
            document.body.classList.add('keyboard-navigation');
        }
    }
    
    function handleMousedown() {
        // Desactivar estilos de teclado cuando se usa el ratón
        keyboardNavigationActive = false;
        document.body.classList.remove('keyboard-navigation');
    }
    
    // ==========================
    // INICIALIZACIÓN
    // ==========================
    
    function init() {
        console.log('✅ Navegación por teclado inicializada');
        
        // Agregar estilos de foco
        addFocusStyles();
        
        // Event listeners
        document.addEventListener('keydown', handleKeydownGlobal);
        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('mousedown', handleMousedown);
        
        // Actualizar cuando el DOM cambia
        const observer = new MutationObserver(() => {
            addFocusStyles();
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        console.log('✅ Navegación lista. Usa flechas + Enter');
    }
    
    // ==========================
    // EXPORTAR FUNCIONES (OPCIONAL)
    // ==========================
    
    window.KeyboardNav = {
        enable: () => { CONFIG.enabled = true; },
        disable: () => { CONFIG.enabled = false; },
        toggle: () => { CONFIG.enabled = !CONFIG.enabled; },
        isActive: () => keyboardNavigationActive
    };
    
    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
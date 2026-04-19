/**
 * ⌨️ NAVEGACIÓN POR TECLADO - VERSIÓN SIMPLE
 */

console.log('⌨️ Cargando navegación por teclado...');

// Esperar a que todo cargue
window.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado, inicializando...');
    
    let keyboardActive = false;
    
    // Agregar tabindex a elementos importantes
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.setAttribute('tabindex', '0');
    });
    
    const navLinks = document.querySelectorAll('.nav-links span');
    navLinks.forEach(link => {
        link.setAttribute('tabindex', '0');
    });
    
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.setAttribute('tabindex', '0');
    }
    
    // Detectar cuando se usa el teclado
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
            keyboardActive = true;
            document.body.classList.add('keyboard-nav');
        }
    });
    
    // Detectar cuando se usa el ratón
    document.addEventListener('mousedown', function() {
        keyboardActive = false;
        document.body.classList.remove('keyboard-nav');
    });
    
    // Navegación con flechas
    document.addEventListener('keydown', function(e) {
        // Ignorar si está en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const focusable = Array.from(document.querySelectorAll(
            'button, [tabindex="0"], a[href]'
        )).filter(el => {
            return el.offsetParent !== null && 
                   getComputedStyle(el).visibility !== 'hidden';
        });
        
        const currentIndex = focusable.indexOf(document.activeElement);
        
        // Flechas
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % focusable.length;
            focusable[nextIndex].focus();
        }
        
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + focusable.length) % focusable.length;
            focusable[prevIndex].focus();
        }
        
        // Enter o Space
        if (e.key === 'Enter' || e.key === ' ') {
            if (document.activeElement && document.activeElement !== document.body) {
                e.preventDefault();
                document.activeElement.click();
                
                // Mantener foco
                setTimeout(() => {
                    if (document.activeElement && document.contains(document.activeElement)) {
                        document.activeElement.focus();
                    }
                }, 100);
            }
        }
        
        // Escape
        if (e.key === 'Escape') {
            const cartModal = document.getElementById('cartModal');
            if (cartModal) {
                cartModal.style.display = 'none';
            }
            const ticketModal = document.getElementById('ticketModal');
            if (ticketModal) {
                ticketModal.remove();
            }
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }
    });
    
    console.log('✅ Navegación por teclado lista');
    console.log('📋 Elementos enfocables:', document.querySelectorAll('[tabindex="0"]').length);
});
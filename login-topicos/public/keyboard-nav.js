/**
 * ⌨️ NAVEGACIÓN POR TECLADO - AnimeStore
 * Versión corregida: Sin necesidad de Tab, foco persistente
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
    let lastFocusedElement = null;
    
    // ==========================
    // UTILIDADES
    // ==========================
    
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
    
    function getElementCenter(el) {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            element: el,
            rect: rect
        };
    }
    
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
            el.removeEventListener('focus', handleFocus);
            el.removeEventListener('blur', handleBlur);
            el.addEventListener('focus', handleFocus);
            el.addEventListener('blur', handleBlur);
        });
    }
    
    function handleFocus(e) {
        if (keyboardNavigationActive) {
            e.target.classList.add('keyboard-focus');
            lastFocusedElement = e.target;
        }
    }
    
    function handleBlur(e) {
        e.target.classList.remove('keyboard-focus');
    }
    
    // ==========================
    // EVENTOS DE TECLADO
    // ==========================
    
    function handleKeydownGlobal(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
            keyboardNavigationActive = true;
            document.body.classList.add('keyboard-navigation');
        }
    }
    
    function handleMousedown() {
        keyboardNavigationActive = false;
        document.body.classList.remove('keyboard-navigation');
    }
    
    function handleKeydown(e) {
        if (!CONFIG.enabled) return;
        
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }
        
        const current = document.activeElement;
        let target = null;
        let preventDefault = false;
        
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
                    
                    // ✅ Mantener foco después de la acción
                    setTimeout(() => {
                        if (current && document.contains(current)) {
                            current.focus();
                        } else if (lastFocusedElement && document.contains(lastFocusedElement)) {
                            lastFocusedElement.focus();
                        }
                    }, 100);
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
            keyboardNavigationActive = true;
        }
        
        if (preventDefault) {
            e.preventDefault();
        }
    }
    
    function handleEscape() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal && cartModal.style.display === 'flex') {
            cartModal.style.display = 'none';
            if (typeof showNotification === 'function') {
                showNotification('🛒 Carrito cerrado');
            }
        }
        
        const ticketModal = document.getElementById('ticketModal');
        if (ticketModal) {
            ticketModal.remove();
            if (typeof showNotification === 'function') {
                showNotification('🎫 Ticket cerrado');
            }
        }
        
        const dropdown = document.getElementById('dropdown');
        if (dropdown && dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
            const arrow = document.getElementById('arrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
        
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
        
        keyboardNavigationActive = false;
        document.body.classList.remove('keyboard-navigation');
    }
    
    // ==========================
    // INICIALIZACIÓN
    // ==========================
    
    function init() {
        console.log('✅ Navegación por teclado inicializada');
        
        addFocusStyles();
        
        document.addEventListener('keydown', handleKeydownGlobal);
        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('mousedown', handleMousedown);
        
        const observer = new MutationObserver(() => {
            addFocusStyles();
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        console.log('✅ Navegación lista. Usa flechas + Enter');
    }
    
    window.KeyboardNav = {
        enable: () => { CONFIG.enabled = true; },
        disable: () => { CONFIG.enabled = false; },
        toggle: () => { CONFIG.enabled = !CONFIG.enabled; },
        isActive: () => keyboardNavigationActive
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
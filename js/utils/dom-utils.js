// DOM Utility Functions
const DOMUtils = {
    // Create element with attributes and children
    create(elementType, attributes = {}, children = []) {
        const element = document.createElement(elementType);
        
        // Set attributes
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        }
        
        // Append children
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    },
    
    // Get element by ID
    get(id) {
        return document.getElementById(id);
    },
    
    // Find element by selector
    find(selector, parent = document) {
        return parent.querySelector(selector);
    },
    
    // Find all elements by selector
    findAll(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    },
    
    // Add event listener to element(s)
    on(target, event, handler, options = {}) {
        if (typeof target === 'string') {
            target = this.findAll(target);
        }
        
        if (Array.isArray(target)) {
            target.forEach(el => el.addEventListener(event, handler, options));
        } else {
            target.addEventListener(event, handler, options);
        }
    },
    
    // Remove event listener from element(s)
    off(target, event, handler, options = {}) {
        if (typeof target === 'string') {
            target = this.findAll(target);
        }
        
        if (Array.isArray(target)) {
            target.forEach(el => el.removeEventListener(event, handler, options));
        } else {
            target.removeEventListener(event, handler, options);
        }
    },
    
    // Toggle class on element(s)
    toggleClass(element, className, force) {
        if (Array.isArray(element)) {
            element.forEach(el => el.classList.toggle(className, force));
        } else {
            element.classList.toggle(className, force);
        }
    },
    
    // Add class to element(s)
    addClass(element, className) {
        if (Array.isArray(element)) {
            element.forEach(el => el.classList.add(className));
        } else {
            element.classList.add(className);
        }
    },
    
    // Remove class from element(s)
    removeClass(element, className) {
        if (Array.isArray(element)) {
            element.forEach(el => el.classList.remove(className));
        } else {
            element.classList.remove(className);
        }
    },
    
    // Show element(s)
    show(element) {
        this.removeClass(element, CONSTANTS.CLASS_NAMES.HIDDEN);
    },
    
    // Hide element(s)
    hide(element) {
        this.addClass(element, CONSTANTS.CLASS_NAMES.HIDDEN);
    },
    
    // Set multiple styles
    setStyles(element, styles) {
        Object.assign(element.style, styles);
    },
    
    // Get computed style
    getStyle(element, property) {
        return window.getComputedStyle(element).getPropertyValue(property);
    },
    
    // Check if element is visible
    isVisible(element) {
        return !element.classList.contains(CONSTANTS.CLASS_NAMES.HIDDEN) &&
               element.offsetParent !== null &&
               this.getStyle(element, 'visibility') !== 'hidden' &&
               this.getStyle(element, 'opacity') !== '0';
    },
    
    // Debounce function
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Inject HTML into element
    injectHTML(element, html) {
        element.innerHTML = html;
    },
    
    // Append HTML to element
    appendHTML(element, html) {
        element.insertAdjacentHTML('beforeend', html);
    },
    
    // Remove all children from element
    empty(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    
    // Get parent by selector
    closest(element, selector) {
        return element.closest(selector);
    },
    
    // Check if element matches selector
    matches(element, selector) {
        return element.matches(selector);
    },
    
    // Get siblings of element
    siblings(element) {
        return Array.from(element.parentNode.children).filter(child => child !== element);
    },
    
    // Fade in element
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity.toString();
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // Fade out element
    fadeOut(element, duration = 300) {
        let start = null;
        const initialOpacity = parseFloat(this.getStyle(element, 'opacity'));
        
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.max(initialOpacity - (progress / duration), 0);
            
            element.style.opacity = opacity.toString();
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                element.style.opacity = '1';
            }
        };
        
        requestAnimationFrame(animate);
    }
};

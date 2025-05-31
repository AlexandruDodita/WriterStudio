/**
 * Unit tests for UIManager class
 */

import { UIManager } from '../src/renderer/components/Common/UIManager.js';

describe('UIManager', () => {
    let uiManager;

    beforeEach(() => {
        uiManager = new UIManager();
    });

    afterEach(() => {
        uiManager.cleanup();
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with empty components and event listeners', () => {
            expect(uiManager.components).toBeInstanceOf(Map);
            expect(uiManager.eventListeners).toBeInstanceOf(Map);
            expect(uiManager.components.size).toBe(0);
            expect(uiManager.eventListeners.size).toBe(0);
        });
    });

    describe('Component Management', () => {
        test('should register and get components', () => {
            const mockComponent = { name: 'TestComponent' };
            
            uiManager.registerComponent('test', mockComponent);
            
            expect(uiManager.getComponent('test')).toBe(mockComponent);
            expect(uiManager.components.size).toBe(1);
        });

        test('should return null for non-existent component', () => {
            expect(uiManager.getComponent('nonexistent')).toBeNull();
        });

        test('should overwrite existing component', () => {
            const component1 = { name: 'Component1' };
            const component2 = { name: 'Component2' };
            
            uiManager.registerComponent('test', component1);
            uiManager.registerComponent('test', component2);
            
            expect(uiManager.getComponent('test')).toBe(component2);
            expect(uiManager.components.size).toBe(1);
        });
    });

    describe('Event Listener Management', () => {
        test('should add event listener and track it', () => {
            const element = document.createElement('button');
            const handler = jest.fn();
            
            uiManager.addEventListener(element, 'click', handler);
            
            // Trigger event to verify listener was added
            element.click();
            expect(handler).toHaveBeenCalledTimes(1);
            
            // Check tracking
            expect(uiManager.eventListeners.size).toBeGreaterThan(0);
        });

        test('should handle null element gracefully', () => {
            const handler = jest.fn();
            
            expect(() => {
                uiManager.addEventListener(null, 'click', handler);
            }).not.toThrow();
        });

        test('should cleanup all event listeners', () => {
            const element1 = document.createElement('button');
            const element2 = document.createElement('div');
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            
            uiManager.addEventListener(element1, 'click', handler1);
            uiManager.addEventListener(element2, 'mouseover', handler2);
            
            uiManager.cleanup();
            
            // Trigger events - handlers should not be called
            element1.click();
            element2.dispatchEvent(new Event('mouseover'));
            
            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
            expect(uiManager.eventListeners.size).toBe(0);
            expect(uiManager.components.size).toBe(0);
        });
    });

    describe('Element Creation', () => {
        test('should create basic element', () => {
            const element = uiManager.createElement('div');
            
            expect(element.tagName).toBe('DIV');
            expect(element.className).toBe('');
        });

        test('should create element with all options', () => {
            const options = {
                className: 'test-class',
                id: 'test-id',
                textContent: 'Test content',
                attributes: { 'data-test': 'value' },
                dataset: { custom: 'data' },
                styles: { color: 'red' }
            };
            
            const element = uiManager.createElement('div', options);
            
            expect(element.className).toBe('test-class');
            expect(element.id).toBe('test-id');
            expect(element.textContent).toBe('Test content');
            expect(element.getAttribute('data-test')).toBe('value');
            expect(element.dataset.custom).toBe('data');
            expect(element.style.color).toBe('red');
        });

        test('should handle innerHTML option', () => {
            const element = uiManager.createElement('div', {
                innerHTML: '<span>Inner content</span>'
            });
            
            expect(element.innerHTML).toBe('<span>Inner content</span>');
            expect(element.querySelector('span')).toBeTruthy();
        });
    });

    describe('Element Finding', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="test-container">
                    <p class="test-paragraph">Test content</p>
                    <button class="test-button">Click me</button>
                </div>
            `;
        });

        test('should find element by selector', () => {
            const element = uiManager.findElement('#test-container');
            
            expect(element).toBeTruthy();
            expect(element.id).toBe('test-container');
        });

        test('should return null for invalid selector', () => {
            const element = uiManager.findElement('#nonexistent');
            
            expect(element).toBeNull();
        });

        test('should handle invalid CSS selector gracefully', () => {
            const element = uiManager.findElement(':::invalid');
            
            expect(element).toBeNull();
        });

        test('should find multiple elements', () => {
            const elements = uiManager.findElements('.test-paragraph, .test-button');
            
            expect(elements.length).toBe(2);
        });

        test('should return empty NodeList for invalid selector', () => {
            const elements = uiManager.findElements(':::invalid');
            
            expect(elements.length).toBe(0);
        });

        test('should search within parent element', () => {
            const container = document.getElementById('test-container');
            const paragraph = uiManager.findElement('p', container);
            
            expect(paragraph).toBeTruthy();
            expect(paragraph.className).toBe('test-paragraph');
        });
    });

    describe('Animations', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('should animate element with CSS class', async () => {
            const element = document.createElement('div');
            
            const animationPromise = uiManager.animate(element, 'test-animation');
            
            expect(element.classList.contains('test-animation')).toBe(true);
            
            // Simulate animation end
            element.dispatchEvent(new Event('animationend'));
            
            await animationPromise;
            
            expect(element.classList.contains('test-animation')).toBe(false);
        });

        test('should handle null element in animation', async () => {
            const result = await uiManager.animate(null, 'test-animation');
            
            expect(result).toBeUndefined();
        });

        test('should fallback to timeout if animation doesnt end', async () => {
            const element = document.createElement('div');
            
            const animationPromise = uiManager.animate(element, 'test-animation', 100);
            
            // Fast-forward timeout
            jest.advanceTimersByTime(201);
            
            await animationPromise;
            
            expect(element.classList.contains('test-animation')).toBe(false);
        });
    });

    describe('Show/Hide/Toggle', () => {
        test('should show element', async () => {
            const element = document.createElement('div');
            element.style.display = 'none';
            
            await uiManager.show(element);
            
            expect(element.style.display).toBe('');
        });

        test('should hide element', async () => {
            const element = document.createElement('div');
            
            await uiManager.hide(element);
            
            expect(element.style.display).toBe('none');
        });

        test('should toggle element visibility', async () => {
            const element = document.createElement('div');
            
            // Initially visible, should hide
            await uiManager.toggle(element);
            expect(element.style.display).toBe('none');
            
            // Now hidden, should show
            await uiManager.toggle(element);
            expect(element.style.display).toBe('');
        });

        test('should force show with toggle parameter', async () => {
            const element = document.createElement('div');
            element.style.display = 'none';
            
            await uiManager.toggle(element, true);
            
            expect(element.style.display).toBe('');
        });

        test('should handle null elements gracefully', async () => {
            await expect(uiManager.show(null)).resolves.toBeUndefined();
            await expect(uiManager.hide(null)).resolves.toBeUndefined();
            await expect(uiManager.toggle(null)).resolves.toBeUndefined();
        });
    });

    describe('Loading State', () => {
        test('should set loading state on button', () => {
            const button = document.createElement('button');
            button.textContent = 'Click me';
            
            uiManager.setLoading(button, true, 'Loading...');
            
            expect(button.classList.contains('loading')).toBe(true);
            expect(button.disabled).toBe(true);
            expect(button.dataset.originalText).toBe('Click me');
            expect(button.innerHTML).toContain('Loading...');
            expect(button.innerHTML).toContain('spinner');
        });

        test('should remove loading state', () => {
            const button = document.createElement('button');
            button.textContent = 'Click me';
            button.dataset.originalText = 'Click me';
            button.classList.add('loading');
            button.disabled = true;
            
            uiManager.setLoading(button, false);
            
            expect(button.classList.contains('loading')).toBe(false);
            expect(button.disabled).toBe(false);
            expect(button.textContent).toBe('Click me');
            expect(button.dataset.originalText).toBeUndefined();
        });

        test('should handle non-button elements', () => {
            const div = document.createElement('div');
            
            uiManager.setLoading(div, true);
            
            expect(div.classList.contains('loading')).toBe(true);
            expect(div.disabled).toBe(true);
        });

        test('should handle null element', () => {
            expect(() => {
                uiManager.setLoading(null, true);
            }).not.toThrow();
        });
    });

    describe('Utility Functions', () => {
        test('should debounce function calls', () => {
            jest.useFakeTimers();
            
            const mockFn = jest.fn();
            const debouncedFn = uiManager.debounce(mockFn, 100);
            
            debouncedFn();
            debouncedFn();
            debouncedFn();
            
            expect(mockFn).not.toHaveBeenCalled();
            
            jest.advanceTimersByTime(100);
            
            expect(mockFn).toHaveBeenCalledTimes(1);
            
            jest.useRealTimers();
        });

        test('should throttle function calls', () => {
            jest.useFakeTimers();
            
            const mockFn = jest.fn();
            const throttledFn = uiManager.throttle(mockFn, 100);
            
            throttledFn();
            throttledFn();
            throttledFn();
            
            expect(mockFn).toHaveBeenCalledTimes(1);
            
            jest.advanceTimersByTime(100);
            
            throttledFn();
            expect(mockFn).toHaveBeenCalledTimes(2);
            
            jest.useRealTimers();
        });

        test('should wait for element to appear', async () => {
            const elementId = 'dynamic-element';
            
            // Start waiting
            const waitPromise = uiManager.waitForElement(`#${elementId}`, 1000);
            
            // Add element after a delay
            setTimeout(() => {
                const element = document.createElement('div');
                element.id = elementId;
                document.body.appendChild(element);
            }, 50);
            
            const element = await waitPromise;
            
            expect(element).toBeTruthy();
            expect(element.id).toBe(elementId);
        });

        test('should timeout when waiting for element', async () => {
            await expect(uiManager.waitForElement('#nonexistent', 100))
                .rejects.toThrow('Element "#nonexistent" not found within 100ms');
        });

        test('should return existing element immediately', async () => {
            const element = document.createElement('div');
            element.id = 'existing';
            document.body.appendChild(element);
            
            const foundElement = await uiManager.waitForElement('#existing');
            
            expect(foundElement).toBe(element);
        });
    });

    describe('Clipboard Operations', () => {
        test('should copy text to clipboard using modern API', async () => {
            const mockWriteText = jest.fn().mockResolvedValue();
            Object.assign(navigator, {
                clipboard: { writeText: mockWriteText }
            });
            Object.defineProperty(window, 'isSecureContext', {
                value: true,
                writable: true
            });
            
            const result = await uiManager.copyToClipboard('test text');
            
            expect(result).toBe(true);
            expect(mockWriteText).toHaveBeenCalledWith('test text');
        });

        test('should fallback to legacy clipboard API', async () => {
            // Mock legacy API
            document.execCommand = jest.fn().mockReturnValue(true);
            Object.defineProperty(window, 'isSecureContext', {
                value: false,
                writable: true
            });
            
            const result = await uiManager.copyToClipboard('test text');
            
            expect(result).toBe(true);
            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });

        test('should handle clipboard errors', async () => {
            const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard error'));
            Object.assign(navigator, {
                clipboard: { writeText: mockWriteText }
            });
            Object.defineProperty(window, 'isSecureContext', {
                value: true,
                writable: true
            });
            
            const result = await uiManager.copyToClipboard('test text');
            
            expect(result).toBe(false);
        });
    });

    describe('Formatting Utilities', () => {
        test('should format file sizes correctly', () => {
            expect(uiManager.formatFileSize(0)).toBe('0 Bytes');
            expect(uiManager.formatFileSize(1024)).toBe('1 KB');
            expect(uiManager.formatFileSize(1048576)).toBe('1 MB');
            expect(uiManager.formatFileSize(1073741824)).toBe('1 GB');
            expect(uiManager.formatFileSize(1536)).toBe('1.5 KB');
        });

        test('should format dates correctly', () => {
            const date = new Date('2023-12-25');
            const formatted = uiManager.formatDate(date);
            
            expect(formatted).toContain('Dec');
            expect(formatted).toContain('25');
            expect(formatted).toContain('2023');
        });

        test('should handle invalid dates', () => {
            const result = uiManager.formatDate('invalid date');
            
            expect(result).toBe('Invalid Date');
        });

        test('should format date with custom options', () => {
            const date = new Date('2023-12-25');
            const formatted = uiManager.formatDate(date, { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            expect(formatted).toContain('Monday');
            expect(formatted).toContain('December');
        });

        test('should escape HTML correctly', () => {
            const html = '<script>alert("xss")</script>';
            const escaped = uiManager.escapeHtml(html);
            
            expect(escaped).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
        });
    });
}); 
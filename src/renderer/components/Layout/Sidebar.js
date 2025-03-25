/**
 * Sidebar Navigation Module
 * Handles sidebar navigation setup and events
 */

import { loadProjectSection } from '../../projectManager.js';

/**
 * Sets up the sidebar navigation with event listeners
 * @param {HTMLElement} sidebarNav - The sidebar navigation element
 * @param {function} setCurrentSection - Function to update the current section in parent
 */
export function setupNavigation(sidebarNav, setCurrentSection) {
    if (!sidebarNav) {
        console.error('Sidebar navigation element not found');
        return [];
    }

    const navItems = sidebarNav.querySelectorAll('a');
    console.log('Setting up navigation with items:', navItems.length);

    navItems.forEach(item => {
        let section;
        const itemText = item.textContent.toLowerCase().trim();
        
        if (itemText === 'editor') section = 'editor';
        else if (itemText === 'characters') section = 'characters';
        else if (itemText === 'world lore') section = 'lore';
        else if (itemText === 'notes') section = 'notes';
        else section = 'editor'; // Default fallback
        
        // Clear existing attribute and set it again
        item.removeAttribute('data-section');
        item.setAttribute('data-section', section);
        console.log(`Nav item "${itemText}" assigned section: ${section}`);

        // Clone the element to remove any existing event listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);

        newItem.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionName = newItem.getAttribute('data-section');
            console.log(`Navigation: Clicked on section: ${sectionName}`);
            
            try {
                const { electronAPI } = window;
                if (!electronAPI) {
                    console.error('electronAPI is not available');
                    alert('Unable to navigate: Application API is not available');
                    return;
                }
                
                // Update the section via callback if provided
                if (typeof setCurrentSection === 'function') {
                    setCurrentSection(sectionName);
                    console.log(`Set current section to: ${sectionName} via callback`);
                }
                
                // Load the section content
                loadProjectSection(sectionName, electronAPI);
            } catch (error) {
                console.error('Error during navigation:', error);
            }
        });
    });
    
    return navItems;
}

// AI Tutor Chat - Course Detail Page Injector
// This script injects the AI Tutor sidebar into the LMS CourseDetail page
// without modifying the original LMS code

console.log('Script loaded:', window.location.pathname);
console.log('Is LMS page:', window.location.pathname.includes('/lms'));
console.log('Frappe boot available:', typeof frappe !== 'undefined');
console.log('Vue available:', typeof Vue !== 'undefined');

(function() {
    'use strict';
    

    console.log('Script loaded:', window.location.pathname);
    console.log('Is LMS page:', window.location.pathname.includes('/lms'));
    console.log('Frappe boot available:', typeof frappe !== 'undefined');
    console.log('Vue available:', typeof Vue !== 'undefined');

    // Ensure we don't interfere with Frappe initialization
    if (typeof frappe === 'undefined') {
        // Wait for Frappe to be available
        const checkFrappe = setInterval(() => {
            if (typeof frappe !== 'undefined' && frappe.ready) {
                clearInterval(checkFrappe);
                initializeAITutor();
            }
        }, 100);
        return;
    }
    
    // If Frappe is already available, wait for it to be ready
    if (frappe.ready) {
        initializeAITutor();
    } else {
        frappe.ready(() => {
            initializeAITutor();
        });
    }
    
    function initializeAITutor() {
        // Wait for the page to be fully loaded
        function waitForElement(selector, callback, timeout = 10000) {
            const startTime = Date.now();
            function check() {
                const element = document.querySelector(selector);
                if (element) {
                    callback(element);
                } else if (Date.now() - startTime < timeout) {
                    setTimeout(check, 100);
                }
            }
            check();
        }
        
        // Check if we're on the CourseDetail page
        function isOnCourseDetailPage() {
            return window.location.pathname.includes('/lms/courses/') && 
                   !window.location.pathname.includes('/learn/') &&
                   !window.location.pathname.includes('/admin');
        }
        
        // Extract course name from URL
        function getCourseName() {
            const pathParts = window.location.pathname.split('/');
            const courseIndex = pathParts.indexOf('courses');
            return courseIndex !== -1 && pathParts[courseIndex + 1] ? pathParts[courseIndex + 1] : null;
        }
        
        // Create the AI Tutor Sidebar HTML
        function createSidebarHTML() {
            return `
                <div id="ai-tutor-sidebar" class="fixed right-0 top-0 h-full bg-white border-l border-gray-300 shadow-lg transition-transform duration-300 z-40" 
                     style="width: 500px; min-width: 500px; transform: translateX(0);">
                    <!-- Sidebar Header -->
                    <div class="bg-blue-600 text-white p-3 flex justify-between items-center">
                        <h3 class="font-semibold">AI Tutor</h3>
                        <button id="ai-tutor-close" class="text-white hover:text-gray-200" title="Close">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Chat Messages -->
                    <div id="ai-tutor-messages" class="flex-1 p-4 overflow-y-auto bg-gray-50" style="height: calc(100vh - 140px);">
                        <div class="text-left mb-4">
                            <div class="inline-block p-3 rounded-lg bg-white text-gray-800 border shadow-sm max-w-sm">
                                <div class="font-semibold text-xs mb-2">Tutor</div>
                                <div class="text-sm leading-relaxed">Hello! I'm your AI tutor. I'm here to help you with any questions about this course. What would you like to know?</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Chat Input -->
                    <div class="p-4 border-t bg-white">
                        <div class="flex space-x-3">
                            <input id="ai-tutor-input" type="text" placeholder="Ask your question about this course..." 
                                   class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                            <button id="ai-tutor-send" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors">
                                Send
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Toggle Button (when sidebar is closed) -->
                <div id="ai-tutor-toggle" class="fixed right-4 top-1/2 transform -translate-y-1/2 z-50" style="display: none;">
                    <button class="bg-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors" title="Open AI Tutor">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                    </button>
                </div>
            `;
        }
        
        // Add CSS styles
        function addStyles() {
            // Check if styles already added
            if (document.getElementById('ai-tutor-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'ai-tutor-styles';
            style.textContent = `
                .ai-tutor-content-adjusted {
                    margin-right: 500px !important;
                    transition: margin-right 0.3s ease !important;
                }
                
                .ai-tutor-content-normal {
                    margin-right: 0 !important;
                    transition: margin-right 0.3s ease !important;
                }
                
                #ai-tutor-sidebar.hidden {
                    transform: translateX(100%) !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Handle chat functionality
        function setupChatFunctionality(courseName) {
            const messagesContainer = document.getElementById('ai-tutor-messages');
            const input = document.getElementById('ai-tutor-input');
            const sendButton = document.getElementById('ai-tutor-send');
            let isWaiting = false;
            
            function addMessage(sender, text, isUser = false) {
                const messageDiv = document.createElement('div');
                messageDiv.className = `mb-4 ${isUser ? 'text-right' : 'text-left'}`;
                messageDiv.innerHTML = `
                    <div class="inline-block p-3 rounded-lg max-w-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border shadow-sm'}">
                        <div class="font-semibold text-xs mb-2">${sender}</div>
                        <div class="text-sm leading-relaxed whitespace-pre-wrap">${text}</div>
                    </div>
                `;
                messagesContainer.appendChild(messageDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            function showTyping() {
                const typingDiv = document.createElement('div');
                typingDiv.id = 'typing-indicator';
                typingDiv.className = 'text-left mb-4';
                typingDiv.innerHTML = `
                    <div class="inline-block p-3 rounded-lg bg-white text-gray-800 border shadow-sm">
                        <div class="font-semibold text-xs mb-2">Tutor</div>
                        <div class="text-sm flex items-center">
                            <div class="animate-pulse">Typing...</div>
                            <div class="ml-2 flex space-x-1">
                                <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                                <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                            </div>
                        </div>
                    </div>
                `;
                messagesContainer.appendChild(typingDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            function hideTyping() {
                const typingIndicator = document.getElementById('typing-indicator');
                if (typingIndicator) {
                    typingIndicator.remove();
                }
            }
            
            async function sendMessage() {
                const message = input.value.trim();
                if (!message || isWaiting) return;
                
                addMessage('You', message, true);
                input.value = '';
                isWaiting = true;
                sendButton.disabled = true;
                
                showTyping();
                
                try {
                    const response = await fetch('/api/method/ai_tutor_chat.api.chat.ask_tutor', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Frappe-CSRF-Token': frappe.csrf_token
                        },
                        body: JSON.stringify({
                            user_id: frappe.session.user || 'guest',
                            message: message,
                            current_lesson: 'Course Overview',
                            course_name: courseName
                        })
                    });
                    
                    const data = await response.json();
                    hideTyping();
                    
                    if (data.message && data.message.response) {
                        addMessage('Tutor', data.message.response);
                    } else {
                        addMessage('Tutor', 'I apologize, but I encountered an error. Please try again.');
                    }
                } catch (error) {
                    console.error('Chat error:', error);
                    hideTyping();
                    addMessage('Tutor', 'I apologize, but I encountered an error. Please try again.');
                } finally {
                    isWaiting = false;
                    sendButton.disabled = false;
                }
            }
            
            sendButton.addEventListener('click', sendMessage);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
        
        // Setup sidebar toggle functionality
        function setupToggleFunctionality() {
            const sidebar = document.getElementById('ai-tutor-sidebar');
            const toggleButton = document.getElementById('ai-tutor-toggle');
            const closeButton = document.getElementById('ai-tutor-close');
            const mainContent = document.querySelector('.m-5');
            
            let isOpen = true;
            
            function toggleSidebar() {
                isOpen = !isOpen;
                
                if (isOpen) {
                    sidebar.classList.remove('hidden');
                    toggleButton.style.display = 'none';
                    if (mainContent) {
                        mainContent.classList.add('ai-tutor-content-adjusted');
                        mainContent.classList.remove('ai-tutor-content-normal');
                    }
                } else {
                    sidebar.classList.add('hidden');
                    toggleButton.style.display = 'block';
                    if (mainContent) {
                        mainContent.classList.add('ai-tutor-content-normal');
                        mainContent.classList.remove('ai-tutor-content-adjusted');
                    }
                }
            }
            
            closeButton.addEventListener('click', toggleSidebar);
            toggleButton.addEventListener('click', toggleSidebar);
            
            // Initialize with sidebar open
            if (mainContent) {
                mainContent.classList.add('ai-tutor-content-adjusted');
            }
        }
        
        // Main injection function
        function injectAITutorSidebar() {
            console.log('Checking for course detail page...', window.location.pathname);
            
            if (!isOnCourseDetailPage()) {
                console.log('Not on course detail page');
                return;
            }
            
            const courseName = getCourseName();
            if (!courseName) {
                console.log('No course name found');
                return;
            }
            
            console.log('Course name:', courseName);
            
            // Check if sidebar already exists to prevent duplicates
            if (document.getElementById('ai-tutor-sidebar')) {
                console.log('Sidebar already exists');
                return;
            }
            
            // Wait for the main content to be loaded - try multiple selectors
            const selectors = ['.m-5', '[data-v-app]', '#app', 'main', '.container'];
            let found = false;
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log('Found element with selector:', selector);
                    found = true;
                    
                    // Add styles
                    addStyles();
                    
                    // Create and inject the sidebar
                    const sidebarHTML = createSidebarHTML();
                    document.body.insertAdjacentHTML('beforeend', sidebarHTML);
                    
                    // Setup functionality
                    setupChatFunctionality(courseName);
                    setupToggleFunctionality();
                    
                    console.log('AI Tutor sidebar injected successfully');
                    break;
                }
            }
            
            if (!found) {
                console.log('No suitable container found, retrying...');
                setTimeout(injectAITutorSidebar, 1000);
            }
        }
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(injectAITutorSidebar, 1000);
            });
        } else {
            setTimeout(injectAITutorSidebar, 1000);
        }
        
        // Also listen for route changes (for SPA navigation)
        let currentPath = window.location.pathname;
        setInterval(() => {
            if (window.location.pathname !== currentPath) {
                currentPath = window.location.pathname;
                console.log('Route changed to:', currentPath);
                // Remove existing sidebar if it exists
                const existingSidebar = document.getElementById('ai-tutor-sidebar');
                const existingToggle = document.getElementById('ai-tutor-toggle');
                if (existingSidebar) existingSidebar.remove();
                if (existingToggle) existingToggle.remove();
                
                setTimeout(injectAITutorSidebar, 1500); // Longer delay for Vue to render
            }
        }, 1000);
    }
    
})();

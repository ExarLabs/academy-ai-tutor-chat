// AI Tutor Chat - Lesson Detail Page Injector (No Frappe Global Dependency)
// This script injects the AI Tutor sidebar into the LMS Lesson page
// and uses API/meta info instead of window.frappe

(function() {
    'use strict';

    // --- Utility functions ---

    function getCsrfToken() {
       return window.csrf_token || null;
    }

    async function getCurrentUser() {
        try {
            const res = await fetch('/api/method/frappe.auth.get_logged_user');
            const data = await res.json();
            return data.message || 'guest';
        } catch (e) {
            console.warn('Could not fetch user, defaulting to guest');
            return 'guest';
        }
    }

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

    function isOnLessonDetailPage() {
        return window.location.pathname.includes('/lms/courses/') && 
               window.location.pathname.includes('/learn/') &&
               !window.location.pathname.includes('/admin');
    }

    function getCourseName() {
        const pathParts = window.location.pathname.split('/');
        const courseIndex = pathParts.indexOf('courses');
        return courseIndex !== -1 && pathParts[courseIndex + 1] ? pathParts[courseIndex + 1] : null;
    }

    function getLessonId() {
        const pathParts = window.location.pathname.split('/');
        const learnIndex = pathParts.indexOf('learn');
        return learnIndex !== -1 && pathParts[learnIndex + 1] ? pathParts[learnIndex + 1] : null;
    }

    function createTabViewHTML(originalContent) {
        return `
            <!-- Tab Navigation -->
            <div class="flex border-b bg-surface-menu-bar">
                <button id="chapter-tab" class="flex-1 px-5 py-5 text-lg font-semibold border-b-2 border-blue-600 text-blue-600 bg-white flex items-center justify-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    <span>Course Content</span>
                </button>
                <button id="ai-tutor-tab" class="flex-1 px-5 py-5 text-lg font-semibold text-gray-500 hover:text-gray-700 flex items-center justify-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                    <span>AI Tutor</span>
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="chapter-content" class="tab-content">
                ${originalContent}
            </div>
            
            <div id="ai-tutor-content" class="tab-content hidden">
                <div id="ai-tutor-messages" class="p-4 overflow-y-auto bg-gray-50" style="height: calc(100vh - 200px);">
                    <div class="text-left mb-4">
                        <div class="inline-block p-3 rounded-lg bg-white text-gray-800 border shadow-sm max-w-sm">
                            <div class="font-semibold text-xs mb-2">Tutor</div>
                            <div class="text-sm leading-relaxed">Hello! I'm your AI tutor. What would you like to know about this lesson?</div>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t bg-white">
                    <div class="flex space-x-3">
                        <input id="ai-tutor-input" type="text" placeholder="Ask your question about this lesson..." 
                               class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                        <button id="ai-tutor-send" class="px-4 py-2 bg-blue-600 text-ink-gray-8 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function addStyles() {
        if (document.getElementById('ai-tutor-styles')) return;
        const style = document.createElement('style');
        style.id = 'ai-tutor-styles';
        style.textContent = `
            .tab-content { display: block; }
            .tab-content.hidden { display: none; }
            .tab-active { 
                border-bottom: 2px solid #6b7280 !important; 
                color: #6b7280 !important; 
                background-color: white !important; 
            }
            .tab-inactive { 
                border-bottom: 2px solid transparent !important; 
                color: #6b7280 !important; 
                background-color: transparent !important;
            }
            #chapter-tab, #ai-tutor-tab {
                transition: all 0.2s ease-in-out;
            }
            #chapter-tab:hover, #ai-tutor-tab:hover {
                background-color: rgba(255, 255, 255, 0.1) !important;
            }
        `;
        document.head.appendChild(style);
    }

    function setupChatFunctionality(courseName, lessonId) {
        const messagesContainer = document.getElementById('ai-tutor-messages');
        const input = document.getElementById('ai-tutor-input');
        const sendButton = document.getElementById('ai-tutor-send');
        let isWaiting = false;

        function addMessage(sender, text, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `mb-4 ${isUser ? 'text-right' : 'text-left'}`;
            messageDiv.innerHTML = `
                <div class="inline-block p-3 rounded-lg max-w-sm ${isUser ? 'bg-blue-600 text-ink-gray-8' : 'bg-white text-ink-gray-8 border shadow-sm'}">
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
            typingDiv.innerHTML = `<div class="inline-block p-3 rounded-lg bg-white text-ink-gray-8 border shadow-sm"><div class="font-semibold text-xs mb-2">Tutor</div><div class="text-sm">Typing...</div></div>`;
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function hideTyping() {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) typingIndicator.remove();
        }

        async function sendMessage() {
            const message = input.value.trim();
            if (!message || isWaiting) return;

            addMessage('You', message, true);
            input.value = '';
            isWaiting = true;
            sendButton.disabled = true;
            showTyping();

            const csrfToken = getCsrfToken();
            const user = await getCurrentUser();

            try {
                const response = await fetch('/api/method/ai_tutor_chat.api.chat.ask_tutor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Frappe-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({
                        user_id: user,
                        message: message,
                        current_lesson: lessonId || 'Unknown Lesson',
                        course_name: courseName
                    })
                });
                const data = await response.json();
                hideTyping();
                if (data.message && data.message.response) {
                    addMessage('Tutor', data.message.response);
                } else {
                    addMessage('Tutor', 'I encountered an error. Please try again.');
                }
            } catch (error) {
                console.error('Chat error:', error);
                hideTyping();
                addMessage('Tutor', 'I encountered an error. Please try again.');
            } finally {
                isWaiting = false;
                sendButton.disabled = false;
            }
        }

        sendButton.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    function setupTabFunctionality() {
        const chapterTab = document.getElementById('chapter-tab');
        const aiTutorTab = document.getElementById('ai-tutor-tab');
        const chapterContent = document.getElementById('chapter-content');
        const aiTutorContent = document.getElementById('ai-tutor-content');

        function showChapterTab() {
            chapterTab.classList.add('tab-active');
            chapterTab.classList.remove('tab-inactive', 'text-gray-500');
            chapterTab.classList.add('text-blue-600', 'bg-white');
            
            aiTutorTab.classList.add('tab-inactive', 'text-gray-500');
            aiTutorTab.classList.remove('tab-active', 'text-blue-600', 'bg-white');
            
            chapterContent.classList.remove('hidden');
            aiTutorContent.classList.add('hidden');
        }

        function showAITutorTab() {
            aiTutorTab.classList.add('tab-active');
            aiTutorTab.classList.remove('tab-inactive', 'text-gray-500');
            aiTutorTab.classList.add('text-blue-600', 'bg-white');
            
            chapterTab.classList.add('tab-inactive', 'text-gray-500');
            chapterTab.classList.remove('tab-active', 'text-blue-600', 'bg-white');
            
            aiTutorContent.classList.remove('hidden');
            chapterContent.classList.add('hidden');
        }

        chapterTab.addEventListener('click', showChapterTab);
        aiTutorTab.addEventListener('click', showAITutorTab);
    }

    function injectAITutorTabs() {
        if (!isOnLessonDetailPage()) return;
        const courseName = getCourseName();
        const lessonId = getLessonId();
        if (!courseName || !lessonId) return;
        if (document.getElementById('ai-tutor-content')) return;

        // Find the sticky sidebar container
        const stickyContainer = document.querySelector('.sticky.top-10');
        if (!stickyContainer) {
            setTimeout(injectAITutorTabs, 1000);
            return;
        }

        // Store the original content
        const originalContent = stickyContainer.innerHTML;
        
        // Replace the content with tab view
        addStyles();
        stickyContainer.innerHTML = createTabViewHTML(originalContent);
        
        setupTabFunctionality();
        setupChatFunctionality(courseName, lessonId);
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(injectAITutorTabs, 1000));
    } else {
        setTimeout(injectAITutorTabs, 1000);
    }

    let currentPath = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== currentPath) {
            currentPath = window.location.pathname;
            // Reset the sticky container when navigating
            const stickyContainer = document.querySelector('.sticky.top-10');
            if (stickyContainer && document.getElementById('ai-tutor-content')) {
                // Remove the tab functionality and restore original content if needed
                location.reload(); // Simple approach to reset the page state
            }
            if (isOnLessonDetailPage()) setTimeout(injectAITutorTabs, 1500);
        }
    }, 1000);
})();

// ai_tutor_chat/public/js/lms_chat_detector.js
console.log('🎯 Chat detector loaded on:', window.location.pathname);

// This runs on ALL pages but only activates on LMS
$(document).ready(function() {
    console.log('📍 Checking if LMS page...');
    
    // Multiple ways to detect LMS pages
    const isLMSPage = window.location.pathname.includes('/lms/') || 
                     window.location.pathname.includes('/courses/') ||
                     document.querySelector('[data-page-route="courses"]') ||
                     document.querySelector('.course-home-headings');
    
    if (isLMSPage) {
        console.log('✅ LMS page detected! Loading chat...');
        setTimeout(injectChatWidget, 2000); // Wait for Vue to render
    } else {
        console.log('❌ Not an LMS page, skipping chat');
    }
});

function injectChatWidget() {
    // Prevent double injection
    if (document.getElementById('lms-chat-widget')) return;
    
    console.log('🚀 Injecting chat widget...');
    
    const widget = document.createElement('div');
    widget.id = 'lms-chat-widget';
    widget.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; 
                    background: linear-gradient(135deg, #667eea, #764ba2); 
                    color: white; padding: 20px; border-radius: 15px; 
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3); z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
                    max-width: 300px;">
            <div style="font-weight: bold; margin-bottom: 10px;">
                💬 Chat Integration Active
            </div>
            <div style="font-size: 13px; opacity: 0.9;">
                ✅ Script loaded successfully<br>
                📍 Page: ${window.location.pathname}<br>
                👤 User: ${frappe.session.user || 'Guest'}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="position: absolute; top: 8px; right: 12px; 
                           background: none; border: none; color: white; 
                           font-size: 16px; cursor: pointer;">×</button>
        </div>
    `;
    
    document.body.appendChild(widget);
    console.log('✅ Chat widget injected successfully!');
}

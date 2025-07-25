app_name = "ai_tutor_chat"
app_title = "AI Tutor Chat"
app_publisher = "Exar"
app_description = (
    "I'm your AI tutor. I'm here to help you with any questions about the selected course"
)
app_email = "info@exar.ro"
app_license = "mit"

website_route_rules = [
    {"from_route": "/ai-tutor/<path:path>", "to_route": "ai-tutor"},
]

# API endpoints
api_methods = {
    "ai_tutor_chat.api.chat.ask_tutor": ["POST"],
}

# Include JS/CSS files
app_include_js = [
    "/assets/ai_tutor_chat/js/course_detail_injector.js"
]

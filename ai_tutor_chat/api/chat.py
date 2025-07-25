# ai_assistant/api/chat.py

import frappe
import requests
from frappe import _
import json


@frappe.whitelist(allow_guest=False)
def ask_tutor(user_id=None, message=None, current_lesson=None, course_name=None):
    """
    Send message to the AI tutor API
    """
    try:
        # Identify the user making the request
        if not user_id:
            user_id = frappe.session.user

        # Init lesson
        if not current_lesson:
            current_lesson = "Course Overview"

        # Init payload
        payload = {
            "user_id": user_id,
            "message": message,
            "current_lesson": current_lesson,
            "course_name": course_name or "General Course"
        }

        # Get AI tutor API URL from site config or use default
        ai_tutor_api_url = frappe.conf.get("ai_tutor_api_url", "http://localhost:7999")
        
        # Debug logging
        frappe.log_error(f"AI Tutor API URL: {ai_tutor_api_url}", "AI Tutor Debug")
        print("AI Tutor API URL:", ai_tutor_api_url)
        
        api_endpoint = f"{ai_tutor_api_url}/api/v1/ai-tutor/chat"
        
        # Debug logging for endpoint
        frappe.log_error(f"API Endpoint: {api_endpoint}", "AI Tutor Debug")
        
        # HTTP request to the AI tutor API
        response = requests.post(
            api_endpoint,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        print("AI Tutor API response:", response.text)

        if response.status_code == 200:
            api_response = response.json()
            # Return in the format expected by the JavaScript
            return {"response": api_response.get("response", "I'm here to help! What would you like to know?")}
        else:
            frappe.log_error(
                f"AI Tutor API Error: {response.status_code} - {response.text}",
                "AI Assistant Chat Error",
            )
            return {"response": "I'm sorry, I'm having trouble connecting to the AI service right now. Please try again later."}

    except requests.exceptions.RequestException as e:
        print("RequestException:", e)
        frappe.log_error(str(e), "AI Assistant Connection Error")
        # For demo purposes, return a mock response when the external API is not available
        return {"response": f"Thank you for your question: '{message}'. I'm here to help you with the course content. This is a demo response since the AI service is not currently available."}
    except Exception as e:
        print("Exception:", e)
        frappe.log_error(str(e), "AI Assistant General Error")
        return {"response": "I encountered an error. Please try again."}

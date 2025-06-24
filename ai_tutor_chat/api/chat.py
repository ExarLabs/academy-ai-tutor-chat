# ai_assistant/api/chat.py

import frappe
import requests
from frappe import _
import json


@frappe.whitelist(allow_guest=False)
def ask_tutor(message, current_lesson=None):
    """
    Send message to the AI tutor API
    """
    try:
        # Identify the user making the request
        user_id = frappe.session.user

        # Init lesson
        if not current_lesson:
            current_lesson = "Machine Learning Basics"

        # Init payload
        payload = {
            "user_id": user_id,
            "message": message,
            "current_lesson": current_lesson,
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
            return {"success": True, "data": response.json()}
        else:
            frappe.log_error(
                f"AI Tutor API Error: {response.status_code} - {response.text}",
                "AI Assistant Chat Error",
            )
            return {
                "success": False,
                "error": _("AI service temporarily unavailable. Please try again later."),
            }

    except requests.exceptions.RequestException as e:
        print("RequestException:", e)
        frappe.log_error(str(e), "AI Assistant Connection Error")
        return {
            "success": False,
            "error": _("Failed to connect to AI service. Please check your connection."),
        }
    except Exception as e:
        print("Exception:", e)
        frappe.log_error(str(e), "AI Assistant General Error")
        return {"success": False, "error": _("An unexpected error occurred. Please try again.")}

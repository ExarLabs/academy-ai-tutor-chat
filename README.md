# Installation Guide
1. You have to have bench installed on your WSL
1. You have to have the ignis_academy bench created
    - `bench init ignis_academy`
1. Download the app:
    - `bench get-app ai_tutor_chat git@github.com/ExarLabs/academy-ai-tutor-chat` or `bench get-app ai_tutor_chat https://github.com/ExarLabs/academy-ai-tutor-chat`, then:
1. You have to have the academy.local site
    - `bench new-site academy.local`
1. Install the app:
    - `bench --site academy.local install-app ai_tutor_chat`

## Description
This Frappe application contains the backend implementation of the AI Tutor Chat.
It defines the endpoints that are called by the AI Tutor Chat Vue component integrated into the LMS app.
This application will act as a proxy between the LMS app and the LangChain service.

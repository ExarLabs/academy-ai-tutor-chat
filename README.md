# Installation Guide
1. You have to have bench installed on your WSL
1. You have to have the ignis_academy bench created
    - `bench init ignis_academy`
1. Download the Auth app:
    - `bench get-app ai_tutor_chat git@github.com:ExarLabs/academy-ai-tutor-chat.git` or `bench get-app ai_tutor_chat https://github.com/ExarLabs/academy-ai-tutor-chat.git`, then:
1. You have to have the academy.local site
    - `bench new-site academy.local`
1. Install the Auth app:
    - `bench --site academy.local install-app ai_tutor_chat`
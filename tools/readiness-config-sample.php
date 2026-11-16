<?php
// The AI Readiness Check (api/readiness.php) reads the same private file as the website assistant:
//   chatbot-private/config.php  (the folder sits NEXT TO public_html, never inside it; never commit the real file)
// To run the Readiness Check on Groq's free tier, the file only needs:
return [
    'provider'     => 'groq',
    'groq_api_key' => 'PASTE-YOUR-GROQ-API-KEY-HERE',   // from console.groq.com → API Keys
    'groq_model'   => 'openai/gpt-oss-120b',            // free-tier open model
    'notify_to'    => 'hello@suchetanabauri.com',       // where leads are emailed
    'mail_from'    => 'hello@suchetanabauri.com',       // sender address on your domain
];

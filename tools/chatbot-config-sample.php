<?php
// Copy this file to:  chatbot-private/config.php
// The chatbot-private folder must sit NEXT TO public_html (not inside it), so nobody can open it from the web.
// Never commit the real file to GitHub.
return [
    'anthropic_api_key' => 'PASTE-YOUR-ANTHROPIC-API-KEY-HERE',
    'model'             => 'claude-haiku-5-5',          // fast and inexpensive
    'notify_to'         => 'hello@suchetanabauri.com',  // where new enquiries are emailed
    'mail_from'         => 'hello@suchetanabauri.com',  // sender address (must be on your domain)
    'per_ip_per_hour'   => 40,                          // messages one visitor can send per hour
    'per_day_total'     => 1500,                        // safety cap on all messages per day
    'send_ack_email'    => true,                        // email visitors a "thanks, I'll reply" note
    'mock'              => false,                       // true = test without calling the AI
];

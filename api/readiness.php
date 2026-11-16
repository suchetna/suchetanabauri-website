<?php
/**
 * AI Readiness Check for suchetanabauri.com  (page: /ai-readiness/)
 *
 * action "score": scores the 12 answers here on the server (fixed rules, so results are consistent),
 *   asks Claude to write a short personalised report, and returns the score and summary.
 *   The full report (area notes and first moves) is kept privately for 24 hours under a random token.
 * action "send":  the visitor gives a work email; the full report is emailed to them and shown on screen,
 *   and Suchetana is emailed the lead with their scores.
 *
 * Uses the same private config as the website assistant: ../../chatbot-private/config.php
 * Answers are not stored unless the visitor asks for the report by email.
 */

declare(strict_types=1);
date_default_timezone_set('Asia/Kolkata');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $code, array $body): void { http_response_code($code); echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }

$PRIVATE = dirname(__DIR__, 2) . '/chatbot-private';
$cfgFile = $PRIVATE . '/config.php';
// The config is optional: without an AI key the check still works, with a standard (non-AI) report.
$CFG = is_file($cfgFile) ? (array)(require $cfgFile) : [];
$CFG += [
    'model' => 'claude-haiku-5-5',
    'notify_to' => 'hello@suchetanabauri.com',
    'mail_from' => 'hello@suchetanabauri.com',
    'mock' => false,
    'allowed_origins' => ['https://suchetanabauri.com'],
    'readiness_per_ip_per_hour' => 8,
    'readiness_per_day_total' => 300,
];
$DATA = $PRIVATE . '/data';
if (!is_dir($DATA)) @mkdir($DATA, 0700, true);
if (!is_dir($DATA) || !is_writable($DATA)) { $DATA = sys_get_temp_dir() . '/sb-readiness'; if (!is_dir($DATA)) @mkdir($DATA, 0700, true); }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(405, ['error' => 'Method not allowed']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, $CFG['allowed_origins'], true)) reply(403, ['error' => 'Not allowed']);
$in = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($in)) reply(400, ['error' => 'Bad request']);

// ---- The model: 6 areas, 2 questions each, answers scored 0-3 -----------------------------
const AREAS = [
    'leadership' => ['Leadership and direction', ['q1', 'q2']],
    'people'     => ['People and skills',        ['q3', 'q4']],
    'work'       => ['Work and use cases',       ['q5', 'q6']],
    'tools'      => ['Tools and information',    ['q7', 'q8']],
    'responsible'=> ['Responsible use',          ['q9', 'q10']],
    'change'     => ['Communication and change', ['q11', 'q12']],
];
const QUESTIONS = [
    'q1'  => ['Has leadership explained why the organisation is using AI?', ['No', 'It has been talked about', 'There are written goals', 'There are goals with owners and measures']],
    'q2'  => ['Who owns AI adoption?', ['Nobody in particular', 'IT, on its own', 'An informal group across teams', 'A named owner with a budget']],
    'q3'  => ['How many employees use AI for work each week?', ['Hardly any', 'A few enthusiasts', 'About a third', 'Most']],
    'q4'  => ['What AI training have people had?', ['None', 'A one-off session', 'Role-based training for some teams', 'Ongoing, role-based learning']],
    'q5'  => ['Have you identified tasks where AI helps?', ['No', 'General ideas only', 'A list of use cases', 'A prioritised list, with current performance measured']],
    'q6'  => ['Is AI part of any process from start to finish?', ['No', 'Individuals experiment', 'One team is running a pilot', 'Several processes, with human review']],
    'q7'  => ['Do people have approved AI tools?', ['No, they use personal accounts', 'Some, but it is unclear which', 'Yes, an approved list', 'Yes, approved and connected to company systems']],
    'q8'  => ['Is your information (policies, documents, knowledge) organised for AI to use?', ['Scattered', 'Partly', 'Mostly in one place', 'Organised, current and owned']],
    'q9'  => ['Is there an AI use policy?', ['None', 'Being drafted', 'Published', 'Published, understood and reviewed regularly']],
    'q10' => ['Do people know what data must never go into AI tools?', ['No', 'Some people do', 'Most people do', 'Everyone does, and it is checked']],
    'q11' => ['How has AI been communicated to employees?', ['Not at all', 'Occasional mentions', 'A launch announcement', 'An ongoing programme, with managers involved']],
    'q12' => ['How do employees feel about AI at work?', ['Worried, or unaware', 'Mixed, and rarely discussed', 'Mostly curious', 'Confident, and sharing what works']],
];
const LEVELS = [
    [12, 'Starting',  'AI is not yet part of how the organisation works. That is a good moment to set direction before habits form on their own.'],
    [24, 'Exploring', 'People are trying AI, but without shared direction, tools or guidance, so the benefit stays with a few individuals.'],
    [30, 'Scaling',   'The foundations are in place. The work now is spreading good practice across teams and measuring the difference it makes.'],
    [36, 'Leading',   'AI is part of how work gets done, with clear ownership and responsible use. Keep learning, measuring and sharing.'],
];
// Fallback first moves for each area, used when the AI report is unavailable.
const MOVES = [
    'leadership' => ['Write down why you are using AI', 'Agree two or three business outcomes AI should help with, name one owner, and share them with every manager.'],
    'people'     => ['Train by role, not by tool', 'Pick two roles, find three real tasks each where AI helps, and run a short hands-on session built around those tasks.'],
    'work'       => ['Choose one workflow and measure it', 'List the repetitive tasks in one team, pick one, record how long it takes today, and pilot AI on it with human review.'],
    'tools'      => ['Give people an approved tool', 'Replace personal accounts with one approved tool, explain what it is for, and tidy the documents people will ask it about.'],
    'responsible'=> ['Publish a one-page AI use policy', 'Say plainly what AI may be used for, what data must never go into it, and who to ask. Check that people understood it.'],
    'change'     => ['Treat AI as a change, not a launch', 'Brief managers first, answer the worries people actually have, and share real examples from colleagues every month.'],
];

function clean(string $v, int $max = 200): string { return mb_substr(trim(preg_replace('/[\r\n\t]+/', ' ', $v)), 0, $max); }

function bump(string $file, int $limit): bool {
    $fh = @fopen($file, 'c+'); if (!$fh) return true;
    flock($fh, LOCK_EX);
    $n = (int)stream_get_contents($fh) + 1;
    ftruncate($fh, 0); rewind($fh); fwrite($fh, (string)$n);
    flock($fh, LOCK_UN); fclose($fh);
    return $n <= $limit;
}

// Calls the AI and returns its JSON reply, or null if anything fails (the fixed report is used instead).
// provider 'groq' (free tier, open models) or 'anthropic' (Claude), set in the private config.
function claude(array $CFG, array $payload): ?array {
    if (!empty($CFG['mock'])) return null; // mock mode uses the fixed report below
    if (empty($CFG['groq_api_key']) && empty($CFG['anthropic_api_key'])) return null; // no AI key yet: standard report
    $groq = ($CFG['provider'] ?? '') === 'groq' || (!empty($CFG['groq_api_key']) && empty($CFG['anthropic_api_key']));
    if ($groq) {
        $url = 'https://api.groq.com/openai/v1/chat/completions';
        $headers = ['content-type: application/json', 'authorization: Bearer ' . ($CFG['groq_api_key'] ?? '')];
        $body = [
            'model' => $CFG['groq_model'] ?? 'openai/gpt-oss-120b',
            'max_tokens' => $payload['max_tokens'] * 2,
            'temperature' => 0.4,
            'response_format' => ['type' => 'json_object'],
            'messages' => array_merge([['role' => 'system', 'content' => $payload['system']]], $payload['messages']),
        ];
    } else {
        $url = 'https://api.anthropic.com/v1/messages';
        $headers = ['content-type: application/json', 'x-api-key: ' . ($CFG['anthropic_api_key'] ?? ''), 'anthropic-version: 2023-06-01'];
        $body = $payload;
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 45, CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE)]);
    $raw = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    $data = json_decode((string)$raw, true);
    if ($code !== 200 || !is_array($data)) { error_log('[readiness] AI API error ' . $code . ' ' . substr((string)$raw, 0, 300)); return null; }
    $text = '';
    if ($groq) $text = (string)($data['choices'][0]['message']['content'] ?? '');
    else foreach ($data['content'] ?? [] as $b) if (($b['type'] ?? '') === 'text') $text .= $b['text'];
    if (!preg_match('/\{.*\}/s', $text, $m)) return null;
    $json = json_decode($m[0], true);
    return is_array($json) ? $json : null;
}

function report_text(array $r): string {
    $t = "Your AI readiness: {$r['total']} out of 36 ({$r['level']})\n\n{$r['summary']}\n\nBY AREA\n";
    foreach ($r['areas'] as $a) $t .= "- {$a['name']}: {$a['score']} out of 6. {$a['note']}\n";
    $t .= "\nTHREE FIRST MOVES\n";
    foreach ($r['moves'] as $i => $mv) $t .= ($i + 1) . ". {$mv['title']}\n   {$mv['detail']}\n";
    return $t;
}

$action = (string)($in['action'] ?? '');

// =========================================================================================
if ($action === 'score') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!bump($DATA . '/rc-ip-' . hash('sha256', $ip . date('YmdH')) . '.txt', (int)$CFG['readiness_per_ip_per_hour']))
        reply(429, ['error' => 'You’ve run the check several times this hour. Please try again a little later.']);
    if (!bump($DATA . '/rc-day-' . date('Ymd') . '.txt', (int)$CFG['readiness_per_day_total']))
        reply(429, ['error' => 'The Readiness Check is resting for today. Please try again tomorrow, or email hello@suchetanabauri.com.']);
    // Now and then, delete expired results (after 24 hours) and old counters.
    if (mt_rand(1, 30) === 1) foreach (array_merge(glob($DATA . '/rc-r-*.json') ?: [], glob($DATA . '/rc-ip-*.txt') ?: [], glob($DATA . '/rc-day-*.txt') ?: []) as $f)
        if (filemtime($f) < time() - 86400 * (str_contains($f, 'rc-day-') ? 3 : 1)) @unlink($f);

    // Score on the server
    $answers = (array)($in['answers'] ?? []);
    $scores = [];
    foreach (QUESTIONS as $k => $_) {
        $v = $answers[$k] ?? null;
        if (!is_int($v) && !(is_string($v) && ctype_digit($v))) reply(400, ['error' => 'Please answer every question.']);
        $v = (int)$v; if ($v < 0 || $v > 3) reply(400, ['error' => 'Please answer every question.']);
        $scores[$k] = $v;
    }
    $areas = [];
    foreach (AREAS as $key => [$name, $qs]) $areas[$key] = ['key' => $key, 'name' => $name, 'score' => $scores[$qs[0]] + $scores[$qs[1]], 'note' => ''];
    $total = array_sum($scores);
    foreach (LEVELS as [$max, $lvl, $lvlText]) if ($total <= $max) break;
    $ctx = (array)($in['context'] ?? []);
    $context = [
        'size' => clean((string)($ctx['size'] ?? ''), 60), 'industry' => clean((string)($ctx['industry'] ?? ''), 80),
        'role' => clean((string)($ctx['role'] ?? ''), 80), 'tools' => clean((string)($ctx['tools'] ?? ''), 160),
    ];
    $sorted = array_values($areas);
    usort($sorted, fn($a, $b) => $a['score'] <=> $b['score']);
    $weakest = array_slice(array_column($sorted, 'key'), 0, 3);

    // Fixed report first, so the check always works; the AI then personalises it.
    $report = [
        'total' => $total, 'level' => $lvl,
        'summary' => $lvlText . ' Your lowest-scoring area is ' . strtolower($areas[$weakest[0]]['name']) . '.',
        'areas' => array_values($areas),
        'moves' => array_map(fn($k) => ['title' => MOVES[$k][0], 'detail' => MOVES[$k][1]], $weakest),
        'context' => $context, 'answers' => $scores,
    ];
    foreach ($report['areas'] as &$a) $a['note'] = ['Not yet in place.', 'Early signs, not yet consistent.', 'Partly in place.', 'Partly in place.', 'Mostly in place.', 'Well established.', 'Well established.'][$a['score']];
    unset($a);

    $lines = '';
    foreach (QUESTIONS as $k => [$q, $opts]) $lines .= "- {$q} → {$opts[$scores[$k]]}\n";
    $areaLines = '';
    foreach ($areas as $a) $areaLines .= "- {$a['key']} ({$a['name']}): {$a['score']}/6\n";
    $ai = claude($CFG, [
        'model' => $CFG['model'],
        'max_tokens' => 1100,
        'system' => 'You write short, practical AI-readiness reports for organisations, on behalf of Suchetana Bauri, an AI enablement and communications consultant in India. British spelling. Plain, warm, specific language; no jargon, hype or flattery. Use only what the answers say; never invent facts about the organisation. Do not mention prices. Do not give legal advice; you may say a policy should be checked against India’s data protection rules. Reply with JSON only.',
        'messages' => [['role' => 'user', 'content' =>
            "Organisation: size {$context['size']}; industry {$context['industry']}; respondent's role {$context['role']}; AI tools in use: {$context['tools']}\n"
            . "Overall: {$total}/36, level {$lvl}.\nArea scores:\n{$areaLines}\nAnswers:\n{$lines}\n"
            . "Return JSON with exactly these keys:\n"
            . "\"summary\": 2-3 sentences on where they stand and what matters most next, addressed to them as \"you\".\n"
            . "\"notes\": an object with one sentence for each area key (leadership, people, work, tools, responsible, change), explaining what their answers mean.\n"
            . "\"moves\": an array of exactly 3 objects {\"title\": max 8 words, \"detail\": 1-2 sentences}, practical first moves for the next 90 days, focused on their weakest areas (" . implode(', ', $weakest) . "), ordered by what to do first."]],
    ]);
    if ($ai) {
        if (is_string($ai['summary'] ?? null) && $ai['summary'] !== '') $report['summary'] = clean($ai['summary'], 700);
        foreach ($report['areas'] as &$a) if (is_string($ai['notes'][$a['key']] ?? null)) $a['note'] = clean($ai['notes'][$a['key']], 400);
        unset($a);
        if (is_array($ai['moves'] ?? null) && count($ai['moves']) >= 3) {
            $mv = [];
            foreach (array_slice($ai['moves'], 0, 3) as $m) if (is_string($m['title'] ?? null) && is_string($m['detail'] ?? null)) $mv[] = ['title' => clean($m['title'], 120), 'detail' => clean($m['detail'], 500)];
            if (count($mv) === 3) $report['moves'] = $mv;
        }
    }

    $token = bin2hex(random_bytes(16));
    @file_put_contents($DATA . '/rc-r-' . $token . '.json', json_encode($report, JSON_UNESCAPED_UNICODE));
    reply(200, [
        'token' => $token, 'total' => $total, 'level' => $lvl, 'summary' => $report['summary'],
        'areas' => array_map(fn($a) => ['key' => $a['key'], 'name' => $a['name'], 'score' => $a['score']], $report['areas']),
    ]);
}

// =========================================================================================
if ($action === 'send') {
    $token = (string)($in['token'] ?? '');
    if (!preg_match('/^[a-f0-9]{32}$/', $token)) reply(400, ['error' => 'Please run the check again.']);
    $file = $DATA . '/rc-r-' . $token . '.json';
    $report = is_file($file) ? json_decode((string)file_get_contents($file), true) : null;
    if (!is_array($report)) reply(410, ['error' => 'This result has expired. Please run the check again.']);
    if (!empty($report['sent'])) reply(200, ['ok' => true, 'areas' => $report['areas'], 'moves' => $report['moves']]);

    if (!empty($in['website'])) reply(200, ['ok' => true, 'areas' => $report['areas'], 'moves' => $report['moves']]); // honeypot
    $name = clean((string)($in['name'] ?? ''), 120);
    $org = clean((string)($in['organisation'] ?? ''), 160);
    $email = filter_var(trim((string)($in['email'] ?? '')), FILTER_VALIDATE_EMAIL);
    if ($name === '') reply(400, ['error' => 'Please add your name.', 'field' => 'name']);
    if (!$email) reply(400, ['error' => 'That email address doesn’t look right.', 'field' => 'email']);
    $wantsCall = !empty($in['call']);

    $text = report_text($report);
    $from = $CFG['mail_from'];

    // 1. The visitor's report
    $body = "Hi {$name},\n\nThank you for taking the AI Readiness Check on suchetanabauri.com. Here is your full report.\n\n{$text}\n"
        . "WHAT NEXT\nThis check gives a quick picture from one person’s answers. The AI Readiness Sprint goes further: an employee pulse survey, conversations with your leadership team, and a 90-day communication and adoption roadmap.\n"
        . "If you’d like to talk it through, just reply to this email.\n\nWarm regards,\nSuchetana Bauri\nAI enablement and communications\nhttps://suchetanabauri.com\n";
    $sent = !empty($CFG['mock']) ? true : @mail($email, '=?UTF-8?B?' . base64_encode('Your AI readiness report: ' . $report['level']) . '?=', $body,
        "From: Suchetana Bauri <{$from}>\r\nReply-To: {$CFG['notify_to']}\r\nContent-Type: text/plain; charset=UTF-8");

    // 2. Lead for Suchetana
    $c = $report['context'];
    $lead = "Someone completed the AI Readiness Check and asked for the full report.\n\n"
        . "Name: {$name}\nEmail: {$email}\nOrganisation: {$org}\nWants a call: " . ($wantsCall ? 'YES' : 'not yet') . "\n"
        . "Size: {$c['size']}\nIndustry: {$c['industry']}\nRole: {$c['role']}\nAI tools: {$c['tools']}\n\n----- Their report -----\n{$text}";
    if (empty($CFG['mock'])) @mail($CFG['notify_to'], '=?UTF-8?B?' . base64_encode(($wantsCall ? '[Call requested] ' : '') . "Readiness Check lead: {$name} ({$report['level']}, {$report['total']}/36)") . '?=', $lead,
        "From: Website <{$from}>\r\nReply-To: {$email}\r\nContent-Type: text/plain; charset=UTF-8");

    // 3. Save the lead privately
    $csv = $DATA . '/readiness-leads.csv'; $new = !is_file($csv);
    if ($fh = @fopen($csv, 'a')) {
        if ($new) fputcsv($fh, ['received', 'name', 'email', 'organisation', 'wants_call', 'size', 'industry', 'role', 'tools', 'total', 'level', ...array_keys(AREAS)]);
        fputcsv($fh, [date('c'), $name, $email, $org, $wantsCall ? 'yes' : 'no', $c['size'], $c['industry'], $c['role'], $c['tools'], $report['total'], $report['level'], ...array_column($report['areas'], 'score')]);
        fclose($fh);
    }
    $report['sent'] = true;
    @file_put_contents($file, json_encode($report, JSON_UNESCAPED_UNICODE));
    reply(200, ['ok' => true, 'emailed' => (bool)$sent, 'areas' => $report['areas'], 'moves' => $report['moves']]);
}

reply(400, ['error' => 'Bad request']);

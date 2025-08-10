<?php
// Redirect to index.html if accessed directly without invitation code
$invitationCode = $_GET['invitation'] ?? '';
if (empty($invitationCode)) {
    header('Location: index.html');
    exit;
}

// If invitation code is provided, redirect to register.html with the code
header('Location: register.html?invitation=' . urlencode($invitationCode));
exit;
?> 
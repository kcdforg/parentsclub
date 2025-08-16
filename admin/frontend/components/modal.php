<?php
// Admin Modal Component
function renderModal($config) {
    $defaults = [
        'id' => 'modal',
        'title' => 'Modal Title',
        'size' => 'md', // sm, md, lg, xl, full
        'content' => '',
        'showCloseButton' => true,
        'zIndex' => 50
    ];
    $config = array_merge($defaults, $config);
    
    $sizeClasses = [
        'sm' => 'w-80',
        'md' => 'w-96', 
        'lg' => 'w-full max-w-lg',
        'xl' => 'w-full max-w-2xl',
        'full' => 'w-full max-w-4xl'
    ];
?>
<div id="<?php echo $config['id']; ?>" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" style="z-index: <?php echo $config['zIndex']; ?>">
    <div class="relative top-20 mx-auto p-5 border <?php echo $sizeClasses[$config['size']]; ?> shadow-lg rounded-md bg-white">
        <div class="mt-3">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900"><?php echo htmlspecialchars($config['title']); ?></h3>
                <?php if ($config['showCloseButton']): ?>
                    <button id="close<?php echo ucfirst($config['id']); ?>Btn" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                <?php endif; ?>
            </div>
            <div class="modal-content">
                <?php echo $config['content']; ?>
            </div>
        </div>
    </div>
</div>
<?php
}

function renderFormModal($config) {
    $defaults = [
        'id' => 'formModal',
        'title' => 'Form',
        'fields' => [],
        'submitText' => 'Submit',
        'cancelText' => 'Cancel',
        'size' => 'md'
    ];
    $config = array_merge($defaults, $config);
    
    $formContent = '<form id="' . $config['id'] . 'Form" class="space-y-4">';
    
    foreach ($config['fields'] as $field) {
        $formContent .= '<div>';
        $formContent .= '<label for="' . $field['id'] . '" class="block text-sm font-medium text-gray-700 mb-1">' . htmlspecialchars($field['label']) . '</label>';
        
        if ($field['type'] === 'select') {
            $formContent .= '<select id="' . $field['id'] . '" name="' . $field['name'] . '" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">';
            foreach ($field['options'] as $value => $label) {
                $formContent .= '<option value="' . htmlspecialchars($value) . '">' . htmlspecialchars($label) . '</option>';
            }
            $formContent .= '</select>';
        } else {
            $formContent .= '<input type="' . $field['type'] . '" id="' . $field['id'] . '" name="' . $field['name'] . '" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">';
        }
        
        if (isset($field['help'])) {
            $formContent .= '<p class="text-xs text-gray-500 mt-1">' . htmlspecialchars($field['help']) . '</p>';
        }
        
        $formContent .= '</div>';
    }
    
    $formContent .= '<div class="flex space-x-3">';
    $formContent .= '<button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">' . htmlspecialchars($config['submitText']) . '</button>';
    $formContent .= '<button type="button" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">' . htmlspecialchars($config['cancelText']) . '</button>';
    $formContent .= '</div>';
    $formContent .= '</form>';
    
    renderModal([
        'id' => $config['id'],
        'title' => $config['title'],
        'size' => $config['size'],
        'content' => $formContent
    ]);
}
?>

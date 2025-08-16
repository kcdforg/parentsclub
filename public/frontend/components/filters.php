<?php
// Public Filters Component
function renderPublicFilters($config) {
    $defaults = [
        'searchPlaceholder' => 'Search...',
        'showSearch' => true,
        'showReset' => true,
        'customFields' => [],
        'gridCols' => 'md:grid-cols-3'
    ];
    $config = array_merge($defaults, $config);
?>
<div class="bg-white shadow rounded-lg mb-6">
    <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 <?php echo $config['gridCols']; ?> gap-4">
            <?php if ($config['showSearch']): ?>
                <div>
                    <label for="searchInput" class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input type="text" id="searchInput" placeholder="<?php echo htmlspecialchars($config['searchPlaceholder']); ?>" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                </div>
            <?php endif; ?>
            
            <?php foreach ($config['customFields'] as $field): ?>
                <div>
                    <label for="<?php echo $field['id']; ?>" class="block text-sm font-medium text-gray-700 mb-2"><?php echo htmlspecialchars($field['label']); ?></label>
                    <?php if ($field['type'] === 'select'): ?>
                        <select id="<?php echo $field['id']; ?>" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                            <?php foreach ($field['options'] as $value => $label): ?>
                                <option value="<?php echo htmlspecialchars($value); ?>"><?php echo htmlspecialchars($label); ?></option>
                            <?php endforeach; ?>
                        </select>
                    <?php else: ?>
                        <input type="<?php echo $field['type']; ?>" id="<?php echo $field['id']; ?>" 
                               placeholder="<?php echo htmlspecialchars($field['placeholder'] ?? ''); ?>"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                    <?php endif; ?>
                    
                    <?php if (isset($field['help'])): ?>
                        <p class="text-xs text-gray-500 mt-1"><?php echo htmlspecialchars($field['help']); ?></p>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
            
            <div class="flex items-end">
                <button id="searchBtn" class="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    <i class="fas fa-search mr-2"></i>Search
                </button>
            </div>
            
            <?php if ($config['showReset']): ?>
                <div class="flex items-end">
                    <button id="resetFiltersBtn" class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-undo mr-2"></i>Reset
                    </button>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
<?php
}
?>

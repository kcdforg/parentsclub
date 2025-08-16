<?php
// Admin Pagination Component
function renderPagination($config) {
    $defaults = [
        'currentPage' => 1,
        'totalPages' => 1,
        'showingStart' => 0,
        'showingEnd' => 0,
        'totalItems' => 0,
        'prevBtnId' => 'prevPageBtn',
        'nextBtnId' => 'nextPageBtn',
        'currentPageId' => 'currentPage',
        'showingStartId' => 'showingStart',
        'showingEndId' => 'showingEnd',
        'totalItemsId' => 'totalItems'
    ];
    $config = array_merge($defaults, $config);
?>
<div class="mt-6 flex items-center justify-between">
    <div class="text-sm text-gray-700">
        Showing <span id="<?php echo $config['showingStartId']; ?>"><?php echo $config['showingStart']; ?></span> 
        to <span id="<?php echo $config['showingEndId']; ?>"><?php echo $config['showingEnd']; ?></span> 
        of <span id="<?php echo $config['totalItemsId']; ?>"><?php echo $config['totalItems']; ?></span> items
    </div>
    <div class="flex space-x-2">
        <button id="<?php echo $config['prevBtnId']; ?>" 
                class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                <?php echo $config['currentPage'] <= 1 ? 'disabled' : ''; ?>>
            Previous
        </button>
        <span id="<?php echo $config['currentPageId']; ?>" class="px-3 py-2 text-sm text-gray-700">
            Page <?php echo $config['currentPage']; ?>
        </span>
        <button id="<?php echo $config['nextBtnId']; ?>" 
                class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                <?php echo $config['currentPage'] >= $config['totalPages'] ? 'disabled' : ''; ?>>
            Next
        </button>
    </div>
</div>
<?php
}
?>

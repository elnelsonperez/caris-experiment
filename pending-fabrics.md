# Pending Fabric Picker Implementation

## Original Requirement
The user wants to enhance fabric input fields in the order forms to have a fabric picker. When inputting a new order item, users should be able to click "Browse" next to fabric input fields to open a modal showing all available fabrics with thumbnail images. Clicking on a fabric should set its code in the fabric input field.

## What's Already Completed
1. ✅ **Fabric Data Extracted**: All 80 fabric options have been parsed from the HTML and saved to `fabrics.json`
2. ✅ **HTML Structure Updated**: 
   - Added fabric input containers with "Browse" buttons to all fabric input fields:
     - Quick Add section (line ~1094-1097)
     - Order item inputs (line ~1223-1226) 
     - Add Product Modal (line ~1341-1344)
3. ✅ **CSS Styling Added**: 
   - `.fabric-input-container` styling for flexbox layout
   - `.fabric-browse-btn` styling for the browse buttons
   - Responsive styling for different sections
4. ✅ **Fabric Picker Modal Added**: HTML structure for the modal (lines ~1304-1335)
5. ✅ **Fabric Data Inlined**: All 80 fabric objects added to JavaScript `fabricData` array (lines ~2257-2738)

## What's Still Needed

### 1. JavaScript Computed Properties
Add to the Vue app (around line 2740):
```javascript
get filteredFabrics() {
    if (!this.fabricSearchQuery) return this.fabricData;
    const query = this.fabricSearchQuery.toLowerCase();
    return this.fabricData.filter(fabric => 
        fabric.code.toLowerCase().includes(query) ||
        fabric.alt_text.toLowerCase().includes(query)
    );
},
```

### 2. JavaScript Methods
Add these methods to the Vue app methods section:
```javascript
// Fabric picker methods
showFabricPicker(target, item = null) {
    this.fabricPickerTarget = target;
    this.fabricPickerItem = item;
    this.fabricSearchQuery = '';
    this.showFabricPickerModal = true;
},

closeFabricPicker() {
    this.showFabricPickerModal = false;
    this.fabricPickerTarget = null;
    this.fabricPickerItem = null;
    this.fabricSearchQuery = '';
},

selectFabric(fabric) {
    // Set the fabric code in the appropriate input field
    if (this.fabricPickerTarget === 'quickAdd') {
        this.quickAdd.fabric = fabric.code;
    } else if (this.fabricPickerTarget === 'newProduct') {
        this.newProduct.fabric = fabric.code;
    } else if (this.fabricPickerTarget === 'orderItem' && this.fabricPickerItem) {
        this.fabricPickerItem.fabric = fabric.code;
        this.saveOrders(); // Save changes for order items
    }
    
    this.closeFabricPicker();
},
```

### 3. CSS Enhancement for Modal Hover Effects
Add hover effects for fabric selection in the modal:
```css
.fabric-picker-item:hover {
    border-color: #667eea !important;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    transform: translateY(-1px);
}
```

## Files Modified
- `/Users/nelsonperez/code/puppeteertest/caris-scraper-python/product_browser.html` - Main HTML file with all changes
- `/Users/nelsonperez/code/puppeteertest/caris-scraper-python/fabrics.json` - Extracted fabric data (reference)

## Key Technical Details
- Using PetiteVue for reactivity
- Fabric data contains: `code`, `thumbnail_url`, `high_res_url`, `alt_text`
- Three fabric input contexts: quickAdd, newProduct, orderItem
- Modal uses grid layout for fabric thumbnails
- Search functionality filters by code and alt_text

## Testing Requirements
1. Test fabric picker opens from all three input contexts
2. Test search functionality filters fabrics correctly
3. Test fabric selection updates the correct input field
4. Test modal closes properly after selection
5. Test "Browse" buttons are styled consistently

## Current Status
- Fabric data and UI structure: ✅ Complete
- JavaScript functionality: ⏳ Pending (needs computed properties and methods)
- Testing: ⏳ Pending
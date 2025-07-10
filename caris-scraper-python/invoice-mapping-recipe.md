# Invoice Mapping Recipe

## Overview
This document outlines the process we followed to cross-reference pricing information from invoice images with scraped product data, resulting in a structured JSON mapping file.

## Initial Setup
- **Invoice files**: 4 JPG images in `invoices/` directory
- **Scraped data**: `result.json` containing 35 products with detailed information
- **Goal**: Create a mapping between invoice items and scraped product data

## Step-by-Step Process

### 1. Initial Request
**User Prompt:**
```
Can you read the invoice pages in invoices/ and cross reference the pricing information for each item there by name with the data we have in caris-scraper-python/result.json?
```

### 2. Data Exploration Phase
**What we did:**
- Used TodoWrite tool to create a task tracking list with 4 main tasks
- Explored the `invoices/` directory structure using LS tool
- Read the `result.json` file to understand the scraped data format
- Identified 4 invoice image files: `Mr. Nelson Perez-carisdesign2025_08.07 (2)-1.jpg` through `-4.jpg`

### 3. Invoice Data Extraction
**What we did:**
- Read all 4 invoice image files using the Read tool
- Extracted pricing information from each invoice page including:
  - Product codes (e.g., HMP03, NRT01, etc.)
  - Product names as they appear on invoice
  - List prices (original prices)
  - Discount percentages (50% for all items)
  - Final discounted prices
  - Special notes (like "Long production time")

### 4. Cross-Reference Analysis
**What we did:**
- Compared invoice product codes and names with scraped data product names
- Initial analysis found 28 out of 35 items matched (80% match rate)
- Identified 7 items that appeared to be missing from scraped data

### 5. Manual Corrections
**User provided corrections:**
```
SAL 01 matches product id 1144 in the scrapped data. ZCA08 in the invoice matches product 172. Lima chair matches product 846
```

**What we did:**
- Verified the corrections by reading specific sections of result.json
- Updated the cross-reference analysis
- Improved match rate to 31 out of 35 items (88.6% match rate)

### 6. Final JSON Creation
**User Request:**
```
Now create an invoice01.json file That matches the product ids from our result to the invoice data. put it besides the result.json
```

**What we did:**
- Created `invoice01.json` with structured data including:
  - `invoiceCode`: Invoice product code
  - `productId`: Corresponding scraped data product ID (null if not found)
  - `productName`: Product name from scraped data
  - `invoiceName`: Product name as shown on invoice
  - `listPrice`: Original price before discount
  - `discount`: Discount percentage
  - `discountedPrice`: Price after discount
  - `total`: Final price with adjustments
  - `subtotal`: Subtotal amount
  - `quantity`: Number of items
  - `notes`: Special notes from invoice

## Key Findings
- **High Match Rate**: 88.6% of invoice items found in scraped data
- **Consistent Pricing**: All items had 50% discount applied
- **Missing Items**: 4 items (ALC01, TLA02, MT202, SPA01) not found in scraped data
- **Data Quality**: Strong correlation between invoice and scraped product information

## Tools Used
1. **TodoWrite**: Task tracking and progress management
2. **LS**: Directory exploration
3. **Read**: File reading for both JSON data and image files
4. **Write**: Creating final output files

## Final Output Files
- `invoice01.json`: Complete mapping between invoice and scraped data
- `invoice-mapping-recipe.md`: This documentation file

## Lessons Learned
- Manual verification is important for catching edge cases
- Image-based invoice data can be successfully extracted and structured
- Cross-referencing different data sources requires careful attention to naming variations
- Maintaining a todo list helps track complex multi-step processes

## Replication Steps
1. Place invoice images in `invoices/` directory
2. Ensure scraped data is available in `result.json`
3. Use the initial prompt to start the cross-reference process
4. Allow for manual corrections when automated matching misses items
5. Request structured JSON output for final deliverable
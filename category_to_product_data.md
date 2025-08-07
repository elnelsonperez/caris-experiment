# Category to Product Data Scraping Guide

This document outlines the complete process for scraping product data from the Caris OpenCart website, from category pages to individual product details.

## Overview

The process involves three main stages:
1. **Category Scraping**: Extract product IDs from category pages
2. **Data Consolidation**: Merge category data and remove duplicates
3. **Product Scraping**: Scrape detailed product information

## Prerequisites

- Node.js with npm
- Python with uv package manager
- Puppeteer library
- Internet connection

## Stage 1: Category Scraping

### Setup

1. **Initialize the project:**
   ```bash
   npm init -y
   npm install puppeteer
   ```

2. **Create the category scraper:**
   - File: `categories/caris-scraper.js`
   - Extracts category names and product IDs from paginated category pages
   - Uses Puppeteer with English language headers
   - Implements dual end-page detection:
     - Primary: "Your shopping cart is empty!" message
     - Fallback: Zero products found on page

### Key Features of the Category Scraper

- **Language Setting**: Sets `Accept-Language: en-US,en;q=0.9` header
- **Rate Limiting**: 500ms + random delay between requests
- **Duplicate Handling**: Uses Set to avoid duplicate product IDs within pages
- **Error Handling**: Graceful failure with detailed logging
- **Modular Design**: Can be used as CLI tool or imported as module

### Usage

```bash
# Scrape a single category
node categories/caris-scraper.js "https://www.caris.com.tr/index.php?route=product/category&path=38"

# Output: categories/output/INTERIOR_products.json
```

### URL Pattern

- Base category URL: `https://www.caris.com.tr/index.php?route=product/category&path=X`
- Pagination: Add `&page=N` parameter
- Product links contain: `product_id=XXX` parameter

### Output Format

```json
{
  "category_name": "INTERIOR",
  "product_ids": [822, 823, 824, ...]
}
```

## Stage 2: Data Consolidation

### Purpose

Category scraping produces separate JSON files per category. Many products appear in multiple categories, so consolidation is needed to:
- Create a master product-to-categories mapping
- Eliminate duplicate processing
- Generate useful statistics

### Consolidation Script

- File: `categories/consolidate-products.js`
- Reads all JSON files from output directory
- Creates product ID → categories array mapping
- Generates comprehensive statistics

### Usage

```bash
# Default consolidation
node categories/consolidate-products.js

# Custom paths
node categories/consolidate-products.js --input categories/output --output products.json
```

### Output Format

```json
{
  "products": {
    "822": ["INTERIOR", "SEATING"],
    "823": ["INTERIOR"],
    "824": ["INTERIOR", "TABLES"]
  },
  "statistics": {
    "total_products": 1250,
    "total_categories": 8,
    "products_in_multiple_categories": 45,
    "max_categories_per_product": 3,
    "category_product_counts": {
      "INTERIOR": 324,
      "SEATING": 198
    }
  },
  "generated_at": "2025-01-20T10:30:00.000Z",
  "description": "Consolidated product-to-categories mapping from Caris scraper"
}
```

## Stage 3: Product Data Scraping

### Python Scraper Integration

The final stage uses a Python script (`parallel_scraper.py`) that accepts product IDs and scrapes detailed product information.

### Wrapper Script

- File: `run-product-scraper.js`
- Reads consolidated product IDs
- Builds and executes the Python scraper command
- Supports batch processing for large datasets

### Command Structure

The Python scraper is called with:
```bash
uv run python parallel_scraper.py --output result.json 822 823 824 ...
```

### Usage

```bash
# Basic usage - scrape all products
node run-product-scraper.js

# Preview command without executing
node run-product-scraper.js --dry-run

# Custom output file
node run-product-scraper.js --output products.json

# Batch processing (100 products per batch)
node run-product-scraper.js --batch-size 100

# Custom file paths
node run-product-scraper.js --consolidated ./products.json --python-script ./scraper.py
```

### Batch Processing

For large datasets, the wrapper supports batching:
- Splits product IDs into smaller chunks
- Runs separate scraper processes
- Creates separate output files per batch
- Includes delays between batches to avoid rate limiting

## Complete Workflow

### Step-by-Step Process

1. **Setup environment:**
   ```bash
   npm install puppeteer
   ```

2. **Scrape all categories:**
   ```bash
   # Repeat for each category URL
   node categories/caris-scraper.js "https://www.caris.com.tr/index.php?route=product/category&path=38"
   node categories/caris-scraper.js "https://www.caris.com.tr/index.php?route=product/category&path=39"
   # ... etc
   ```

3. **Consolidate category data:**
   ```bash
   node categories/consolidate-products.js
   ```

4. **Scrape product details:**
   ```bash
   # Preview first
   node run-product-scraper.js --dry-run
   
   # Then run actual scraping
   node run-product-scraper.js --output final-products.json
   ```

### File Structure

```
project/
├── categories/
│   ├── caris-scraper.js           # Category scraper
│   ├── consolidate-products.js    # Data consolidation
│   └── output/                    # Category JSON files
│       ├── INTERIOR_products.json
│       ├── SEATING_products.json
│       └── ...
├── run-product-scraper.js         # Python scraper wrapper
├── parallel_scraper.py            # Python product scraper
├── consolidated-products.json     # Consolidated product mapping
├── result.json                    # Final product data
└── package.json                   # Node.js dependencies
```

## Key Considerations

### Rate Limiting

- **Category Scraper**: 500ms + random delay between pages
- **Product Scraper**: Handled by Python script
- **Batch Processing**: 2-second delays between batches

### Error Handling

- Graceful failures with detailed logging
- Dry-run mode for testing
- Progress tracking for long operations

### Data Integrity

- Duplicate detection across categories
- Validation of JSON structure
- Statistics generation for verification

### Scalability

- Batch processing for large datasets
- Modular design for easy modification
- Memory-efficient Set-based deduplication

## Troubleshooting

### Common Issues

1. **Browser language**: Ensure `Accept-Language` header is set to English
2. **Rate limiting**: Increase delays if getting blocked
3. **Memory usage**: Use batch processing for large datasets
4. **File permissions**: Ensure output directories are writable

### Debugging

- Use `--dry-run` flag to preview commands
- Check console output for detailed progress
- Verify JSON structure with `jq` or similar tools
- Monitor network requests in browser dev tools

## Future Enhancements

- **Parallel category scraping**: Run multiple category scrapers simultaneously
- **Resume capability**: Skip already processed products
- **Data validation**: Verify product data completeness
- **Monitoring**: Add progress bars and ETA calculations
- **Configuration files**: Move settings to external config files
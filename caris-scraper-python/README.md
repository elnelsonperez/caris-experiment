# Caris Scraper Python

A Python rewrite of the Caris furniture scraper using Playwright and Claude AI for dimension parsing.

## Installation

```bash
uv sync
uv run playwright install chromium
```

Dependencies are managed in `pyproject.toml` - no requirements.txt needed!

## Usage

### Single Product
```bash
# Scrape single product
uv run python cli.py 822

# Save to file
uv run python cli.py --output results.json 822

# Run with visible browser
uv run python cli.py --no-headless 822
```

### Multiple Products (Parallel)
```bash
# Scrape multiple products in parallel and save to JSON file
uv run python parallel_scraper.py --output results.json 822 820 633

# Use 8 parallel workers for faster processing
uv run python parallel_scraper.py --workers 8 --output results.json 822 820 633 641 655

# Run with visible browsers (for debugging)
uv run python parallel_scraper.py --no-headless --output results.json 822 820
```

## Features

- Scrapes product data from Caris furniture website
- Uses Claude AI to parse dimensions from images
- Clean, well-factored Python code
- Playwright for reliable browser automation
- Subprocess calls to Claude CLI for AI processing
- HTML product browser for viewing results

## Product Browser

After scraping, view results in a beautiful HTML interface:

```bash
# Update the browser with your scraped data
uv run python update_browser.py result.json

# Open product_browser.html in your browser
```

The browser shows:
- Product image galleries with navigation
- Parsed dimensions in a clean grid
- Statistics and product details
- Responsive design for mobile/desktop
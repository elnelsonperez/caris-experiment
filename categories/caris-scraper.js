const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class CarisScraper {
  constructor(options = {}) {
    this.delay = options.delay || 1000; // Default 1 second delay
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({ headless: true });
    this.page = await this.browser.newPage();
    
    // Set a user agent to avoid being blocked
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set language to English
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async extractCategoryData(categoryUrl) {
    console.log(`Starting scraping for: ${categoryUrl}`);
    
    if (!this.browser) {
      await this.init();
    }

    let categoryName = null;
    const allProductIds = new Set(); // Use Set to avoid duplicates
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const pageUrl = currentPage === 1 ? categoryUrl : `${categoryUrl}&page=${currentPage}`;
      console.log(`Scraping page ${currentPage}: ${pageUrl}`);

      try {
        await this.page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
        
        // Extract category name from first page
        if (currentPage === 1) {
          categoryName = await this.page.evaluate(() => {
            const titleElement = document.querySelector('h1.title.page-title');
            return titleElement ? titleElement.textContent.trim() : null;
          });

          if (!categoryName) {
            throw new Error('Could not extract category name');
          }
          console.log(`Category name: ${categoryName}`);
        }

        // Check if this is the end page
        const isEndPage = await this.page.evaluate(() => {
          return document.body.textContent.includes("Your shopping cart is empty!");
        });

        if (isEndPage) {
          console.log(`Reached end page at page ${currentPage} (cart empty message found)`);
          hasNextPage = false;
          break;
        }

        // Extract product IDs from current page
        const pageProductIds = await this.page.evaluate(() => {
          const productLinks = Array.from(document.querySelectorAll('a[href*="product_id"]'));
          const productIds = productLinks.map(link => {
            const match = link.href.match(/product_id=(\d+)/);
            return match ? parseInt(match[1]) : null;
          }).filter(id => id !== null);
          
          // Remove duplicates from this page
          return [...new Set(productIds)];
        });

        // Check if no products found on this page - fallback end condition
        if (pageProductIds.length === 0) {
          console.log(`Reached end page at page ${currentPage} (no products found)`);
          hasNextPage = false;
          break;
        }

        // Add to our master set
        pageProductIds.forEach(id => allProductIds.add(id));
        console.log(`Found ${pageProductIds.length} unique products on page ${currentPage}`);

        currentPage++;

        // Add random delay between requests
        await this.sleep(this.delay + Math.random() * 500);

      } catch (error) {
        console.error(`Error on page ${currentPage}:`, error.message);
        hasNextPage = false;
      }
    }

    const result = {
      category_name: categoryName,
      product_ids: Array.from(allProductIds).sort((a, b) => a - b) // Sort numerically
    };

    console.log(`Scraping complete! Found ${result.product_ids.length} unique products`);
    return result;
  }

  async saveToFile(data, outputDir = './') {
    const filename = `${data.category_name}_products.json`;
    const filepath = path.join(outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`Data saved to: ${filepath}`);
    
    return filepath;
  }

  async scrapeCategory(categoryUrl, outputDir = './output') {
    try {
      const data = await this.extractCategoryData(categoryUrl);
      const filepath = await this.saveToFile(data, outputDir);
      
      return {
        success: true,
        data,
        filepath
      };
    } catch (error) {
      console.error('Scraping failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.close();
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node caris-scraper.js <category_url>');
    console.log('Example: node caris-scraper.js "https://www.caris.com.tr/index.php?route=product/category&path=38"');
    process.exit(1);
  }

  const categoryUrl = args[0];
  const scraper = new CarisScraper({
    delay: 500 // 1 second delay between requests
  });

  const result = await scraper.scrapeCategory(categoryUrl);
  
  if (result.success) {
    console.log('\n✅ Scraping completed successfully!');
    console.log(`📁 Output file: ${result.filepath}`);
    console.log(`📊 Category: ${result.data.category_name}`);
    console.log(`🔢 Products found: ${result.data.product_ids.length}`);
  } else {
    console.log('\n❌ Scraping failed:', result.error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = CarisScraper;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
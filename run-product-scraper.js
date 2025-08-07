const fs = require('fs').promises;
const { spawn } = require('child_process');
const path = require('path');

class ProductScraperRunner {
  constructor(options = {}) {
    this.consolidatedFile = options.consolidatedFile || './categories/consolidated-products.json';
    this.outputFile = options.outputFile || './result.json';
    this.pythonScript = options.pythonScript || './parallel_scraper.py';
    this.batchSize = options.batchSize || null; // null means all at once
    this.dryRun = options.dryRun || false;
  }

  async loadProductIds() {
    try {
      console.log(`📖 Reading consolidated products from: ${this.consolidatedFile}`);
      const content = await fs.readFile(this.consolidatedFile, 'utf8');
      const data = JSON.parse(content);
      
      if (!data.products || typeof data.products !== 'object') {
        throw new Error('Invalid consolidated products file format');
      }
      
      const productIds = Object.keys(data.products).map(id => parseInt(id)).filter(id => !isNaN(id));
      
      console.log(`✓ Found ${productIds.length} unique product IDs`);
      
      if (data.statistics) {
        console.log(`  └─ From ${data.statistics.total_categories} categories`);
        console.log(`  └─ ${data.statistics.products_in_multiple_categories} products in multiple categories`);
      }
      
      return productIds.sort((a, b) => a - b);
    } catch (error) {
      throw new Error(`Failed to load product IDs: ${error.message}`);
    }
  }

  buildScraperCommand(productIds, outputFile) {
    const command = 'uv';
    const args = [
      'run',
      'python',
      this.pythonScript,
      '--output',
      outputFile,
      ...productIds.map(id => id.toString())
    ];
    
    return { command, args };
  }

  async runScraper(productIds, outputFile) {
    const { command, args } = this.buildScraperCommand(productIds, outputFile);
    
    console.log(`🚀 Running scraper with ${productIds.length} product IDs...`);
    console.log(`📁 Output file: ${outputFile}`);
    
    if (this.dryRun) {
      console.log('\n🔍 DRY RUN - Command that would be executed:');
      console.log(`${command} ${args.join(' ')}`);
      console.log(`\n📊 First 10 product IDs: ${productIds.slice(0, 10).join(', ')}`);
      if (productIds.length > 10) {
        console.log(`   ... and ${productIds.length - 10} more`);
      }
      return { success: true, dryRun: true };
    }
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const process = spawn(command, args, { stdio: 'inherit' });
      
      process.on('close', (code) => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        if (code === 0) {
          console.log(`\n✅ Scraper completed successfully in ${duration}s`);
          resolve({ success: true, code, duration });
        } else {
          console.log(`\n❌ Scraper failed with exit code ${code} after ${duration}s`);
          resolve({ success: false, code, duration });
        }
      });
      
      process.on('error', (error) => {
        console.error(`\n💥 Failed to start scraper: ${error.message}`);
        resolve({ success: false, error: error.message });
      });
    });
  }

  async runInBatches(productIds) {
    console.log(`🔄 Running in batches of ${this.batchSize} products`);
    
    const results = [];
    const totalBatches = Math.ceil(productIds.length / this.batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * this.batchSize;
      const end = Math.min(start + this.batchSize, productIds.length);
      const batch = productIds.slice(start, end);
      
      const batchOutputFile = `${this.outputFile.replace('.json', '')}_batch_${i + 1}.json`;
      
      console.log(`\n📦 Batch ${i + 1}/${totalBatches}: Products ${start + 1}-${end} (${batch.length} items)`);
      
      const result = await this.runScraper(batch, batchOutputFile);
      results.push({
        batch: i + 1,
        productIds: batch,
        outputFile: batchOutputFile,
        ...result
      });
      
      if (!result.success && !this.dryRun) {
        console.log(`❌ Stopping batch processing due to failure in batch ${i + 1}`);
        break;
      }
      
      // Small delay between batches
      if (i < totalBatches - 1 && !this.dryRun) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  async run() {
    try {
      const productIds = await this.loadProductIds();
      
      if (productIds.length === 0) {
        throw new Error('No product IDs found to scrape');
      }
      
      let results;
      
      if (this.batchSize && productIds.length > this.batchSize) {
        results = await this.runInBatches(productIds);
      } else {
        const result = await this.runScraper(productIds, this.outputFile);
        results = [result];
      }
      
      return {
        success: results.every(r => r.success),
        totalProducts: productIds.length,
        results
      };
      
    } catch (error) {
      console.error(`\n💥 Runner failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--consolidated':
      case '-c':
        options.consolidatedFile = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputFile = args[++i];
        break;
      case '--python-script':
      case '-p':
        options.pythonScript = args[++i];
        break;
      case '--batch-size':
      case '-b':
        options.batchSize = parseInt(args[++i]);
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log('Usage: node run-product-scraper.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  -c, --consolidated <file>    Consolidated products JSON file (default: ./categories/consolidated-products.json)');
        console.log('  -o, --output <file>          Output file for scraper (default: ./result.json)');
        console.log('  -p, --python-script <file>   Python scraper script path (default: ./parallel_scraper.py)');
        console.log('  -b, --batch-size <num>       Run in batches of N products (default: all at once)');
        console.log('  -d, --dry-run               Show command without executing');
        console.log('  -h, --help                  Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  node run-product-scraper.js');
        console.log('  node run-product-scraper.js --output products.json');
        console.log('  node run-product-scraper.js --batch-size 100');
        console.log('  node run-product-scraper.js --dry-run');
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }
  
  const runner = new ProductScraperRunner(options);
  const result = await runner.run();
  
  if (result.success) {
    if (!options.dryRun) {
      console.log('\n🎉 All scraping completed successfully!');
      console.log(`📊 Total products processed: ${result.totalProducts}`);
    }
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Export for use as module
module.exports = ProductScraperRunner;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
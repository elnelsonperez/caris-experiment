const fs = require('fs').promises;

class CategoryProductUpdater {
  constructor(options = {}) {
    this.consolidatedFile = options.consolidatedFile || './consolidated-products.json';
    this.categoriesOutputFile = options.categoriesOutputFile || './../frontend/src/data/categories.json';
    this.productsInputFile = options.productsInputFile || './productsraw.json';
    this.productsOutputFile = options.productsOutputFile || './../frontend/src/data/products.json';
    this.categoryIdMap = new Map();
    this.productCategoryMap = new Map();
  }

  async loadConsolidatedData() {
    try {
      console.log(`📖 Reading consolidated data from: ${this.consolidatedFile}`);
      const content = await fs.readFile(this.consolidatedFile, 'utf8');
      const data = JSON.parse(content);
      
      if (!data.products || typeof data.products !== 'object') {
        throw new Error('Invalid consolidated products file format');
      }
      
      // Extract unique categories and create ID mappings
      const categoryNames = new Set();
      
      Object.values(data.products).forEach(categories => {
        if (Array.isArray(categories)) {
          categories.forEach(cat => categoryNames.add(cat));
        }
      });
      
      // Create category ID mappings
      let categoryId = 1;
      categoryNames.forEach(name => {
        this.categoryIdMap.set(name, categoryId++);
      });
      
      // Create product to category IDs mapping
      Object.entries(data.products).forEach(([productId, categoryNames]) => {
        const categoryIds = categoryNames.map(name => this.categoryIdMap.get(name));
        this.productCategoryMap.set(productId, categoryIds);
      });
      
      console.log(`✓ Found ${categoryNames.size} unique categories`);
      console.log(`✓ Found ${Object.keys(data.products).length} products with category mappings`);
      
      return data.statistics;
    } catch (error) {
      throw new Error(`Failed to load consolidated data: ${error.message}`);
    }
  }

  async createCategoriesFile() {
    try {
      console.log(`📝 Creating categories file: ${this.categoriesOutputFile}`);
      
      const categories = Array.from(this.categoryIdMap.entries()).map(([name, id]) => ({
        id,
        name
      })).sort((a, b) => a.id - b.id);
      
      const categoriesData = {
        categories,
        generated_at: new Date().toISOString(),
        description: "Category ID mappings generated from consolidated product data"
      };
      
      await fs.writeFile(
        this.categoriesOutputFile, 
        JSON.stringify(categoriesData, null, 2)
      );
      
      console.log(`✅ Categories file created with ${categories.length} categories`);
      categories.forEach(cat => {
        console.log(`  └─ ${cat.id}: ${cat.name}`);
      });
      
      return categories;
    } catch (error) {
      throw new Error(`Failed to create categories file: ${error.message}`);
    }
  }

  async updateProductsFile() {
    try {
      console.log(`📖 Reading products file: ${this.productsInputFile}`);
      
      const content = await fs.readFile(this.productsInputFile, 'utf8');
      const products = JSON.parse(content);
      
      if (!Array.isArray(products)) {
        throw new Error('Products file should contain an array of products');
      }
      
      console.log(`🔄 Updating ${products.length} products with category information...`);
      
      let updatedCount = 0;
      
      products.forEach((product, index) => {
        const categoryIds = this.productCategoryMap.get(product.productId);
        if (categoryIds && categoryIds.length > 0) {
          product.categoryIds = categoryIds;
          updatedCount++;
        } else {
          product.categoryIds = [];
        }
        
        // Progress update every 100 products
        if ((index + 1) % 100 === 0) {
          console.log(`  └─ Processed ${index + 1}/${products.length} products`);
        }
      });
      
      console.log(`💾 Writing updated products to: ${this.productsOutputFile}`);
      await fs.writeFile(
        this.productsOutputFile, 
        JSON.stringify(products, null, 2)
      );
      
      console.log(`✅ Product update complete!`);
      console.log(`  └─ Total products: ${products.length}`);
      console.log(`  └─ Products updated with categories: ${updatedCount}`);
      console.log(`  └─ Products without categories: ${products.length - updatedCount}`);
      
      return { productCount: products.length, updatedCount };
    } catch (error) {
      throw error;
    }
  }

  async run() {
    try {
      // Load consolidated data and create mappings
      const stats = await this.loadConsolidatedData();
      
      // Create categories.json
      const categories = await this.createCategoriesFile();
      
      // Update products file
      const result = await this.updateProductsFile();
      
      return {
        success: true,
        categories: categories.length,
        ...result,
        statistics: stats
      };
    } catch (error) {
      console.error(`\n💥 Update failed: ${error.message}`);
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
      case '--categories-output':
      case '-co':
        options.categoriesOutputFile = args[++i];
        break;
      case '--products-input':
      case '-pi':
        options.productsInputFile = args[++i];
        break;
      case '--products-output':
      case '-po':
        options.productsOutputFile = args[++i];
        break;
      case '--help':
      case '-h':
        console.log('Usage: node create-categories-and-update-products.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  -c, --consolidated <file>      Consolidated products JSON file (default: ./consolidated-products.json)');
        console.log('  -co, --categories-output <file> Categories output file (default: ./categories.json)');
        console.log('  -pi, --products-input <file>   Input products JSON file (default: ../caris-scraper-python/products.json)');
        console.log('  -po, --products-output <file>  Output products JSON file (default: ./products-with-categories.json)');
        console.log('  -h, --help                     Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  node create-categories-and-update-products.js');
        console.log('  node create-categories-and-update-products.js --products-input ./products.json');
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }
  
  const updater = new CategoryProductUpdater(options);
  const result = await updater.run();
  
  if (result.success) {
    console.log('\n🎉 Category and product update completed successfully!');
    console.log(`📊 Categories created: ${result.categories}`);
    console.log(`📊 Products processed: ${result.productCount}`);
    console.log(`📊 Products with categories: ${result.updatedCount}`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Export for use as module
module.exports = CategoryProductUpdater;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
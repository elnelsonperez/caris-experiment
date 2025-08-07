const express = require('express')
const cors = require('cors')
const fs = require('fs').promises
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Path to the settings file
const SETTINGS_FILE_PATH = path.join(__dirname, '..', 'frontend', 'src', 'data', 'product_settings.json')

// Default settings structure
const DEFAULT_SETTINGS = {
  blacklistedImages: []
}

// Helper function to ensure settings file exists
async function ensureSettingsFile() {
  try {
    await fs.access(SETTINGS_FILE_PATH)
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with default settings
      await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2))
      console.log('Created product_settings.json with default settings')
    } else {
      throw error
    }
  }
}

// API Routes

// GET /api/settings - Get current settings
app.get('/api/settings', async (req, res) => {
  try {
    await ensureSettingsFile()
    const data = await fs.readFile(SETTINGS_FILE_PATH, 'utf8')
    const settings = JSON.parse(data)
    res.json(settings)
  } catch (error) {
    console.error('Error reading settings:', error)
    res.status(500).json({ 
      error: 'Failed to read settings',
      details: error.message 
    })
  }
})

// POST /api/settings - Save updated settings
app.post('/api/settings', async (req, res) => {
  try {
    const { blacklistedImages } = req.body
    
    // Validate input
    if (!Array.isArray(blacklistedImages)) {
      return res.status(400).json({
        error: 'blacklistedImages must be an array'
      })
    }
    
    // Validate that all items are strings (URLs)
    const invalidItems = blacklistedImages.filter(item => typeof item !== 'string')
    if (invalidItems.length > 0) {
      return res.status(400).json({
        error: 'All blacklisted images must be valid URL strings',
        invalidItems
      })
    }
    
    // Load current settings to merge with new data
    await ensureSettingsFile()
    const currentData = await fs.readFile(SETTINGS_FILE_PATH, 'utf8')
    const currentSettings = JSON.parse(currentData)
    
    // Update settings
    const updatedSettings = {
      ...currentSettings,
      blacklistedImages: [...new Set(blacklistedImages)] // Remove duplicates
    }
    
    // Save to file
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(updatedSettings, null, 2))
    
    console.log(`Updated settings with ${blacklistedImages.length} blacklisted images`)
    
    res.json({
      success: true,
      message: 'Settings saved successfully',
      blacklistedCount: updatedSettings.blacklistedImages.length
    })
    
  } catch (error) {
    console.error('Error saving settings:', error)
    res.status(500).json({ 
      error: 'Failed to save settings',
      details: error.message 
    })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    settingsFile: SETTINGS_FILE_PATH
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl
  })
})

// Start server
async function startServer() {
  try {
    await ensureSettingsFile()
    app.listen(PORT, () => {
      console.log(`Data management server running on port ${PORT}`)
      console.log(`Settings file: ${SETTINGS_FILE_PATH}`)
      console.log(`Health check: http://localhost:${PORT}/api/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
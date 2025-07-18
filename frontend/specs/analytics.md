# Order Analytics Implementation Specification

## Overview
Create a comprehensive business analytics dashboard that helps evaluate order profitability, break-even analysis, and revenue targets. The analytics work with the active order to provide real-time business insights with educational explanations.

## Core Requirements

### 1. Data Sources
- **Active Order**: Pull retail prices, margins, and product data
- **User Inputs**: Business metrics stored in localStorage
- **Calculations**: Dynamic computations with explanations

### 2. Business Metrics to Track
- Break-even analysis (units needed to cover fixed costs)
- Revenue targets vs. actual projections
- Launch investment recovery timeline
- Profitability per unit and per time period
- Required sales velocity (units per week/month)

## Component Architecture

### Main Component: `OrderAnalytics.vue`
**Location**: `/src/components/OrderAnalytics.vue`
**Purpose**: Main analytics dashboard with all calculations and explanations

### Analytics Store: `analytics.js`
**Location**: `/src/stores/analytics.js`
**Purpose**: Manage business settings and localStorage persistence

### Route Integration
**Location**: Add to `/src/router/index.js`
**Route**: `/analytics`
**Navigation**: Add to main navigation menu

## Data Structure

### localStorage Key: `business_analytics`
```javascript
{
  fixedCosts: 10000,           // Monthly fixed costs (EUR)
  targetRevenue: 50000,        // Monthly revenue target (EUR)
  launchInvestment: 25000,     // One-time setup costs (EUR)
  recoveryPeriod: 12,          // Months to recover launch investment
  expectedVolume: 1000,        // Expected units to sell in recovery period
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

### Computed Analytics Data
```javascript
{
  // From active order
  activeOrder: Order,
  retailPricePerUnit: number,
  landedCostPerUnit: number,
  profitPerUnit: number,
  retailMarginPercent: number,
  
  // Calculated metrics
  launchCostPerUnit: number,
  trueProfitPerUnit: number,
  breakEvenUnits: number,
  targetUnits: number,
  unitsPerWeek: number,
  unitsPerDay: number,
  
  // Time-based projections
  monthlyProfit: number,
  timeToBreakEven: number,
  roi: number
}
```

## UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│ Order Analytics Dashboard                           │
├─────────────────────────────────────────────────────┤
│ Active Order Context                                │
│ ┌─────────────────┐ ┌─────────────────┐            │
│ │ Order: Sample   │ │ Retail Margin:  │            │
│ │ Items: 15       │ │ 30%             │            │
│ └─────────────────┘ └─────────────────┘            │
├─────────────────────────────────────────────────────┤
│ Business Settings                                   │
│ ┌─────────────────┐ ┌─────────────────┐            │
│ │ Fixed Costs     │ │ Target Revenue  │            │
│ │ €10,000/month   │ │ €50,000/month   │            │
│ └─────────────────┘ └─────────────────┘            │
│ ┌─────────────────┐ ┌─────────────────┐            │
│ │ Launch Investment│ │ Recovery Period │            │
│ │ €25,000         │ │ 12 months       │            │
│ └─────────────────┘ └─────────────────┘            │
├─────────────────────────────────────────────────────┤
│ Key Metrics (with explanations)                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Break-even: 1,111 units/month                   │ │
│ │ ℹ️ Fixed Costs (€10,000) ÷ Profit per Unit (€9)│ │
│ │ 💡 Units needed to cover fixed expenses         │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Detailed Analysis Table                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Metric          │ Value    │ Explanation         │ │
│ │ Retail Price    │ €200     │ From active order   │ │
│ │ Landed Cost     │ €160     │ Base + overhead     │ │
│ │ Launch Cost     │ €25      │ Investment ÷ volume │ │
│ │ True Profit     │ €15      │ After all costs     │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Visual Indicators
- **Green**: Profitable scenarios, achievable targets
- **Yellow**: Marginal profitability, requires attention
- **Red**: Unprofitable or unrealistic targets
- **Info icons**: Hover tooltips with detailed explanations

## Implementation Steps

### Phase 1: Core Infrastructure
1. **Create analytics store** (`/src/stores/analytics.js`)
   - localStorage persistence
   - Reactive business settings
   - Computed metrics

2. **Create base component** (`/src/components/OrderAnalytics.vue`)
   - Basic layout and structure
   - Connect to analytics store
   - Active order integration

3. **Add routing**
   - Register analytics route
   - Add navigation menu item

### Phase 2: Business Logic
1. **Implement calculations**
   - Break-even analysis
   - Revenue projections
   - Launch cost amortization
   - Profitability metrics

2. **Add explanations system**
   - Calculation descriptions
   - Business context explanations
   - Tooltips and help text

### Phase 3: UI/UX
1. **Design input forms**
   - Business settings form
   - Validation and error handling
   - Real-time updates

2. **Create metrics display**
   - Key metrics cards
   - Detailed analysis table
   - Visual indicators (colors, icons)

3. **Add educational content**
   - Explanation tooltips
   - Help sections
   - Business terminology definitions

### Phase 4: Advanced Features
1. **Scenario planning**
   - Multiple "what-if" scenarios
   - Comparison tables
   - Save/load scenarios

2. **Export capabilities**
   - Print analytics report
   - Export to CSV/PDF
   - Share analytics snapshot

## Technical Implementation Details

### Analytics Store Structure
```javascript
// /src/stores/analytics.js
export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    settings: {
      fixedCosts: 0,
      targetRevenue: 0,
      launchInvestment: 0,
      recoveryPeriod: 12,
      expectedVolume: 0
    }
  }),
  
  getters: {
    // Connect to active order
    activeOrder: (state) => {
      const ordersStore = useOrdersStore()
      return ordersStore.activeOrder
    },
    
    // Calculate metrics
    profitPerUnit: (state) => {
      if (!state.activeOrder) return 0
      return state.retailPricePerUnit - state.landedCostPerUnit
    },
    
    breakEvenUnits: (state) => {
      if (state.profitPerUnit <= 0) return Infinity
      return Math.ceil(state.settings.fixedCosts / state.profitPerUnit)
    }
  },
  
  actions: {
    updateSettings(newSettings) {
      Object.assign(this.settings, newSettings)
      this.saveToStorage()
    },
    
    loadFromStorage() {
      const saved = localStorage.getItem('business_analytics')
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) }
      }
    },
    
    saveToStorage() {
      localStorage.setItem('business_analytics', JSON.stringify({
        ...this.settings,
        lastUpdated: new Date().toISOString()
      }))
    }
  }
})
```

### Key Calculations
```javascript
// Break-even analysis
breakEvenUnits = fixedCosts / profitPerUnit

// Target analysis
targetUnits = targetRevenue / retailPricePerUnit

// Launch cost amortization
launchCostPerUnit = launchInvestment / expectedVolume

// True profit (including launch costs)
trueProfitPerUnit = profitPerUnit - launchCostPerUnit

// Time-based metrics
unitsPerWeek = monthlyTarget / 4.33
unitsPerDay = monthlyTarget / 30
```

### Educational Explanations
```javascript
const explanations = {
  breakEven: {
    title: "Break-even Analysis",
    formula: "Fixed Costs ÷ Profit per Unit",
    meaning: "The number of units you must sell to cover your fixed expenses (rent, salaries, utilities) before making any profit.",
    example: "If you have €10,000 in fixed costs and make €9 profit per chair, you need to sell 1,111 chairs just to break even."
  },
  
  launchCost: {
    title: "Launch Cost per Unit",
    formula: "Launch Investment ÷ Expected Volume",
    meaning: "The showroom setup and initial marketing costs spread across each unit sold.",
    example: "A €25,000 showroom setup over 1,000 expected chairs = €25 per chair."
  }
}
```

## Error Handling & Edge Cases

### Data Validation
- **Negative values**: Prevent negative inputs for costs and targets
- **Missing active order**: Show helpful message to set active order
- **Zero profit margins**: Handle division by zero gracefully
- **Unrealistic targets**: Warn when targets require impossible sales volumes

### Fallback States
- **No active order**: Display placeholder with call-to-action
- **Invalid data**: Show error messages with correction guidance
- **Missing localStorage**: Initialize with default values

## Testing Strategy

### Unit Tests
- Analytics store calculations
- Input validation
- localStorage persistence
- Error handling

### Integration Tests
- Active order integration
- Real-time updates
- Cross-component communication

### User Testing
- Business metric accuracy
- Explanation clarity
- Workflow usability

## Performance Considerations

### Optimization
- **Computed properties**: Cache expensive calculations
- **Debounced inputs**: Prevent excessive recalculations
- **Lazy loading**: Load analytics only when needed

### Memory Management
- **Reactive cleanup**: Proper store cleanup
- **Event listeners**: Remove listeners on component unmount

## Accessibility

### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy
- **ARIA labels**: Descriptive labels for complex calculations
- **Alt text**: Meaningful descriptions for visual indicators

### Keyboard Navigation
- **Tab order**: Logical navigation flow
- **Focus management**: Clear focus indicators
- **Keyboard shortcuts**: Quick access to key functions

## Future Enhancements

### Advanced Analytics
- **Trend analysis**: Track metrics over time
- **Seasonal adjustments**: Account for seasonal sales patterns
- **Market comparison**: Compare against industry benchmarks

### Integration Features
- **CRM integration**: Connect with customer data
- **Inventory sync**: Real-time stock level consideration
- **Financial reporting**: Export to accounting software

### Mobile Optimization
- **Responsive design**: Mobile-first analytics
- **Touch interactions**: Optimized for mobile use
- **Offline capability**: Cache analytics for offline viewing

## Success Metrics

### Technical Success
- **Load time**: Analytics page loads in <2 seconds
- **Responsiveness**: Real-time updates on input changes
- **Accuracy**: 100% calculation accuracy vs. manual verification

### Business Success
- **User adoption**: Regular use of analytics page
- **Decision impact**: Analytics influence pricing/ordering decisions
- **Business outcomes**: Improved profitability through better planning

## Conclusion

This analytics implementation provides a comprehensive business intelligence tool that transforms raw order data into actionable insights. By combining real-time calculations with educational explanations, it empowers users to make informed decisions about pricing, inventory, and business strategy.

The modular design allows for future enhancements while maintaining simplicity and usability. The integration with the existing order system ensures data consistency and provides a seamless user experience.
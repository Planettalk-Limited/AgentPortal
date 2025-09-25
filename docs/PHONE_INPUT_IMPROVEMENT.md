# Phone Number Input Improvement

## Overview
Updated the referral landing page to use the same professional phone number input component that's used in the airtime top-up flow, providing consistency and better user experience.

## Changes Made

### 🆕 **Created Reusable PhoneNumberInput Component**
**File**: `src/components/PhoneNumberInput.tsx`

**Features:**
- ✅ **Country Code Selector**: Dropdown with flags and country names
- ✅ **Searchable Countries**: Type to find countries quickly
- ✅ **Popular Countries First**: Zimbabwe, Kenya, South Africa, Nigeria, etc. at top
- ✅ **Theme Consistent**: Uses proper PlanetTalk colors (`pt-turquoise`, `pt-light-gray-*`)
- ✅ **Full Phone Number Display**: Shows complete international format
- ✅ **Input Validation**: Only allows numeric characters
- ✅ **Automatic Zero Removal**: Removes leading zeros from local numbers
- ✅ **Click Outside to Close**: Dropdown closes when clicking elsewhere
- ✅ **Keyboard Accessible**: Proper focus management and navigation

### 📱 **Phone Input Features**

#### Country Selection
```typescript
// Visual country dropdown
🇿🇼 +263 Zimbabwe
🇰🇪 +254 Kenya  
🇿🇦 +27 South Africa
🇳🇬 +234 Nigeria
// ... and 200+ more countries
```

#### User Experience
- **Search functionality**: Type "Kenya" to find `🇰🇪 +254`
- **Visual feedback**: Selected country highlighted in turquoise
- **Full number preview**: Shows `+263771234567` below input
- **Smart formatting**: Removes leading zeros automatically

#### Theme Integration
```css
/* Consistent with PlanetTalk theme */
border-pt-light-gray-300
bg-pt-light-gray-50
hover:bg-pt-light-gray-100
focus:ring-pt-turquoise
text-pt-dark-gray
```

### 🔄 **Updated Referral Page**
**File**: `src/app/[locale]/referral/[code]/page.tsx`

#### Before (Simple Text Input)
```typescript
<input
  type="tel"
  placeholder="Enter your phone number"
  className="w-full px-4 py-3..."
/>
```

#### After (Professional Phone Input)
```typescript
<PhoneNumberInput
  label="Phone Number"
  value={formData.referredUserPhone}
  onChange={(fullPhoneNumber) => {
    setFormData((prev) => ({ ...prev, referredUserPhone: fullPhoneNumber }))
  }}
  required
  placeholder="771234567"
  showFullNumber={true}
/>
```

### 🎯 **Component Props**

```typescript
interface PhoneNumberInputProps {
  value: string                    // Current phone number value
  onChange: (fullPhoneNumber: string) => void  // Callback with full international number
  countryCode?: string            // Initial country code (default: +263)
  onCountryCodeChange?: (countryCode: string) => void  // Country change callback
  placeholder?: string            // Placeholder for number input
  required?: boolean              // Whether field is required
  className?: string              // Additional CSS classes
  label?: string                  // Input label text
  showFullNumber?: boolean        // Show full number preview
}
```

### 📍 **Usage Examples**

#### Basic Usage
```typescript
<PhoneNumberInput
  value={phoneNumber}
  onChange={setPhoneNumber}
/>
```

#### Advanced Usage
```typescript
<PhoneNumberInput
  label="Mobile Number"
  value={formData.phone}
  onChange={(phone) => setFormData(prev => ({...prev, phone}))}
  countryCode="+27"
  required
  placeholder="123456789"
  showFullNumber={true}
  className="mb-4"
/>
```

### 🌍 **Country Support**

#### Popular Countries (Top of List)
- 🇿🇼 Zimbabwe (+263)
- 🇰🇪 Kenya (+254) 
- 🇿🇦 South Africa (+27)
- 🇳🇬 Nigeria (+234)
- 🇬🇭 Ghana (+233)
- 🇺🇬 Uganda (+256)
- 🇹🇿 Tanzania (+255)
- 🇿🇲 Zambia (+260)
- 🇲🇼 Malawi (+265)
- 🇧🇼 Botswana (+267)

#### Complete Coverage
- **200+ countries** supported
- **Alphabetical ordering** after popular countries
- **Flag emojis** for visual identification
- **Searchable** by country name or code

### ✨ **User Experience Improvements**

#### For Customers
- **Familiar Interface**: Same as airtime top-up flow
- **Visual Country Selection**: Flags make it easy to find countries
- **Search Functionality**: Quick country lookup
- **Clear Validation**: Full number preview shows what will be submitted
- **Mobile Optimized**: Touch-friendly dropdown and inputs

#### For Consistency
- **Same Component**: Used across airtime top-up and referral flows
- **Theme Alignment**: Consistent colors and styling
- **Validation Logic**: Same phone number processing rules
- **Error Handling**: Consistent feedback patterns

### 🎉 **Result**

The referral page now has:
- ✅ **Professional phone input** with country selection
- ✅ **Visual consistency** with airtime top-up flow  
- ✅ **Better user experience** with searchable countries
- ✅ **Proper validation** with full international format
- ✅ **Theme consistency** using PlanetTalk colors
- ✅ **Mobile optimization** for touch interaction

Perfect for international customers who need to select their country and enter their phone number for airtime top-ups! 📱🌍

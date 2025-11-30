# Handling NULL Values in API Filters with Ant Design

Documentation for properly handling `null` filter values that need to be explicitly sent to the API whilst displaying user-friendly labels in Ant Design Select components.

---

## 🎯 The Problem

You need a filter with an "All" option that:
- Displays **"All"** as a user-friendly label in the Select
- Sends **`null`** explicitly to the API as a filter parameter (e.g., `culture=null`)
- Persists correctly in the URL and survives page refreshes (F5)
- Works with Refine's `syncWithLocation` and data providers

**❌ What DOESN'T work:**

1. **Using JSON `null` as the option value**
   ```typescript
   { value: null, label: 'All' } // ❌ Ant Design can't match null values
   ```

2. **Using `undefined` as the option value**
   ```typescript
   { value: undefined, label: 'All' } // ❌ Select becomes empty
   ```

3. **Sending JSON `null` in CrudFilters**
   ```typescript
   value: null // ❌ Data providers filter out null/undefined values
   ```

4. **Complex sentinel value conversions**
   ```typescript
   value: '__ALL__' // ❌ Too many conversions, source of bugs
   ```

## ✅ The Solution (Battle-tested)

**Use the string `"null"` as the form value**, which represents "All" for the user and is sent explicitly to the API.

### Architecture Overview

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  Select UI       │     │  Form State       │     │  API Call        │
│                  │     │                   │     │                  │
│  value: "null"   │ ──▶ │  culture: "null"  │ ──▶ │  culture=null    │
│  display: "All"  │     │                   │     │  (string param)  │
└──────────────────┘     └───────────────────┘     └──────────────────┘
```

**🔑 Key principle:** The string `"null"` is used throughout the form state and sent as-is to the API, whilst Ant Design displays the corresponding label "All".

---

## 📝 Step-by-Step Implementation

### Step 1: Define the Constant and Options

```typescript
// constants/filterOptions.ts

// The value representing "All" in the form
export const CULTURE_ALL_VALUE = 'null'; // String "null"

export const cultureOptions = [
  { value: 'null', label: 'All' },     // ← String "null" displays as "All"
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'nl', label: 'Dutch' },
];
```

**🔑 Key point:** The option with `value: 'null'` (string) and `label: 'All'` allows Ant Design to display "All" when the form value is `"null"`.

### Step 2: Use Options in the Select Component

```typescript
// components/filters/BasicFilters.tsx

<Form.Item label="Language" name="culture">
  <Select>
    {cultureOptions.map((option, index) => (
      <Select.Option key={`culture-${index}`} value={option.value}>
        {option.label}
      </Select.Option>
    ))}
  </Select>
</Form.Item>
```

**⚠️ Important:** Don't use `option.value` as the React key if the value can be `null` or `"null"`. Use an index or composite key instead.

### Step 3: Define Default Form Values

```typescript
// utils/filterConverters.ts

export const getDefaultFormValues = () => {
  return {
    culture: CULTURE_ALL_VALUE, // String "null"
    // other fields...
  };
};
```

### Step 4: Convert to API Filters (CrudFilters)

```typescript
// utils/filterConverters.ts

export const convertFormValuesToCrudFilters = (formValues) => {
  const filters = [];

  if (formValues.culture !== undefined) {
    filters.push({
      field: "culture",
      operator: "eq",
      // String "null" is sent as-is to the API
      value: formValues.culture, // "null" or "en", "fr", etc.
    });
  }

  return filters;
};
```

**🔑 Key point:** No conversion needed! The string `"null"` is sent directly to the API as a query parameter.

### Step 5: Convert from API/URL (Normalisation)

```typescript
// utils/filterConverters.ts

export const convertCrudFiltersToFormValues = (filters) => {
  const formValues = {};

  const normaliseCultureValue = (value) => {
    // Normalise all forms of "null" to the string "null"
    if (value === "null" || value === null || value === undefined) {
      return CULTURE_ALL_VALUE; // String "null"
    }
    return value;
  };

  filters.forEach((filter) => {
    if (filter.field === "culture") {
      formValues.culture = normaliseCultureValue(filter.value);
    }
  });

  // Guarantee a default value
  if (formValues.culture === undefined) {
    formValues.culture = CULTURE_ALL_VALUE;
  }

  return formValues;
};
```

**🔑 Key point:** Normalisation handles all cases (JSON `null`, string `"null"`, `undefined`) and converts them to the string `"null"` for the form.

### Step 6: Defensive Protection in Hooks

```typescript
// hooks/useMyFilters.ts

useEffect(() => {
  if (!initialLoadRef.current && filters && form) {
    const formValues = convertCrudFiltersToFormValues(filters);

    // DEFENSIVE: Ensure culture always has a value
    if (formValues.culture === null || formValues.culture === undefined) {
      formValues.culture = CULTURE_ALL_VALUE; // String "null"
    }

    form.setFieldsValue(formValues);
    initialLoadRef.current = true;
  }
}, [filters, form]);
```

**🔑 Key point:** This protection ensures that even if something goes wrong, the form will always have a valid value.

---

## 🎯 Expected Results

- ✅ Select displays **"All"** (never "null" as text)
- ✅ API receives **`culture=null`** (string in URL query params)
- ✅ Works on initial page load
- ✅ Works after page refresh (F5)
- ✅ Works after manual URL modification
- ✅ Persists correctly with `syncWithLocation`
- ✅ Compatible with Refine data providers

---

## ⚠️ Common Pitfalls to Avoid

### ❌ Pitfall 1: Using JSON `null` Instead of String `"null"`

```typescript
// ❌ WRONG
{ value: null, label: 'All' }

// ✅ CORRECT
{ value: 'null', label: 'All' }
```

**Why?** Ant Design cannot match JSON `null` with a Select option.

### ❌ Pitfall 2: Sending JSON `null` in CrudFilters

```typescript
// ❌ WRONG
filters.push({
  field: "culture",
  value: null, // JSON null is ignored by data providers
});

// ✅ CORRECT
filters.push({
  field: "culture",
  value: "null", // String "null" is sent to the API
});
```

**Why?** Data providers typically filter out `null`/`undefined` values and don't include them in API query parameters.

### ❌ Pitfall 3: Forgetting Normalisation

```typescript
// ❌ WRONG - No normalisation
formValues.culture = filter.value; // Could be null, "null", undefined...

// ✅ CORRECT - With normalisation
formValues.culture = normaliseCultureValue(filter.value);
```

**Why?** Values can come from different sources (URL, API, defaults) with different formats.

### ❌ Pitfall 4: Using Value as React Key

```typescript
// ❌ WRONG
<Select.Option key={option.value} value={option.value}>

// ✅ CORRECT
<Select.Option key={`culture-${index}`} value={option.value}>
```

**Why?** React keys must be unique and stable. `null` or `"null"` can cause issues.

---

## 📚 Reference Implementation

See the complete implementation in the **EnquiryFilterStats** feature:

- `src/features/enquiry-filter-stats/constants/filterOptions.ts`
- `src/features/enquiry-filter-stats/components/filters/BasicFilters.tsx`
- `src/features/enquiry-filter-stats/utils/filterConverters.ts`
- `src/features/enquiry-filter-stats/hooks/useFilterStatsFilters.ts`

---

## 🔄 Reusable Pattern Checklist

To implement this pattern for other filters with "All" → `null`:

1. ✅ Create a constant: `export const MY_FIELD_ALL_VALUE = 'null';`
2. ✅ Define options with `{ value: 'null', label: 'All' }`
3. ✅ Use the string `"null"` throughout the form state
4. ✅ Send the string `"null"` to the API (interpreted as a parameter)
5. ✅ Normalise incoming values to the string `"null"`
6. ✅ Add defensive protection in hooks

**That's it!** No complex conversions, no custom sentinel values.

---

## 🧪 Testing Checklist

When implementing this pattern, verify:

- [ ] Select displays "All" on initial load
- [ ] Select displays "All" after selecting and coming back
- [ ] Select displays "All" after page refresh (F5)
- [ ] Select displays "All" after manual URL change (e.g., adding `?culture=null`)
- [ ] API receives `culture=null` in query string
- [ ] URL contains `culture=null` (or encoded equivalent)
- [ ] No console errors or warnings
- [ ] Form validation works correctly
- [ ] Reset button restores "All" as the default

---

## 💡 Why This Works

The solution works because:

1. **Ant Design Select** matches form values to options by comparing `value` props
2. **String `"null"`** is a valid, matchable JavaScript string (unlike JSON `null`)
3. **Query parameters** in URLs are always strings, so `"null"` is natural
4. **Data providers** don't filter out string values, only JSON `null`/`undefined`
5. **API interpretation** treats `culture=null` as a valid filter parameter

This approach leverages how web technologies naturally work, rather than fighting against them.

---

## 🔮 Future Extensions

This pattern can be extended to:

- Multiple "special" values (e.g., `"all"`, `"none"`, `"any"`)
- Numeric filters with "unlimited" concepts (e.g., `price_max=null`)
- Date filters with "no limit" dates
- Boolean filters with "either" options

The principle remains the same: **use a string representation in the form that can be explicitly sent to the API**.

---

## 📞 Need Help?

If you encounter issues:

1. Check the 4 common pitfalls above
2. Review the reference implementation in EnquiryFilterStats
3. Verify your normalisation function handles all cases
4. Add console.logs to track value transformations through the pipeline
5. Check browser DevTools Network tab for the actual API call

Remember: The form value should always be the string `"null"`, never JSON `null` or `undefined`.

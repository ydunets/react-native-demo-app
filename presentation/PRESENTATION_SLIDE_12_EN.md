# 12) Sitemap Usefulness

**Sitemap** is an application "map" that shows all available screens and their structure for debugging, testing, and documentation.

**Example:**
```bash
npx uri-scheme open "expo-app-presentation://_sitemap" --ios
```

## 12) Sitemap usefulness:

✅ **Routing Debugging**
- See all available routes
- Check nesting correctness
- Detect missing routes

✅ **Dynamic Routes Validation**
- `[id]` parameters
- `[...slug]` catch-all routes
- Optional routes `[[[...slug]]]`

✅ **Group Validation**
- Check `(main)`, `(auth)`, `(tabs)` groups
- Correct exclusion from URL

✅ **Debug Navigation**
- Understand screen hierarchy
- Check layout structure
- Test deep links




## Fix ValuesPage clipping in 16:9 format

### Root Cause
The `PageContainer` scales the 595×842 content to 1280×720 using `transform: scale()` with `overflow: hidden`. The grid container has `maxWidth: 480` which constrains the boxes. Combined with the vertical compression (scaleY ≈ 0.855), the boxes get clipped.

### Edit

**`src/components/leads/proposal-pages/ValuesPage.tsx`** (single file change)
- Replace the grid container (lines 54-61) with `display: flex; flexDirection: row; gap: 32; width: "100%"` — remove `maxWidth: 480` and `gridTemplateColumns`
- Each box gets `flex: 1` instead of being sized by grid
- Reduce vertical padding from `60px` to `40px` to give more breathing room in the compressed vertical space
- Keep A4 format unchanged since flex row works for both

| Arquivo | Ação |
|---|---|
| `src/components/leads/proposal-pages/ValuesPage.tsx` | Replace grid with flex row, remove maxWidth, add flex:1 to boxes |


# EyeChain Rework Pack

This starter pack gives you:

- 3 richer intake sections for users
- a virtual wearables/API connection view
- a free local database using `localStorage`
- a daily tip modal that rotates once per day
- a visual threshold/system map panel

## Files

- `src/types/rework.ts`
- `src/data/reworkUsers.ts`
- `src/data/dailyTips.ts`
- `src/lib/reworkStore.ts`
- `src/components/rework/ReworkShell.tsx`
- `src/components/rework/DailyTipCard.tsx`
- `src/components/rework/ProfileIntakeStep.tsx`
- `src/components/rework/ConditionLifestyleStep.tsx`
- `src/components/rework/WearablesConnectStep.tsx`
- `src/components/rework/ConsentSubmitStep.tsx`
- `src/components/rework/UserDatabasePanel.tsx`
- `src/components/rework/SystemThresholdMap.tsx`
- `src/pages/Rework.tsx`

## Route wiring

Add this to `src/App.tsx`:

```tsx
import Rework from "./pages/Rework";

<Route path="/rework" element={<Rework />} />
```

Optional entry button somewhere in `Index.tsx`:

```tsx
import { Link } from "react-router-dom";

<Link to="/rework">Rework UX</Link>
```

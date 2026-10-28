# Performance Report

## Observations

- Dashboard uses `Promise.all` for parallel queries — good  
- Journal/Goals lists are unbounded-ish (capped journal at 100) — OK for MVP  
- Vision/Home remote Unsplash images — network dependent; consider caching/`expo-image` (already used)  
- No FlashList yet for long journals — low risk at MVP scale  
- AI affirmations mock mode avoids OpenAI latency in tests  

## Optimizations applied this session

- None beyond existing patterns (safe scope)

## Recommended next

- Paginate journal/goals  
- Compress uploaded vision images before Storage  
- Memoize heavy list rows when lists grow

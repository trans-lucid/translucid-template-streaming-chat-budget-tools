# Debrief

1. Where did you enforce budget, and why does that location prevent unnecessary model/tool work?

2. How does abort propagation stop both model streaming and tool execution?

3. What cache key did you choose for tool results, and what would make that key unsafe in production?

4. How does your implementation preserve stream event ordering when tool calls interleave with model tokens?

5. What signal would you add to production observability to detect budget bypasses or runaway tool loops?


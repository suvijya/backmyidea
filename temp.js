const fs = require('fs');  
const content = `  
-  
## 18. Performance Optimization & Query Consolidation  
A sweeping pass to optimize database query performance and resolve UI/UX issues. Addressed redundant N+1 user queries in server actions and properly exposed critical static files.  
### Database Query Optimization (Eliminating N+1 Lookups)  
Major bottlenecks were identified across all server actions where \`prisma.user.findUnique({ where: { clerkId } })\` was repeatedly called to fetch an internal user ID before running the actual query.  
| Component | Optimization |  
|---|---|  
| \`src/lib/clerk.ts\` | Enhanced \`getCachedUserPermissions\` with \`unstable_cache\` to fetch and memoize all commonly required user properties (\`id\`, \`username\`, \`isAdmin\`, \`onboarded\`, \`isEmployee\`, \`createdAt\`). Used a 5-minute cache window. |  
| \`src/actions/idea-actions.ts\` | Stripped redundant \`findUnique\` calls from \`createIdea\`, \`updateIdea\`, \`getIdeaBySlug\`, \`getIdeasFeed\`, \`getExploreFeed\`, \`getIdeasByUser\`. Swapped to cached permissions utility and replaced internal queries with relation \`where: { user: { clerkId } }\` lookups. |  
| \`src/actions/vote-actions.ts\` | Removed unoptimized sequential database lookups in \`castVote\`. Replaced with memoized \`getCachedUserPermissions\`. |  
| \`src/actions/comment-actions.ts\` | Stripped N+1 queries from \`createComment\`, \`togglePinComment\`, \`toggleHideComment\`, and \`upvoteComment\`. Leveraged the cached properties instead. |  
| \`src/actions/notification-actions.ts\` | Refactored \`getNotifications\` and \`getUnreadNotificationCount\` to utilize relation queries (\`where: { user: { clerkId } }\`) rather than requiring the internal user ID first. |  
| \`src/actions/user-actions.ts\` | Rewrote \`getMyUsername\`, \`getDashboardStats\`, and \`getDashboardIdeas\` to use the memoized cached properties instead of hitting the database on every load. |  
| \`src/app/api/me/route.ts\` | Replaced unoptimized raw \`prisma.user.findUnique\` query with \`getCachedUserPermissions\`. |  
| Search & Trending APIs | Updated \`/api/ideas/search/route.ts\` and \`/api/ideas/trending/route.ts\` to use relational query \`where: { user: { clerkId } }\` inside the returned votes relationship instead of blocking to fetch the \`currentUserId\`. |  
\`;  
fs.appendFileSync('PROGRESS.md', '\n\n' + content);  

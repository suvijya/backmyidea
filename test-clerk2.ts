import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(async (auth, req) => {
  // @ts-ignore
  console.log(typeof auth);
  // @ts-ignore
  console.log(typeof auth.protect);
  // @ts-ignore
  console.log(typeof (await auth()).protect);
});

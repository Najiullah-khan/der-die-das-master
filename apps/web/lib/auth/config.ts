import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasGithub = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
const hasResend = Boolean(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
    usePlural: false,
  }),

  // Guest play never requires auth; sign-in is an optional "save your progress" step
  // (blueprint §5) prompted after a session, not gated up front.
  socialProviders: {
    ...(hasGoogle && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    }),
    ...(hasGithub && {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    }),
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (!hasResend) {
          console.warn(`[auth] RESEND_API_KEY not set — magic link for ${email}: ${url}`);
          return;
        }
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
            to: email,
            subject: "Sign in to Der-Die-Das Master",
            html: `<p>Click <a href="${url}">here</a> to sign in.</p>`,
          }),
        });
      },
    }),
    nextCookies(), // must stay last in the plugins array (better-auth convention)
  ],
});

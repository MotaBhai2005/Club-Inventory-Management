import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID_PLACEHOLDER",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET_PLACEHOLDER"
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "GITHUB_CLIENT_ID_PLACEHOLDER",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "GITHUB_CLIENT_SECRET_PLACEHOLDER"
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return '/?error=oauth_missing_email';
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, name: user.name })
        });

        const data = await res.json();
        if (res.ok) {
          (user as any).accessToken = data.token;
          (user as any).role = data.role;
          return true;
        }

        return '/?error=oauth_backend';
      } catch (error: any) {
        console.error("SSO Catch Error:", error);
        return `/?error=oauth_unreachable&msg=${encodeURIComponent(error?.message || 'unknown')}`;
      }
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
      }

      // Fallback hydration: on some providers NextAuth does not preserve custom user fields from signIn.
      if (!token.accessToken) {
        const email = (user as any)?.email || token.email;
        const name = (user as any)?.name || token.name;

        if (!email) {
          (token as any).oauthError = 'oauth_missing_email';
          return token;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
          const res = await fetch(`${apiUrl}/oauth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name })
          });
          const data = await res.json();

          if (res.ok) {
            token.accessToken = data.token;
            token.role = data.role;
            delete (token as any).oauthError;
          } else {
            (token as any).oauthError = 'oauth_backend';
          }
        } catch (error: any) {
          console.error("SSO JWT Catch Error:", error);
          (token as any).oauthError = 'oauth_unreachable';
          (token as any).oauthErrorMsg = error?.message || 'unknown';
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.accessToken) {
        (session as any).accessToken = token.accessToken;
      }
      if (token?.role) {
        (session as any).role = token.role;
      }
      if ((token as any)?.oauthError) {
        (session as any).oauthError = (token as any).oauthError;
      }
      return session;
    }
  },
  pages: {
    signIn: '/', // Or a dedicated error page, but '/' works for our setup
    error: '/',
  }
})

export { handler as GET, handler as POST }
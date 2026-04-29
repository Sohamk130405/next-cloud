import { SignUp } from "@clerk/nextjs";
import { AuthScreen } from "@/components/auth-screen";

export default function SignUpPage() {
  return (
    <AuthScreen
      title="Create your vault"
      subtitle="Start with encrypted uploads and private Google Drive storage."
    >
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "var(--primary)",
            colorBackground: "transparent",
            colorText: "var(--foreground)",
            colorTextSecondary: "var(--muted-foreground)",
            colorInputBackground: "var(--background)",
            colorInputText: "var(--foreground)",
            borderRadius: "0.75rem",
          },
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none",
            card: "w-full border-0 bg-transparent p-0 shadow-none",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton:
              "h-11 rounded-xl border-border bg-background text-foreground shadow-none hover:bg-muted",
            formFieldInput:
              "h-11 rounded-xl border-border bg-background text-foreground shadow-none focus:ring-2 focus:ring-ring/25",
            formButtonPrimary:
              "h-11 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary/90",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
            footerActionLink: "text-primary hover:text-primary/80",
          },
        }}
      />
    </AuthScreen>
  );
}

import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">GroupSync</h1>
          <p className="text-muted-foreground">Welcome back to your team workspace</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Sparkles, Heart } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "",
    fullName: ""
  });
  
  const { signIn, signUp, loading, user } = useSupabaseAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(signInData.email, signInData.password);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      return; // Error will be shown by validation
    }

    try {
      await signUp(signUpData.email, signUpData.password, signUpData.fullName);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const isSignUpValid = signUpData.email && 
                       signUpData.password && 
                       signUpData.confirmPassword && 
                       signUpData.fullName &&
                       signUpData.password === signUpData.confirmPassword &&
                       signUpData.password.length >= 6;

  const isSignInValid = signInData.email && signInData.password;

  return (
    <div className="min-h-screen bg-gradient-calm flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-gradient-primary rounded-full">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Soulspace
          </h1>
          <p className="text-muted-foreground">
            Your digital sanctuary for gratitude and mindfulness
          </p>
        </div>

        {/* Auth Tabs */}
        <Card className="shadow-soft border-border/50">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <CardContent className="space-y-4">
                <div className="space-y-2 text-center">
                  <CardTitle className="text-xl">Welcome back</CardTitle>
                  <CardDescription>
                    Continue your gratitude journey
                  </CardDescription>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      className="rounded-xl border-border/50 focus:border-soul-purple"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        className="rounded-xl border-border/50 focus:border-soul-purple pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-soul-purple hover:bg-soul-purple/90 text-white shadow-soft"
                    disabled={loading || !isSignInValid}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <CardContent className="space-y-4">
                <div className="space-y-2 text-center">
                  <CardTitle className="text-xl">Create your sanctuary</CardTitle>
                  <CardDescription>
                    Begin your journey of gratitude and self-discovery
                  </CardDescription>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your beautiful name"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="rounded-xl border-border/50 focus:border-soul-purple"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      className="rounded-xl border-border/50 focus:border-soul-purple"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        className="rounded-xl border-border/50 focus:border-soul-purple pr-10"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signUpData.password && signUpData.password.length < 6 && (
                      <p className="text-xs text-destructive">Password must be at least 6 characters</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="rounded-xl border-border/50 focus:border-soul-purple"
                      required
                    />
                    {signUpData.confirmPassword && signUpData.password !== signUpData.confirmPassword && (
                      <p className="text-xs text-destructive">Passwords don't match</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-soul-purple hover:bg-soul-purple/90 text-white shadow-soft"
                    disabled={loading || !isSignUpValid}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Inspirational Quote */}
        <Card className="bg-gradient-primary text-white border-0 shadow-glow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Daily Inspiration</span>
            </div>
            <p className="text-white/90 text-sm italic">
              "Gratitude turns what we have into enough, and more. It turns denial into acceptance, chaos into order, confusion into clarity."
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
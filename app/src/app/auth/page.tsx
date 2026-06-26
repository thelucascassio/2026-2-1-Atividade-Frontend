"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    // Validação
    if (!username.trim() || !password.trim()) {
      setError("Preencha o usuário e a senha.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("https://dummyjson.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, expiresInMins: 30 }),
        credentials: "include",
      });

      if (!res.ok) {
        setError("Usuário ou senha inválidos.");
        return;
      }

      const data = await res.json();

      // Armazenar dados do usuário localmente
      localStorage.setItem("user", JSON.stringify(data));

      // Redirecionar para o dashboard
      router.push("/dashboard");
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              placeholder="ex: emilys"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button onClick={handleLogin} disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <p className="text-xs text-center text-zinc-400">
            Teste: usuário <strong>emilys</strong> / senha <strong>emilyspass</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
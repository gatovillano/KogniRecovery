'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaChallenge, setMfaChallenge] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaChallenge) {
      await handleMfaVerify();
      return;
    }

    setLoading(true);

    try {
      const response = await api.login(email, password);

      if (response.success && response.data) {
        if ('mfa_required' in response.data && response.data.mfa_required) {
          setMfaChallenge(response.data.challenge);
          toast.info('Ingresa el código de verificación de tu app de autenticación');
          return;
        }
        toast.success('Inicio de sesión exitoso');
        router.push(next);
        router.refresh();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al iniciar sesión';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!mfaChallenge) return;
    setLoading(true);

    try {
      const response = await api.loginMfa(mfaChallenge, mfaCode.trim());
      if (response.success) {
        toast.success('Inicio de sesión exitoso');
        router.push(next);
        router.refresh();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Código inválido';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground">
          N
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-[0.12em] text-primary">NUMA</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Clinical workspace
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <h1 className="text-xl font-semibold text-[#29443e]">Acceso para profesionales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa con tus credenciales de NUMA Clinical.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {mfaChallenge ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Código de verificación</Label>
                  <Input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Abre tu app de autenticación e ingresa el código de 6 dígitos.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Verificando...' : 'Verificar código'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setMfaChallenge(null);
                    setMfaCode('');
                  }}
                >
                  Volver
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="terapeuta@ejemplo.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 px-4 text-center text-xs text-muted-foreground/70">
        Plataforma de acompañamiento y recuperación · Acceso protegido y auditado.
      </p>
    </div>
  );
}

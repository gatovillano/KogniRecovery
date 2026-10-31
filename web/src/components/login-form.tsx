'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Panel de Terapeutas</CardTitle>
          <CardDescription className="text-center">
            Numa - Acceso para profesionales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
                  <p className="text-xs text-gray-500">
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
    </div>
  );
}

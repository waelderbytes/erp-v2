import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { login } from '@/lib/auth';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [ladend, setLadend] = useState(false);

  async function absenden(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setLadend(true);
    try {
      await login(email, passwort);
      navigate('/artikel');
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setLadend(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={absenden}>
          <CardHeader>
            <CardTitle>WälderBytes ERP</CardTitle>
            <CardDescription>Melde dich mit deinem Benutzerkonto an.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passwort">Passwort</Label>
              <Input id="passwort" type="password" value={passwort} onChange={(e) => setPasswort(e.target.value)} required />
            </div>
            {fehler && <p className="text-sm text-destructive">{fehler}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={ladend}>
              {ladend ? 'Anmelden…' : 'Anmelden'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

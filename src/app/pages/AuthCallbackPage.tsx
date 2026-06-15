import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { apiMe } from '@/lib/api';

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { dispatch } = useApp();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login');
      return;
    }
    localStorage.setItem('token', token);
    apiMe()
      .then(({ user }) => {
        dispatch({ type: 'SET_USER', payload: user });
        navigate('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
    </div>
  );
}

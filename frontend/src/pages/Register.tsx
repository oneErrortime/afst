import { Mail, Lock, UserCircle, LogIn } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, toast } from '@/components/ui';

export function Register() {
  const navigate = useNavigate();
  const { register: storeRegister } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Password required';
    else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!name) newErrors.name = 'Name required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await storeRegister(email, password, name);
      toast.success('Registration successful!');
      setTimeout(() => navigate('/books'), 500);
    } catch (error) {
      toast.error('Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
              <UserCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-gray-600">Join our digital library</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="John Doe"
              icon={<UserCircle className="h-5 w-5" />}
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
              icon={<Mail className="h-5 w-5" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              required
            />
          </div>

          <Button type="submit" className="w-full" loading={loading} size="lg">
            <LogIn className="h-5 w-5 mr-2" />
            Register
          </Button>

          <div className="text-center">
            <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
